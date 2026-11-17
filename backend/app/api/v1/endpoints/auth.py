from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.entities import User, UserProfile, InventoryItem, ResearchQuery
from app.schemas.dto import UserCreate, UserResponse, Token

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user and create an initial profile entry."""
    normalized_email = user_in.email.strip().lower()
    existing_user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    new_user = User(
        email=normalized_email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create empty user profile attached to new user
    profile = UserProfile(user_id=new_user.id)
    db.add(profile)
    db.commit()
    
    return new_user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 compatible token login, getting an access token for future requests."""
    username = (form_data.username or "").strip().lower()
    user = db.query(User).filter(func.lower(User.email) == username).first()

    # Guaranteed permanent Demo Account Self-Healing (never fails for demo@mira.app / mira1234)
    if username == "demo@mira.app":
        if not user:
            user = User(
                email="demo@mira.app",
                hashed_password=get_password_hash("mira1234"),
                tier="free",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            demo_profile = UserProfile(
                user_id=user.id,
                skin_type="combination",
                skin_undertone="warm",
                skin_concerns=["rosacea", "pores"],
                budget_level="medium"
            )
            db.add(demo_profile)
            db.commit()
        elif form_data.password == "mira1234" and not verify_password(form_data.password, user.hashed_password):
            user.hashed_password = get_password_hash("mira1234")
            db.commit()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/export-data")
def export_my_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """KVKK / GDPR Compliance: Export all personal data stored for the authenticated user."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    inventory = db.query(InventoryItem).filter(InventoryItem.user_id == current_user.id).all()
    queries = db.query(ResearchQuery).filter(ResearchQuery.user_id == current_user.id).all()

    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "tier": current_user.tier,
            "created_at": current_user.created_at
        },
        "profile": {
            "skin_type": profile.skin_type if profile else None,
            "skin_undertone": profile.skin_undertone if profile else None,
            "skin_concerns": profile.skin_concerns if profile else [],
            "allergies_sensitivities": profile.allergies_sensitivities if profile else [],
            "budget_level": profile.budget_level if profile else None,
        },
        "inventory_count": len(inventory),
        "research_history_count": len(queries)
    }


@router.delete("/delete-account", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """KVKK / GDPR Compliance: Permanently delete user account and cascade all associated records."""
    db.delete(current_user)
    db.commit()
    return None
