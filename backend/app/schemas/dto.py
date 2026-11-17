from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# --- Auth & User Schemas ---
class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserResponse(UserBase):
    id: str
    tier: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None


# --- User Profile Schemas ---
class UserProfileBase(BaseModel):
    skin_type: Optional[str] = None  # oily, dry, combination, sensitive, normal
    skin_undertone: Optional[str] = None  # warm, cool, neutral
    skin_concerns: List[str] = []  # rosacea, acne, fungal_acne, redness, eczema, pores
    allergies_sensitivities: List[str] = []  # fragrance, alcohol, essential_oils, silicone
    budget_level: Optional[str] = "medium"  # low, medium, luxury


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: str
    user_id: str
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Inventory Schemas ---
class InventoryItemBase(BaseModel):
    product_name: str
    brand: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = "owned"  # owned, tested, wishlist
    rating: Optional[int] = Field(None, ge=1, le=5)
    experience_notes: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemResponse(InventoryItemBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Research & AI Agent Schemas ---
class ResearchRequest(BaseModel):
    query_or_url: str = Field(..., min_length=3, description="Product name or e-commerce/TikTok URL")


class SourceItem(BaseModel):
    title: str
    url: str
    source_type: str = "web_review"  # web_review, tiktok_oembed, social_media, ingredient_database
    sentiment: Optional[str] = "neutral"


class ResearchReportResponse(BaseModel):
    id: str
    query_id: str
    product_name: Optional[str] = None
    summary: str
    pros: List[str] = []
    cons: List[str] = []
    clinical_warnings: List[str] = []
    suitability_score: Optional[int] = Field(None, ge=1, le=100)
    suitability_reason: Optional[str] = None
    reality_check_verdict: str = "CONSIDER"  # BUY, SKIP, REDUNDANT, CONSIDER
    reality_check_reason: Optional[str] = None
    sources: List[SourceItem] = []
    sponsored_flags: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True
