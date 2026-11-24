from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import CatalogProductModel, InventoryItem, User, UserProfile
from app.services.feed_importer import import_feed_from_url, parse_google_merchant_xml, upsert_feed_items
from app.services.obf_sync import fetch_and_cache_obf, infer_benefits, infer_finish, model_to_dict, seed_curated_products
from app.services.recommender_service import recommend_top3

router = APIRouter()


class ChatPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=2)
    lang: str = Field("en")
    history: list = Field(default_factory=list)


class FeedImportRequest(BaseModel):
    merchant_name: str = Field("partner", min_length=2)
    feed_url: Optional[str] = None
    xml_content: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None


class CreateCatalogProductRequest(BaseModel):
    product_name: str = Field(..., min_length=2, max_length=255)
    brand: str = Field(..., min_length=1, max_length=120)
    category: str = Field("other", max_length=50)
    price: int = Field(..., ge=1, le=100000)
    image_url: Optional[str] = None
    finish: Optional[str] = None
    merchant_name: Optional[str] = Field(None, max_length=100)
    merchant_url: Optional[str] = Field(None, max_length=1024)


def _load_catalog(db: Session) -> list:
    rows = db.query(CatalogProductModel).all()
    if not rows:
        seed_curated_products(db)
        rows = db.query(CatalogProductModel).all()
    return [model_to_dict(r) for r in rows]


@router.get("/")
async def list_catalog(
    category: Optional[str] = None,
    q: Optional[str] = None,
    limit: int = 60,
    db: Session = Depends(get_db),
):
    """Public product catalog backed by SQLite + live Open Beauty Facts search cache."""
    query = db.query(CatalogProductModel)
    # In default Discover browsing (no search text), only show clean studio-verified products
    # (never amateur hand-held OBF photos). Explicit search queries still search the full catalog.
    if not (q and q.strip()):
        query = query.filter(
            or_(
                CatalogProductModel.source == "curated",
                CatalogProductModel.source == "manual",
                CatalogProductModel.source.like("feed:%"),
            )
        )
    if category and category != "all":
        query = query.filter(CatalogProductModel.category == category)
    if q and q.strip():
        import re
        q_clean = q.strip()
        m_budget = re.search(r"(\d{2,5})\s*(?:tl|try|lira|₺)?\s*(?:altı|alti|under|max)", q_clean.lower())
        if m_budget:
            max_p = int(m_budget.group(1))
            query = query.filter(CatalogProductModel.price <= max_p)
            q_clean = re.sub(r"(\d{2,5})\s*(?:tl|try|lira|₺)?\s*(?:altı|alti|under|max)", "", q_clean, flags=re.IGNORECASE).strip()
        if q_clean:
            like = f"%{q_clean}%"
            query = query.filter(
                or_(
                    CatalogProductModel.product_name.ilike(like),
                    CatalogProductModel.brand.ilike(like),
                )
            )
    else:
        q_clean = ""

    rows = (
        query.order_by(CatalogProductModel.rating.desc(), CatalogProductModel.review_count.desc())
        .limit(limit)
        .all()
    )

    # Only call live OBF if there's an actual product/brand text query (not just a budget filter like "200 tl altı")
    if q_clean and len(q_clean) >= 3 and len(rows) < 3:
        await fetch_and_cache_obf(db, q_clean, page_size=10)
        rows = (
            query.order_by(CatalogProductModel.rating.desc(), CatalogProductModel.review_count.desc())
            .limit(limit)
            .all()
        )

    return [model_to_dict(r) for r in rows]


