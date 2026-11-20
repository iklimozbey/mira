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
    source_type: str = "web_review"
    sentiment: Optional[str] = "neutral"


class ProductSuggestionItem(BaseModel):
    product_name: str
    brand: str
    category: str
    rating: float  # e.g., 4.8
    review_count: int  # e.g., 1420
    image_url: Optional[str] = None
    badge: Optional[str] = None
    key_pro: Optional[str] = None
    key_con: Optional[str] = None
    finish_or_tag: Optional[str] = None
    brief_highlight: Optional[str] = None


class DecisionEngineMetadata(BaseModel):
    engine: str = "Laya System 1 Decision Engine (Convai / Local CPU)"
    latency_ms: float = 0.0
    guardrails_passed: bool = True
    guardrail_violations: List[str] = []
    verdict_choice: str = "CONSIDER"
    choice_confidence: float = 0.90
    calibrated_score: int = 85
    is_comedogenic_bool: bool = False
    is_barrier_safe_bool: bool = True
    is_shelf_duplicate_bool: bool = False


class ResearchReportResponse(BaseModel):
    # Mode flag: 'report' when specific product analyzed, 'suggestions' when general query detected
    mode: str = "report"  # 'report' | 'suggestions'
    
    # Fields populated if mode == 'suggestions'
    suggested_products: List[ProductSuggestionItem] = []
    disambiguation_message: Optional[str] = None

    # Fields populated if mode == 'report'
    id: Optional[str] = None
    query_id: Optional[str] = None
    product_name: Optional[str] = None
    summary: Optional[str] = None
    pros: List[str] = []
    cons: List[str] = []
    clinical_warnings: List[str] = []
    suitability_score: Optional[int] = Field(None, ge=1, le=100)
    suitability_reason: Optional[str] = None
    reality_check_verdict: Optional[str] = "CONSIDER"  # BUY, SKIP, REDUNDANT, CONSIDER
    reality_check_reason: Optional[str] = None
    sources: List[SourceItem] = []
    sponsored_flags: List[str] = []
    decision_engine: Optional[DecisionEngineMetadata] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
