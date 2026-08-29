from typing import List, Optional
from backend.app.database.repositories.interfaces.policy_repository import PolicyRepository
from backend.app.services.audit_service import AuditService
from backend.app.schemas.policy import PolicyResponse, PolicyCreate, PolicyUpdate, PolicyVersionSchema
from backend.app.schemas.common import AuditActorType
from backend.app.core.exceptions import ResourceNotFoundError, PolicyValidationError


class PolicyService:
    def __init__(self, policy_repo: PolicyRepository, audit_service: AuditService):
        self.policy_repo = policy_repo
        self.audit_service = audit_service

    async def list_policies(self, merchant_id: str) -> List[PolicyResponse]:
        return await self.policy_repo.list_policies(merchant_id)

    async def get_policy(self, policy_id: str) -> PolicyResponse:
        pol = await self.policy_repo.get_policy_by_id(policy_id)
        if not pol:
            raise ResourceNotFoundError("Policy", policy_id)
        return pol

    async def create_policy(self, merchant_id: str, data: PolicyCreate, actor_name: str = "Harsh Shrivastava") -> PolicyResponse:
        if not data.rules:
            raise PolicyValidationError("Policy must define at least one active rule.")
        
        pol = await self.policy_repo.create_policy(merchant_id, data)
        await self.audit_service.record_event(
            action="POLICY_CREATED",
            entity_type="Policy",
            entity_id=pol.id,
            entity_name=pol.name,
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={"category": pol.category.value, "rule_count": pol.rule_count}
        )
        return pol

    async def update_policy(self, policy_id: str, data: PolicyUpdate, actor_name: str = "Harsh Shrivastava") -> PolicyResponse:
        pol = await self.policy_repo.update_policy(policy_id, data)
        if not pol:
            raise ResourceNotFoundError("Policy", policy_id)
        
        await self.audit_service.record_event(
            action="POLICY_UPDATED",
            entity_type="Policy",
            entity_id=pol.id,
            entity_name=pol.name,
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={"is_active": pol.is_active}
        )
        return pol

    async def create_new_version(self, policy_id: str, version: PolicyVersionSchema, actor_name: str = "Harsh Shrivastava") -> PolicyResponse:
        pol = await self.policy_repo.create_policy_version(policy_id, version)
        await self.audit_service.record_event(
            action="POLICY_VERSION_PROMOTED",
            entity_type="PolicyVersion",
            entity_id=version.id,
            entity_name=f"{pol.name} ({version.version_number})",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={"rules_count": len(version.rules), "version_number": version.version_number}
        )
        return pol

    async def delete_policy(self, policy_id: str, actor_name: str = "Harsh Shrivastava") -> bool:
        pol = await self.policy_repo.get_policy_by_id(policy_id)
        if not pol:
            raise ResourceNotFoundError("Policy", policy_id)
        
        deleted = await self.policy_repo.delete_policy(policy_id)
        if deleted:
            await self.audit_service.record_event(
                action="POLICY_DELETED",
                entity_type="Policy",
                entity_id=policy_id,
                entity_name=pol.name,
                actor_name=actor_name,
                actor_type=AuditActorType.USER,
                status="WARNING"
            )
        return deleted
