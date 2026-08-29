from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "RiskFire Risk Intelligence Platform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # AI Provider Configuration (Phase 4 Real Groq Integration)
    AI_ENABLED: bool = True
    AI_PROVIDER: str = "groq"  # "mock" | "groq"
    GROQ_API_KEY: str = Field(default="")
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_TIMEOUT: float = 30.0
    GROQ_MAX_RETRIES: int = 3
    AI_TEMPERATURE: float = 0.3
    AI_MAX_TOKENS: int = 2048
    
    # MongoDB Configuration
    PERSISTENCE_MODE: str = "auto"  # "mongo" (required, fails fast) | "memory" (explicit test mode) | "auto" (dev fallback)
    MONGODB_URI: str = Field(default="")
    MONGODB_DB_NAME: str = "riskfire_db"
    
    # Simulation & Deterministic Defaults
    DEFAULT_SIMULATION_SEED: int = 49201
    DEFAULT_SYNTHETIC_TRANSACTIONS: int = 3200
    DEFAULT_LOOKBACK_MINUTES: int = 10
    
    # Security & Audit Defaults
    SYNTHETIC_SANDBOX_MODE: bool = True
    AUDIT_LOG_RETENTION_DAYS: int = 90
    DEV_MERCHANT_ID: str = "m-dev-01"
    DEV_MERCHANT_NAME: str = "Acme Payments India Pvt Ltd"
    
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
