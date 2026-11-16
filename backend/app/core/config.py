from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "MIRA AI Shopping Assistant"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "supersecretkey_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    DATABASE_URL: str = "sqlite:///./mira.db"

    # AI & Search Keys
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    SEARCH_API_KEY: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
