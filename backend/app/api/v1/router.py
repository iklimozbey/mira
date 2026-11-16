from fastapi import APIRouter
from app.api.v1.endpoints import auth, profile, research

api_router = APIRouter()


@api_router.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend service status."""
    return {
        "status": "online",
        "service": "MIRA Backend API",
        "version": "0.1.0-alpha"
    }


# Include modular route controllers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(profile.router, prefix="/profile", tags=["User Profile"])
api_router.include_router(research.router, prefix="/research", tags=["AI Research"])
