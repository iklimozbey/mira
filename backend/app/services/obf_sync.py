"""Open Beauty Facts official JSON API sync + SQLite catalog manager."""
import re
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy.orm import Session

from app.models.entities import CatalogProductModel
from app.services.catalog_service import POPULAR_BRAND_CATALOG

OBF_SEARCH_URL = "https://world.openbeautyfacts.org/cgi/search.pl"

_LUXURY_BRANDS = {"dior", "nars", "chanel", "ysl", "estee lauder", "estée lauder", "clinique", "mac", "m.a.c", "lancome", "lancôme", "rare beauty", "charlotte tilbury", "shiseido"}
_DERMO_BRANDS = {"la roche-posay", "la roche", "bioderma", "cerave", "avene", "avène", "vichy", "eucerin", "uriage", "paula's choice"}
_VALUE_BRANDS = {"flormar", "pastel", "golden rose", "essence", "note", "catrice", "beaulis", "the purest"}

_BASE_PRICES = {
    "lip": 380,
    "foundation": 480,
    "mascara": 420,
    "sunscreen": 650,
    "moisturizer": 490,
    "serum": 460,
    "other": 350,
}

_CURATED_META = {
    "Flormar Kiss Me More Lip Tattoo": ("matte", ["long_wear", "transfer_proof", "matte"]),
    "Flormar Water Lip Stain": ("natural", ["lightweight", "natural", "tint", "long_wear"]),
    "Maybelline SuperStay Vinyl Ink": ("glossy", ["glossy", "shiny", "long_wear", "transfer_proof"]),
    "Maybelline Lifter Gloss": ("glossy", ["glossy", "shiny", "hydrating", "plumping", "dry_skin"]),
    "Maybelline SuperStay Matte Ink": ("matte", ["matte", "long_wear", "transfer_proof"]),
    "Kiko 3D Hydra Lipgloss": ("glossy", ["glossy", "shiny", "hydrating", "plumping"]),
    "Golden Rose Velvet Matte Lipstick": ("matte", ["matte", "velvet", "pigmented"]),
    "Pastel Classic Satin Lipstick": ("satin", ["satin", "creamy", "hydrating", "dry_skin"]),
    "Maybelline Color Sensational Satin Lipstick": ("satin", ["satin", "creamy", "hydrating", "dry_skin"]),
    "Flormar Deluxe Cashmere Stylo Satin": ("satin", ["satin", "creamy", "pigmented"]),
    "Flormar Precious Curl Mascara": ("natural", ["curling", "lifting"]),
    "Flormar Hero Volume & Curl Mascara": ("natural", ["volumizing", "curling"]),
    "Maybelline Sky High Mascara": ("natural", ["lengthening", "lightweight"]),
    "Maybelline Lash Sensational Fan": ("natural", ["volumizing", "separating"]),
    "L'Oreal Telescopic Mascara": ("natural", ["lengthening", "separating"]),
    "Flormar Perfect Coverage Foundation": ("matte", ["high_coverage", "long_wear", "blemish_cover", "matte"]),
    "Maybelline Fit Me Matte + Poreless": ("matte", ["matte", "oil_control", "pore_minimizing", "oily_skin", "sebum"]),
    "L'Oreal Infallible 24H Fresh Wear": ("satin", ["satin", "long_wear", "lightweight", "natural", "combination_skin"]),
    "Note Luminous Moisturizing Satin Foundation": ("satin", ["satin", "hydrating", "dry_skin", "natural"]),
    "La Roche-Posay Anthelios UVMune 400": ("natural", ["spf", "lightweight", "oil_control", "sensitive_skin", "oily_skin"]),
    "La Roche-Posay Cicaplast Baume B5+": ("dewy", ["barrier_repair", "soothing", "redness", "sensitive_skin", "dry_skin", "hydrating"]),
    "CeraVe Moisturizing Cream": ("natural", ["hydrating", "barrier_repair", "dry_skin", "sensitive_skin"]),
    "The Ordinary Niacinamide 10% + Zinc 1%": ("matte", ["oil_control", "sebum", "pore_minimizing", "acne_care", "oily_skin", "matte"]),
    "The Ordinary Hyaluronic Acid 2% + B5": ("dewy", ["hydrating", "plumping", "dry_skin", "barrier_repair"]),
    "The Purest Solutions Niacinamide 5% Serum": ("matte", ["oil_control", "sebum", "pore_minimizing", "acne_care", "oily_skin"]),
    "Garnier Vitamin C Brightening Serum": ("natural", ["brightening", "lightweight", "natural", "hydrating"]),
}


