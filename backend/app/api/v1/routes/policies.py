from typing import List
from fastapi import APIRouter, Depends, status
from backend.app.api.v1.dependencies import get_policy_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.policy_service import PolicyService
from backend.app.schemas.policy import PolicyResponse, PolicyCreate, PolicyUpdate, PolicyVersionSchema

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get("", response_model=List[PolicyResponse], status_code=status.HTTP_200_OK)
async def list_policies(
    user: UserContext = Depends(get_current_user),
    policy_service: PolicyService = Depends(get_policy_service)
) -> List[PolicyResponse]:
    return await policy_service.list_policies(user.merchant_id)


@router.get("/{policy_id}", response_model=PolicyResponse, status_code=status.HTTP_200_OK)
async def get_policy(
    policy_id: str,
    user: UserContext = Depends(get_current_user),
    policy_service: PolicyService = Depends(get_policy_service)
) -> PolicyResponse:
    return await policy_service.get_policy(policy_id)


@router.post("", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    data: PolicyCreate,
    user: UserContext = Depends(get_current_user),
    policy_service: PolicyService = Depends(get_policy_service)
) -> PolicyResponse:
    return await policy_service.create_policy(user.merchant_id, data, actor_name=user.name)


@router.put("/{policy_id}", response_model=PolicyResponse, status_code=status.HTTP_200_OK)
async def update_policy(
    policy_id: str,
    data: PolicyUpdate,
    user: UserContext = Depends(get_current_user),
    policy_service: PolicyService = Depends(get_policy_service)
) -> PolicyResponse:
    return await policy_service.update_policy(policy_id, data, actor_name=user.name)


@router.post("/{policy_id}/versions", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy_version(
    policy_id: str,
    version: PolicyVersionSchema,
    user: UserContext = Depends(get_current_user),
    policy_service: PolicyService = Depends(get_policy_service)
) -> PolicyResponse:
    return await policy_service.create_new_version(policy_id, version, actor_name=user.name)


@router.delete("/{policy_id}", status_code=status.HTTP_200_OK)
async def delete_policy(
    policy_id: str,
    user: UserContext = Depends(get_current_user),
    policy_service: PolicyService = Depends(get_policy_service)
) -> dict:
    success = await policy_service.delete_policy(policy_id, actor_name=user.name)
    return {"deleted": success, "policy_id": policy_id}
