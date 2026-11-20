import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.api.v1.router import api_router
from app.models.entities import User, UserProfile
from app.core.security import get_password_hash
import app.models.entities  # Ensure all SQLAlchemy models are registered

# 1. Automatically create database tables on startup
Base.metadata.create_all(bind=engine)

# 2. Permanent Demo User Auto-Seeder (Guarantees demo@mira.app always exists)
def ensure_permanent_demo_user():
    db: Session = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@mira.app").first()
        if not demo_user:
            demo_user = User(
                email="demo@mira.app",
                hashed_password=get_password_hash("mira1234"),
                tier="free",
                is_active=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Ensure profile exists
            demo_profile = UserProfile(
                user_id=demo_user.id,
                skin_type="combination",
                skin_undertone="warm",
                skin_concerns=["rosacea", "pores"],
                allergies_sensitivities=[],
                budget_level="medium"
            )
            db.add(demo_profile)
            db.commit()
            print("Permanent demo user (demo@mira.app / mira1234) successfully seeded.")
        else:
            # Always ensure the password hash is exactly for mira1234
            demo_user.hashed_password = get_password_hash("mira1234")
            db.commit()
    except Exception as e:
        print(f"Demo seeder notice: {e}")
    finally:
        db.close()

ensure_permanent_demo_user()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for mobile app (Expo) and client requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount Static Files (Cosmetic Product Photos)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to MIRA AI Shopping & Research Assistant API",
        "docs": "/docs"
    }