def classify_category(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["lipstick", "lip gloss", "lipgloss", "lip balm", "lip stain", "lip oil", "ruj", "rouge à lèvres", "lèvres", "lip"]):
        return "lip"
    if any(k in t for k in ["mascara", "lash", "rimel", "kirpik"]):
        return "mascara"
    if any(k in t for k in ["foundation", "fond de teint", "fondöten", "concealer", "bb cream", "cc cream", "skin tint", "fit me", "infallible"]):
        return "foundation"
    if any(k in t for k in ["spf", "sunscreen", "sun ", "solaire", "anthelios", "uv", "güneş"]):
        return "sunscreen"
    if any(k in t for k in ["serum", "sérum", "niacinamide", "retinol", "hyaluronic", "vitamin c", "salicylic", "glycolic", "azelaic", "ampoule"]):
        return "serum"
    if any(k in t for k in ["cream", "crème", "moistur", "lotion", "baume", "balm", "hydrat", "nemlendirici", "cicaplast", "gel-cream"]):
        return "moisturizer"
    return "other"


def infer_finish(text: str) -> str:
    t = text.lower()
    if any(k in t for k in ["satin", "saten", "creamy", "velouté", "semi-matte", "cashmere"]):
        return "satin"
    if any(k in t for k in ["gloss", "vinyl", "shine", "shiny", "parlak", "brillant", "lip oil", "lacquer"]):
        return "glossy"
    if any(k in t for k in ["matte", "mat ", " mat", "velvet", "powder", "oil control", "poreless"]):
        return "matte"
    if any(k in t for k in ["dewy", "glow", "luminous", "radiant", "baume", "hydrating serum"]):
        return "dewy"
    return "natural"


def infer_benefits(text: str, finish: str) -> List[str]:
    t = text.lower()
    b = set()
    if finish != "natural":
        b.add(finish)
    rules = {
        "oil_control": ["oil", "sebum", "matte", "matifiant", "anti-shine", "poreless", "zinc", "t-zone"],
        "pore_minimizing": ["pore", "niacinamide", "salicylic", "bha"],
        "acne_care": ["acne", "blemish", "salicylic", "niacinamide", "effaclar", "sebium", "sébium"],
        "hydrating": ["hydrat", "hyaluronic", "ceramide", "glycerin", "shea", "moistur", "nem", "aqua"],
        "barrier_repair": ["barrier", "ceramide", "panthenol", "b5", "cicaplast", "cica", "centella", "sensibio", "sooth", "sensitive"],
        "spf": ["spf", "uv", "sun", "solaire", "anthelios"],
        "long_wear": ["24h", "16h", "superstay", "infallible", "long", "tattoo", "waterproof"],
        "volumizing": ["volume", "volum", "colossal", "falsies", "lash sensational"],
        "curling": ["curl", "lift", "recourb"],
        "lengthening": ["length", "sky high", "telescopic", "extend"],
        "brightening": ["vitamin c", "vitamine c", "bright", "glow", "niacinamide", "dark spot"],
    }
    for tag, kws in rules.items():
        if any(k in t for k in kws):
            b.add(tag)
    return sorted(b)


def estimate_price(brand: str, category: str) -> int:
    b = brand.lower().strip()
    base = _BASE_PRICES.get(category, 380)
    if any(x in b for x in _LUXURY_BRANDS):
        return int(base * 2.4)
    if any(x in b for x in _DERMO_BRANDS):
        return int(base * 1.35)
    if any(x in b for x in _VALUE_BRANDS):
        return int(base * 0.72)
    return base


