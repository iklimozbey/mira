"""Affiliate Product Feed Importer (Google Merchant XML, Admitad/GelirOrtaklari YML XML, CSV, JSON).

Supports:
- Google Merchant Center RSS/Atom XML (<item> / <entry>)
- Admitad / GelirOrtaklari YML XML (<yml_catalog><shop><offers><offer>)
- CSV feeds (comma or semicolon separated)
- JSON arrays / {products: [...]}
"""
import csv
import io
import json
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
        cleaned = raw.replace(",", ".")
        m = re.search(r"(\d+(?:\.\d+)?)", cleaned)
        if m:
            val = int(round(float(m.group(1))))
            if val > 0:
                return val
    return estimate_price(fallback_brand, fallback_category)


def parse_google_merchant_xml(xml_text: str, merchant_name: str = "Trendyol") -> List[Dict[str, Any]]:
    """Parse Google Merchant (<item>/<entry>) OR Admitad/GelirOrtaklari YML (<offer>) XML."""
    root = ET.fromstring(xml_text.strip())
    items: List[Dict[str, Any]] = []

    def _get(node: ET.Element, *names: str) -> str:
        for n in names:
            el = node.find(n)
            if el is not None and el.text and el.text.strip():
                return el.text.strip()
        return ""

    # 1. Admitad / GelirOrtaklari YML <offer> format
    offers = root.findall(".//offer")
    if offers:
        cat_map = {
            c.attrib.get("id", ""): (c.text or "").strip()
            for c in root.findall(".//categories/category")
        }
        for node in offers:
            title = _get(node, "name", "model", "title")
            if not title:
                continue
            brand = _get(node, "vendor", "brand") or title.split()[0]
            raw_price = _get(node, "price", "oldprice")
            image = _get(node, "picture", "image", "image_link")
            link = _get(node, "url", "link")
            barcode = _get(node, "barcode", "vendorCode", "gtin") or None
            cat_id = _get(node, "categoryId")
            ptype = cat_map.get(cat_id, _get(node, "typePrefix", "category"))
            in_stock = node.attrib.get("available", "true").lower() != "false"
            items.append({
                "product_name": title,
                "brand": brand.lower().strip(),
                "raw_price": raw_price,
                "image_url": image or None,
                "merchant_url": link or None,
                "merchant_name": merchant_name,
                "barcode": barcode,
                "raw_category": ptype,
                "in_stock": in_stock,
            })
        return items

    # 2. Google Merchant RSS/Atom <item> / <entry> format
    for node in root.findall(".//item") + root.findall(".//{http://www.w3.org/2005/Atom}entry"):
        title = _get(node, "title", f"{_G_NS}title", "{http://www.w3.org/2005/Atom}title")
        if not title:
            continue
        brand = _get(node, f"{_G_NS}brand", "brand") or title.split()[0]
        raw_price = _get(node, f"{_G_NS}sale_price", f"{_G_NS}price", "price")
        image = _get(node, f"{_G_NS}image_link", "image_link", "image", "picture")
        link = _get(node, "link", f"{_G_NS}link", "url")
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


def parse_csv_feed(csv_text: str, merchant_name: str = "Trendyol") -> List[Dict[str, Any]]:
    """Parse semicolon or comma separated affiliate CSV feeds."""
    sample = csv_text[:2048]
    delimiter = ";" if sample.count(";") > sample.count(",") else ","
    reader = csv.DictReader(io.StringIO(csv_text.strip()), delimiter=delimiter)
    items: List[Dict[str, Any]] = []
    for row in reader:
        norm = {k.strip().lower(): (v or "").strip() for k, v in row.items() if k}
        title = norm.get("name") or norm.get("title") or norm.get("product_name") or ""
        if not title:
            continue
        items.append({
            "product_name": title,
            "brand": (norm.get("brand") or norm.get("vendor") or title.split()[0]).lower(),
            "raw_price": norm.get("sale_price") or norm.get("price") or "",
            "image_url": norm.get("picture") or norm.get("image_link") or norm.get("image_url") or norm.get("image") or None,
            "merchant_url": norm.get("url") or norm.get("link") or norm.get("merchant_url") or None,
            "merchant_name": merchant_name,
            "barcode": norm.get("barcode") or norm.get("gtin") or None,
            "raw_category": norm.get("category") or norm.get("product_type") or "",
            "in_stock": "out" not in (norm.get("availability") or "in stock").lower(),
        })
    return items


def upsert_feed_items(db: Session, items: List[Dict[str, Any]], default_merchant: str = "Trendyol") -> Dict[str, int]:
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


async def import_feed_from_url(db: Session, feed_url: str, merchant_name: str = "Trendyol") -> Dict[str, int]:
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers={"User-Agent": "MIRA-FeedImporter/1.0"}) as client:
        resp = await client.get(feed_url)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "").lower()
        body = resp.text.strip()

    if "json" in content_type or body.startswith("[") or body.startswith("{"):
        parsed = json.loads(body)
        items = parsed if isinstance(parsed, list) else parsed.get("products") or parsed.get("items") or []
    elif body.startswith("<"):
        items = parse_google_merchant_xml(body, merchant_name=merchant_name)
    else:
        items = parse_csv_feed(body, merchant_name=merchant_name)

    return upsert_feed_items(db, items, default_merchant=merchant_name)
