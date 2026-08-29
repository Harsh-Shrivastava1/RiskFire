from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.policy import PolicyResponse, PolicyCreate, PolicyUpdate, PolicyVersionSchema, PolicyRuleSchema


class PolicyRepository(ABC):
    @abstractmethod
    async def list_policies(self, merchant_id: str) -> List[PolicyResponse]:
        pass

    @abstractmethod
    async def get_policy_by_id(self, policy_id: str) -> Optional[PolicyResponse]:
        pass

    @abstractmethod
    async def get_active_policy(self, merchant_id: str) -> Optional[PolicyResponse]:
        pass

    @abstractmethod
    async def create_policy(self, merchant_id: str, data: PolicyCreate) -> PolicyResponse:
        pass

    @abstractmethod
    async def update_policy(self, policy_id: str, data: PolicyUpdate) -> Optional[PolicyResponse]:
        pass

    @abstractmethod
    async def create_policy_version(self, policy_id: str, version: PolicyVersionSchema) -> PolicyResponse:
        pass

    @abstractmethod
    async def delete_policy(self, policy_id: str) -> bool:
        pass
