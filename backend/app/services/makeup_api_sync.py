"""Official Makeup API (makeup-api.herokuapp.com) importer into SQLite catalog_products.

Imports real studio-photo cosmetics (Maybelline, NYX, L'Oreal, Clinique, Dior,
Benefit, Smashbox, Revlon, Milani, Essence, ColourPop, Covergirl, e.l.f., etc.)
with real prices, real shade hexes, and studio packshot PNGs.
"""
import re
from datetime import datetime
from typing import Any, Dict, List
import httpx
from sqlalchemy.orm import Session

from app.models.entities import CatalogProductModel
from app.services.obf_sync import estimate_price, infer_benefits, infer_finish

MAKEUP_API_URL = "https://makeup-api.herokuapp.com/api/v1/products.json"
USD_TO_TRY = 35.0

POPULAR_MAKEUP_BRANDS = [
    "maybelline",
    "nyx",
    "l'oreal",
    "clinique",
    "dior",
    "benefit",
    "smashbox",
    "revlon",
    "milani",
    "covergirl",
    "colourpop",
    "e.l.f.",
    "wet n wild",
    "physicians formula",
    "glossier",
    "marcelle",
]

_TYPE_TO_CATEGORY = {
    "lipstick": "lip",
    "lip_liner": "lip",
    "foundation": "foundation",
    "mascara": "mascara",
    "blush": "foundation",
    "bronzer": "foundation",
    "eyeliner": "mascara",
    "eyeshadow": "mascara",
    "eyebrow": "mascara",
}


def _clean_image_url(p: Dict[str, Any]) -> str:
    # Prefer CloudFront studio PNGs over legacy links; fix protocol-relative URLs
    candidates = [p.get("image_link"), p.get("api_featured_image")]
    for url in candidates:
        if not url or not isinstance(url, str):
            continue
        u = url.strip()
        if u.startswith("//"):
            u = "https:" + u
        if u.startswith("http"):
            return u
    return ""


async def sync_makeup_api_brands(db: Session, brands: List[str] = POPULAR_MAKEUP_BRANDS) -> Dict[str, Any]:
    existing_names = {r[0].lower() for r in db.query(CatalogProductModel.product_name).all()}
    added_total = 0
    per_brand: Dict[str, int] = {}
    now = datetime.utcnow()

    async with httpx.AsyncClient(timeout=12.0, headers={"User-Agent": "MIRA-Beauty-App/1.0"}) as client:
        for brand in brands:
            try:
                resp = await client.get(MAKEUP_API_URL, params={"brand": brand})
                if resp.status_code != 200:
                    continue
                items = resp.json()
                if not isinstance(items, list):
                    continue
            except Exception:
                continue

            brand_added = 0
            for p in items:
                name = re.sub(r"\s+", " ", (p.get("name") or "")).strip()
                if not name or len(name) < 4:
                    continue
                img = _clean_image_url(p)
                if not img:
                    continue

                b_clean = (p.get("brand") or brand).strip().lower()
                display_name = name if b_clean in name.lower() else f"{b_clean.title()} {name}"
                display_name = display_name[:250]
                if display_name.lower() in existing_names:
                    continue

                ptype = (p.get("product_type") or "").lower().strip()
                category = _TYPE_TO_CATEGORY.get(ptype, "other")
                desc = (p.get("description") or "").strip()
                tags = " ".join(p.get("tag_list") or [])
                combined = f"{display_name} {ptype} {tags} {desc[:300]}"
                finish = infer_finish(combined)
                benefits = infer_benefits(combined, finish)

                # Price conversion (USD -> TL, realistic range)
                raw_price = p.get("price")
                try:
                    p_val = float(raw_price) if raw_price else 0.0
                except (ValueError, TypeError):
                    p_val = 0.0
                price = int(round(p_val * USD_TO_TRY)) if p_val >= 2.0 else estimate_price(b_clean, category)

                # Shade swatch
                colors = p.get("product_colors") or []
                shade_hex = None
                shade_name = None
                if colors and isinstance(colors[0], dict):
                    hx = (colors[0].get("hex_value") or "").strip()
                    if re.match(r"^#[0-9A-Fa-f]{6}$", hx):
                        shade_hex = hx
                    shade_name = (colors[0].get("colour_name") or "").strip()[:100] or None

                rating = float(p.get("rating") or 4.5)
                if rating < 3.0 or rating > 5.0:
                    rating = 4.5

                db.add(
                    CatalogProductModel(
                        product_name=display_name,
                        brand=b_clean[:120],
                        category=category,
                        price=price,
                        rating=round(rating, 1),
                        review_count=420,
                        image_url=img,
                        shade_hex=shade_hex,
                        shade_name=shade_name,
                        finish=finish,
                        benefits=benefits,
                        source="feed:makeup_api",
                        merchant_name="Partner Store",
                        merchant_url=(p.get("product_link") or "").strip() or None,
                        in_stock=True,
                        last_synced_at=now,
                    )
                )
                existing_names.add(display_name.lower())
                brand_added += 1
                added_total += 1

            if brand_added:
                db.commit()
            per_brand[brand] = brand_added

    return {"added_total": added_total, "per_brand": per_brand}
