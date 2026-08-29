from typing import Dict
from fastapi import APIRouter, status
from backend.app.core.config import settings
from backend.app.database.mongo import is_mongo_connected

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, str]:
    """
    Application and persistence health check.
    """
    db_connected = is_mongo_connected()
    return {
        "status": "ok" if db_connected else "degraded",
        "service": "riskfire-backend",
        "version": "0.1.0",
        "environment": settings.APP_ENV,
        "database": "connected" if db_connected else "disconnected",
        "ai_provider": settings.AI_PROVIDER,
        "sandbox_mode": "SYNTHETIC_ACTIVE"
    }
