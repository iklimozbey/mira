from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import CatalogProductModel, InventoryItem, User, UserProfile
from app.services.obf_sync import fetch_and_cache_obf, model_to_dict, seed_curated_products
from app.services.recommender_service import recommend_top3

router = APIRouter()


class ChatPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=2)
    lang: str = Field("en")
    history: list = Field(default_factory=list)


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
    if category and category != "all":
        query = query.filter(CatalogProductModel.category == category)
    if q and q.strip():
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                CatalogProductModel.product_name.ilike(like),
                CatalogProductModel.brand.ilike(like),
            )
        )

    rows = (
        query.order_by(CatalogProductModel.rating.desc(), CatalogProductModel.review_count.desc())
        .limit(limit)
        .all()
    )

    # If user searched for something not yet in local DB, fetch live from Open Beauty Facts & cache it!
    if q and len(q.strip()) >= 3 and len(rows) < 3:
        await fetch_and_cache_obf(db, q.strip(), page_size=10)
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
