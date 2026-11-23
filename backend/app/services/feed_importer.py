"""Standard Google Merchant XML & JSON Affiliate Feed Importer.

Compatible with Trendyol, Watsons, Gratis, Sephora, Hepsiburada, and any
Google Merchant Center RSS/XML or JSON product feed.
"""
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy.orm import Session

from app.models.entities import CatalogProductModel
from app.services.obf_sync import classify_category, estimate_price, infer_benefits, infer_finish

_G_NS = "{http://base.google.com/ns/1.0}"


def parse_price_int(raw: Any, fallback_brand: str, fallback_category: str) -> int:
    if isinstance(raw, (int, float)) and raw > 0:
        return int(round(raw))
    if isinstance(raw, str):
        # Handles "429.90 TRY", "429,90 TL", "₺ 429"
        cleaned = raw.replace(",", ".")
        m = re.search(r"(\d+(?:\.\d+)?)", cleaned)
        if m:
            val = int(round(float(m.group(1))))
            if val > 0:
                return val
    return estimate_price(fallback_brand, fallback_category)


def parse_google_merchant_xml(xml_text: str, merchant_name: str = "partner") -> List[Dict[str, Any]]:
    """Parse a Google Merchant RSS/Atom XML feed into normalized product dicts."""
    root = ET.fromstring(xml_text.strip())
    items: List[Dict[str, Any]] = []

    def _get(node: ET.Element, *names: str) -> str:
        for n in names:
            el = node.find(n)
            if el is not None and el.text and el.text.strip():
                return el.text.strip()
        return ""

    for node in root.findall(".//item") + root.findall(".//{http://www.w3.org/2005/Atom}entry"):
        title = _get(node, "title", f"{_G_NS}title", "{http://www.w3.org/2005/Atom}title")
        if not title:
            continue
        brand = _get(node, f"{_G_NS}brand", "brand") or title.split()[0]
        raw_price = _get(node, f"{_G_NS}sale_price", f"{_G_NS}price", "price")
        image = _get(node, f"{_G_NS}image_link", "image_link", "image")
        link = _get(node, "link", f"{_G_NS}link")
        gtin = _get(node, f"{_G_NS}gtin", "gtin", "barcode") or None
        ptype = _get(node, f"{_G_NS}product_type", "product_type", "category")
        avail = _get(node, f"{_G_NS}availability", "availability").lower()
        in_stock = "out" not in avail

        items.append({
            "product_name": title,
            "brand": brand.lower().strip(),
            "raw_price": raw_price,
            "image_url": image or None,
            "merchant_url": link or None,
            "merchant_name": merchant_name,
            "barcode": gtin,
            "raw_category": ptype,
            "in_stock": in_stock,
        })
    return items


def upsert_feed_items(db: Session, items: List[Dict[str, Any]], default_merchant: str = "partner") -> Dict[str, int]:
    """Upsert normalized feed items into catalog_products (updates price/stock/image if already present)."""
    created = 0
    updated = 0
    now = datetime.utcnow()

    for raw in items:
        name = (raw.get("product_name") or raw.get("title") or "").strip()
        if not name:
            continue
        brand = (raw.get("brand") or name.split()[0]).strip().lower()
        raw_cat = raw.get("raw_category") or raw.get("category") or ""
        category = raw_cat if raw_cat in {"lip", "foundation", "mascara", "sunscreen", "moisturizer", "serum"} else classify_category(f"{name} {raw_cat}")
        finish = raw.get("finish") or infer_finish(f"{name} {raw_cat}")
        benefits = raw.get("benefits") or infer_benefits(f"{name} {raw_cat}", finish)
        price = parse_price_int(raw.get("price") or raw.get("raw_price"), brand, category)
        barcode = (raw.get("barcode") or raw.get("gtin") or "").strip() or None
        image_url = raw.get("image_url") or raw.get("image_link")
        merchant_url = raw.get("merchant_url") or raw.get("link") or raw.get("url")
        merchant_name = raw.get("merchant_name") or default_merchant
        in_stock = bool(raw.get("in_stock", True))

        existing: Optional[CatalogProductModel] = None
        if barcode:
            existing = db.query(CatalogProductModel).filter(CatalogProductModel.barcode == barcode).first()
        if not existing:
            existing = db.query(CatalogProductModel).filter(CatalogProductModel.product_name.ilike(name)).first()

        if existing:
            existing.price = price
            existing.in_stock = in_stock
            existing.last_synced_at = now
            if image_url:
                existing.image_url = image_url
            if merchant_url:
                existing.merchant_url = merchant_url
            if merchant_name:
                existing.merchant_name = merchant_name
            if barcode and not existing.barcode:
                existing.barcode = barcode
            updated += 1
        else:
            db.add(
                CatalogProductModel(
                    barcode=barcode,
                    product_name=name[:255],
                    brand=brand[:120],
                    category=category,
                    price=price,
                    rating=float(raw.get("rating", 4.6)),
                    review_count=int(raw.get("review_count", 250)),
                    image_url=image_url,
                    shade_hex=raw.get("shade_hex"),
                    shade_name=raw.get("shade_name"),
                    finish=finish,
                    benefits=benefits,
                    source=f"feed:{merchant_name}",
                    merchant_name=merchant_name,
                    merchant_url=merchant_url,
                    in_stock=in_stock,
                    last_synced_at=now,
                )
            )
            created += 1

    db.commit()
    return {"created": created, "updated": updated, "total_processed": created + updated}


async def import_feed_from_url(db: Session, feed_url: str, merchant_name: str = "partner") -> Dict[str, int]:
    async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": "MIRA-FeedImporter/1.0"}) as client:
        resp = await client.get(feed_url)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "").lower()
        body = resp.text.strip()

    if "json" in content_type or body.startswith("[") or body.startswith("{"):
        import json
        parsed = json.loads(body)
        items = parsed if isinstance(parsed, list) else parsed.get("products") or parsed.get("items") or []
    else:
        items = parse_google_merchant_xml(body, merchant_name=merchant_name)

    return upsert_feed_items(db, items, default_merchant=merchant_name)
