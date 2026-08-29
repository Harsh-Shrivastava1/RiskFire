from typing import Optional
from pydantic import BaseModel
from fastapi import Header, HTTPException, status
from backend.app.core.config import settings


class UserContext(BaseModel):
    """
    Developer user identity context.
    Explicitly marked as DEV_NON_PRODUCTION_AUTH for Phase 2.
    """
    user_id: str = "usr-dev-01"
    name: str = "Arjun Mehta"
    role: str = "MERCHANT_ADMIN"
    merchant_id: str = settings.DEV_MERCHANT_ID
    merchant_name: str = settings.DEV_MERCHANT_NAME
    is_authenticated: bool = True
    auth_mode: str = "DEV_NON_PRODUCTION_AUTH"


def get_current_user(
    x_merchant_id: Optional[str] = Header(None, alias="X-Merchant-ID"),
    authorization: Optional[str] = Header(None)
) -> UserContext:
    """
    FastAPI dependency for development user context.
    Clearly designated as non-production mock authentication.
    """
    merchant_id = x_merchant_id or settings.DEV_MERCHANT_ID
    return UserContext(
        user_id="usr-dev-01",
        name="Arjun Mehta",
        role="MERCHANT_ADMIN",
        merchant_id=merchant_id,
        merchant_name=settings.DEV_MERCHANT_NAME,
        is_authenticated=True,
        auth_mode="DEV_NON_PRODUCTION_AUTH"
    )
