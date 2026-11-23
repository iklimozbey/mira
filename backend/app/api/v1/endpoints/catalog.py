from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import CatalogProductModel, InventoryItem, User, UserProfile
from app.services.feed_importer import import_feed_from_url, parse_google_merchant_xml, upsert_feed_items
from app.services.obf_sync import fetch_and_cache_obf, model_to_dict, seed_curated_products
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
