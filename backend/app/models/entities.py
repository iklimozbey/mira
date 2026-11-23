import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Text, Integer, Float, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    tier = Column(String(50), default="free")  # free, premium
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    inventory_items = relationship("InventoryItem", back_populates="user", cascade="all, delete-orphan")
    research_queries = relationship("ResearchQuery", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    
    # Skincare & Cosmetic attributes
    skin_type = Column(String(50), nullable=True)  # e.g., oily, dry, combination, sensitive
    skin_undertone = Column(String(50), nullable=True)  # e.g., warm, cool, neutral
    skin_concerns = Column(JSON, default=list)  # e.g., ["rosacea", "acne", "fungal_acne", "eczema", "redness"]
    allergies_sensitivities = Column(JSON, default=list)  # e.g., ["fragrance", "alcohol", "essential_oils"]
    budget_level = Column(String(50), default="medium")  # low, medium, luxury
    budget_max = Column(Integer, nullable=True)  # numeric max budget per product (e.g., 1000)
    onboarding_completed = Column(Boolean, default=False)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="profile")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    product_name = Column(String(255), nullable=False)
    brand = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)  # e.g., foundation, moisturizer, sunscreen
    status = Column(String(50), default="owned")  # owned, tested, wishlist
    rating = Column(Integer, nullable=True)  # 1-5 scale
    experience_notes = Column(Text, nullable=True)  # e.g., "oxidized heavily after 2 hours"
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="inventory_items")


class ResearchQuery(Base):
    __tablename__ = "research_queries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    query_text_or_url = Column(Text, nullable=False)
    product_name = Column(String(255), nullable=True)
    status = Column(String(50), default="pending")  # pending, completed, failed
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="research_queries")
    report = relationship("ResearchReport", back_populates="query", uselist=False, cascade="all, delete-orphan")


class ResearchReport(Base):
    __tablename__ = "research_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    query_id = Column(String(36), ForeignKey("research_queries.id"), unique=True, nullable=False)
    
    # Analysis outputs
    summary = Column(Text, nullable=False)
    pros = Column(JSON, default=list)  # list of key advantages
    cons = Column(JSON, default=list)  # list of key complaints/cautions
    clinical_warnings = Column(JSON, default=list)  # Rosacea, acne, comedogenic & allergen trigger warnings
    suitability_score = Column(Integer, nullable=True)  # 1-100 personal compatibility
    suitability_reason = Column(Text, nullable=True)  # rationale based on user profile
    reality_check_verdict = Column(String(50), default="CONSIDER")  # BUY, SKIP, REDUNDANT, CONSIDER
    reality_check_reason = Column(Text, nullable=True)  # de-influencing & shelf redundancy check
    sources = Column(JSON, default=list)  # [{title, url, source_type, sentiment}]
    sponsored_flags = Column(JSON, default=list)  # detected sponsored tags or notes
    tokens_used = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    query = relationship("ResearchQuery", back_populates="report")


class CatalogProductModel(Base):
    __tablename__ = "catalog_products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    barcode = Column(String(64), unique=True, index=True, nullable=True)
    product_name = Column(String(255), index=True, nullable=False)
    brand = Column(String(120), index=True, nullable=False)
    category = Column(String(50), index=True, nullable=False, default="other")
    price = Column(Integer, nullable=False, default=399)
    rating = Column(Float, nullable=False, default=4.5)
    review_count = Column(Integer, nullable=False, default=500)
    image_url = Column(String(1024), nullable=True)
    shade_hex = Column(String(20), nullable=True)
    shade_name = Column(String(120), nullable=True)
    finish = Column(String(30), nullable=False, default="natural")
    benefits = Column(JSON, default=list)
    ingredients_text = Column(Text, nullable=True)
    source = Column(String(30), nullable=False, default="curated")
    created_at = Column(DateTime, default=datetime.utcnow)