@router.get("/daily-top3")
async def get_daily_top3(
    lang: str = "en",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return today's top 3 personalized product picks based on skin profile, budget, and shelf."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    inventory = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
    catalog_items = _load_catalog(db)
    return await recommend_top3(prompt=None, profile=profile, inventory=inventory, lang=lang, catalog_items=catalog_items)


@router.post("/chat")
async def chat_recommend(
    req: ChatPromptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Home chatbot endpoint: searches SQLite catalog (+ live Open Beauty Facts fallback) and returns top 3."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    inventory = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
    catalog_items = _load_catalog(db)
    result = await recommend_top3(
        prompt=req.prompt,
        profile=profile,
        inventory=inventory,
        lang=req.lang,
        history=req.history,
        catalog_items=catalog_items,
    )

    # If 0 matches in local DB, try fetching live from Open Beauty Facts and re-running!
    if not result["products"] and len(req.prompt.strip()) >= 3:
        fetched = await fetch_and_cache_obf(db, req.prompt.strip(), page_size=12)
        if fetched:
            catalog_items = _load_catalog(db)
            result = await recommend_top3(
                prompt=req.prompt,
                profile=profile,
                inventory=inventory,
                lang=req.lang,
                history=req.history,
                catalog_items=catalog_items,
            )

    return result


@router.get("/lookup")
def lookup_product(name: str, db: Session = Depends(get_db)):
    """Look up catalog metadata (image, price, shade, merchant link) for a product name."""
    cleaned = name.strip()
    if not cleaned:
        return None
    row = db.query(CatalogProductModel).filter(CatalogProductModel.product_name.ilike(cleaned)).first()
    if not row:
        row = db.query(CatalogProductModel).filter(CatalogProductModel.product_name.ilike(f"%{cleaned}%")).first()
    return model_to_dict(row) if row else None


@router.post("/import-feed")
async def import_merchant_feed(
    req: FeedImportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Import products from a standard Google Merchant XML/JSON affiliate feed (URL, XML body, or JSON list)."""
    if req.feed_url:
        return await import_feed_from_url(db, req.feed_url, merchant_name=req.merchant_name)
    if req.xml_content:
        items = parse_google_merchant_xml(req.xml_content, merchant_name=req.merchant_name)
        return upsert_feed_items(db, items, default_merchant=req.merchant_name)
    if req.items is not None:
        return upsert_feed_items(db, req.items, default_merchant=req.merchant_name)
    raise HTTPException(status_code=400, detail="Provide feed_url, xml_content, or items.")


_ALLOWED_CATEGORIES = {"lip", "foundation", "mascara", "sunscreen", "moisturizer", "serum", "other"}
_ALLOWED_FINISHES = {"matte", "satin", "glossy", "dewy", "natural"}


@router.post("/products")
def add_catalog_product(
    req: CreateCatalogProductRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new product (or update an existing one by name) with its real photo and store link."""
    name = req.product_name.strip()
    brand = req.brand.strip().lower()
    category = req.category.strip().lower()
    if category not in _ALLOWED_CATEGORIES:
        category = "other"

    finish = (req.finish or "").strip().lower()
    if finish not in _ALLOWED_FINISHES:
        finish = infer_finish(name)

    image_url = (req.image_url or "").strip() or None
    if image_url and not (
        image_url.startswith("https://")
        or image_url.startswith("http://")
        or image_url.startswith("/static/")
        or image_url.startswith("data:image/")
    ):
        raise HTTPException(status_code=400, detail="Image must be a valid URL or uploaded photo.")
    if image_url and len(image_url) > 500_000:
        raise HTTPException(status_code=400, detail="Uploaded image is too large.")

    merchant_url = (req.merchant_url or "").strip() or None
    if merchant_url and not (merchant_url.startswith("https://") or merchant_url.startswith("http://")):
        raise HTTPException(status_code=400, detail="Store link must start with http:// or https://.")

    merchant_name = (req.merchant_name or "").strip() or None
    benefits = infer_benefits(f"{name} {brand} {category}", finish)

    existing = db.query(CatalogProductModel).filter(CatalogProductModel.product_name.ilike(name)).first()
    if existing:
        existing.brand = brand
        existing.category = category
        existing.price = req.price
        existing.finish = finish
        existing.benefits = benefits
        if image_url is not None:
            existing.image_url = image_url
        if merchant_name is not None:
            existing.merchant_name = merchant_name
        if merchant_url is not None:
            existing.merchant_url = merchant_url
        existing.source = "manual"
        existing.in_stock = True
        db.commit()
        db.refresh(existing)
        return model_to_dict(existing)

    row = CatalogProductModel(
        product_name=name,
        brand=brand,
        category=category,
        price=req.price,
        rating=4.7,
        review_count=100,
        image_url=image_url,
        finish=finish,
        benefits=benefits,
        source="manual",
        merchant_name=merchant_name,
        merchant_url=merchant_url,
        in_stock=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return model_to_dict(row)
