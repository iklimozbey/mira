from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import InventoryItem, User, UserProfile
from app.services.catalog_service import POPULAR_BRAND_CATALOG
from app.services.recommender_service import recommend_top3

router = APIRouter()


class ChatPromptRequest(BaseModel):
    prompt: str = Field(..., min_length=2)
    lang: str = Field("en")


@router.get("/")
def list_catalog(category: Optional[str] = None, q: Optional[str] = None):
    """Public product catalog for the Discover screen (optional category / text filter)."""
    items = POPULAR_BRAND_CATALOG
    if category:
        items = [p for p in items if p["category"] == category]
    if q:
        needle = q.lower().strip()
        items = [p for p in items if needle in p["product_name"].lower() or needle in p["brand"].lower()]
    return sorted(items, key=lambda p: (p["rating"], p["review_count"]), reverse=True)


@router.get("/daily-top3")
async def get_daily_top3(
    lang: str = "en",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return today's top 3 personalized product picks based on skin profile, budget, and shelf."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    inventory = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
    return await recommend_top3(prompt=None, profile=profile, inventory=inventory, lang=lang)


@router.post("/chat")
async def chat_recommend(
    req: ChatPromptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Home chatbot endpoint: takes a natural-language need and returns a reply + top 3 matching products."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    inventory = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
    return await recommend_top3(prompt=req.prompt, profile=profile, inventory=inventory, lang=req.lang)