def model_to_dict(row: CatalogProductModel) -> Dict[str, Any]:
    return {
        "id": row.id,
        "product_name": row.product_name,
        "brand": row.brand,
        "category": row.category,
        "price": row.price,
        "rating": row.rating,
        "review_count": row.review_count,
        "image_url": row.image_url,
        "shade_hex": row.shade_hex,
        "shade_name": row.shade_name,
        "finish": row.finish,
        "benefits": row.benefits or [],
        "ingredients_text": row.ingredients_text,
        "source": row.source,
        "merchant_name": row.merchant_name,
        "merchant_url": row.merchant_url,
        "in_stock": True if row.in_stock is None else bool(row.in_stock),
    }


def seed_curated_products(db: Session) -> int:
    """Ensure curated high-quality products exist in SQLite catalog_products."""
    existing = {r[0].lower() for r in db.query(CatalogProductModel.product_name).all()}
    added = 0
    for item in POPULAR_BRAND_CATALOG:
        name = item["product_name"]
        if name.lower() in existing:
            continue
        finish, benefits = _CURATED_META.get(name, (infer_finish(name), infer_benefits(name, "natural")))
        row = CatalogProductModel(
            product_name=name,
            brand=item["brand"],
            category=item["category"],
            price=int(item.get("price", 399)),
            rating=float(item.get("rating", 4.5)),
            review_count=int(item.get("review_count", 1000)),
            image_url=item.get("image_url"),
            shade_hex=item.get("shade_hex"),
            shade_name=item.get("shade_name"),
            finish=finish,
            benefits=benefits,
            source="curated",
        )
        db.add(row)
        existing.add(name.lower())
        added += 1
    if added:
        db.commit()
    return added


async def fetch_and_cache_obf(db: Session, query: str, page_size: int = 12) -> List[Dict[str, Any]]:
    """Query official Open Beauty Facts JSON API and cache valid cosmetic products into SQLite."""
    params = {
        "search_terms": query,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": page_size,
        "fields": "code,product_name,brands,categories,image_front_small_url,image_front_url,ingredients_text,ingredients_text_en",
    }
    try:
        async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "MIRA-Beauty-App/1.0"}) as client:
            resp = await client.get(OBF_SEARCH_URL, params=params)
            if resp.status_code != 200:
                return []
            raw_products = resp.json().get("products") or []
    except Exception:
        return []

    existing_barcodes = {r[0] for r in db.query(CatalogProductModel.barcode).filter(CatalogProductModel.barcode.isnot(None)).all()}
    existing_names = {r[0].lower() for r in db.query(CatalogProductModel.product_name).all()}

    saved: List[Dict[str, Any]] = []
    for p in raw_products:
        name = (p.get("product_name") or "").strip()
        brand_raw = (p.get("brands") or "").strip()
        image = p.get("image_front_url") or p.get("image_front_small_url")
        barcode = (p.get("code") or "").strip() or None
        if not name or len(name) < 4 or not image:
            continue
        brand = brand_raw.split(",")[0].strip().lower() if brand_raw else query.strip().lower()
        if not brand:
            continue

        # Clean display name: include brand prefix if missing
        display_name = name if brand in name.lower() else f"{brand.title()} {name}"
        display_name = re.sub(r"\s+", " ", display_name)[:200]

        if (barcode and barcode in existing_barcodes) or display_name.lower() in existing_names:
            continue

        cats_raw = p.get("categories") or ""
        ing = p.get("ingredients_text_en") or p.get("ingredients_text") or ""
        combined = f"{display_name} {cats_raw} {ing[:300]}"
        category = classify_category(combined)
        finish = infer_finish(f"{display_name} {cats_raw}")
        benefits = infer_benefits(combined, finish)
        price = estimate_price(brand, category)

        row = CatalogProductModel(
            barcode=barcode,
            product_name=display_name,
            brand=brand,
            category=category,
            price=price,
            rating=4.4,
            review_count=350,
            image_url=image,
            finish=finish,
            benefits=benefits,
            ingredients_text=ing[:2000] if ing else None,
            source="open_beauty_facts",
        )
        db.add(row)
        if barcode:
            existing_barcodes.add(barcode)
        existing_names.add(display_name.lower())
        saved.append(model_to_dict(row))

    if saved:
        db.commit()
    return saved
