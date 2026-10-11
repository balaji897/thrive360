from pathlib import Path
from typing import List, Dict
import os
from pydantic import BaseModel
try:
    from pydantic_settings import BaseSettings
except ImportError:
    BaseSettings = BaseModel

# Resolve base directories dynamically
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = BACKEND_DIR.parent

class ScoringWeights(BaseModel):
    academic_performance: float = 0.25
    attendance: float = 0.20
    lms_participation: float = 0.10
    student_engagement: float = 0.10
    placement_readiness: float = 0.20
    technical_soft_skills: float = 0.10
    feedback_support: float = 0.05

    def validate_weights(self) -> bool:
        total = sum([
            self.academic_performance,
            self.attendance,
            self.lms_participation,
            self.student_engagement,
            self.placement_readiness,
            self.technical_soft_skills,
            self.feedback_support
        ])
        return abs(total - 1.0) < 0.001

class Settings:
    PROJECT_NAME: str = "Smart Campus Analytics"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "smart-campus-jwt-secret-key-2026-kpmg-challenge")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Environment & Security Configuration
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEV_ACCOUNTS_ENABLED: bool = os.getenv("DEV_ACCOUNTS_ENABLED", "true" if os.getenv("ENVIRONMENT", "development") == "development" else "false").lower() in ("true", "1", "yes")
    COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "false" if os.getenv("ENVIRONMENT", "development") == "development" else "true").lower() in ("true", "1", "yes")
    COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "lax")
    
    # Path resolution with fallback
    RAW_DATA_DIR: Path = BACKEND_DIR / "data" / "raw"
    PROCESSED_DATA_DIR: Path = BACKEND_DIR / "data" / "processed"
    INTERVENTIONS_FILE: Path = BACKEND_DIR / "data" / "interventions.json"
    WORKSPACE_RAW_DIR: Path = WORKSPACE_DIR
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    DEFAULT_WEIGHTS: ScoringWeights = ScoringWeights()

settings = Settings()
