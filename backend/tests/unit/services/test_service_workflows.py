import pytest
from typing import Dict, List, Optional
from backend.app.database.repositories.interfaces.policy_repository import PolicyRepository
from backend.app.database.repositories.interfaces.audit_repository import AuditRepository
from backend.app.services.policy_service import PolicyService
from backend.app.services.audit_service import AuditService
from backend.app.schemas.policy import PolicyResponse, PolicyCreate, PolicyCategory, PolicyRuleSchema, PolicyRuleType, RuleAction, PolicyVersionSchema, PolicyStatus
from backend.app.schemas.audit import AuditLogResponse, AuditLogCreate
from backend.app.schemas.common import AuditActorType


class CustomTestPolicyRepository(PolicyRepository):
    """Custom repository implementation for repository-substitution test."""
    def __init__(self):
        self.storage: Dict[str, PolicyResponse] = {}

    async def list_policies(self, merchant_id: str) -> List[PolicyResponse]:
        return list(self.storage.values())

    async def get_policy_by_id(self, policy_id: str) -> Optional[PolicyResponse]:
        return self.storage.get(policy_id)

    async def get_active_policy(self, merchant_id: str) -> Optional[PolicyResponse]:
        for p in self.storage.values():
            if p.is_active:
                return p
        return None

    async def create_policy(self, merchant_id: str, data: PolicyCreate) -> PolicyResponse:
        p_id = f"custom-pol-{len(self.storage)+1}"
        pol = PolicyResponse(
            id=p_id,
            merchant_id=merchant_id,
            name=data.name,
            description=data.description,
            category=data.category,
            current_version_id="v1",
            current_version_number="v1.0.0",
            is_active=True,
            rule_count=len(data.rules),
            coverage_rate=90.0,
            effectiveness_rate=90.0,
            created_at="2026-08-20T10:00:00Z",
            updated_at="2026-08-20T10:00:00Z",
            versions=[]
        )
        self.storage[p_id] = pol
        return pol

    async def update_policy(self, policy_id: str, data) -> Optional[PolicyResponse]:
        return None

    async def create_policy_version(self, policy_id: str, version) -> PolicyResponse:
        return self.storage[policy_id]

    async def delete_policy(self, policy_id: str) -> bool:
        if policy_id in self.storage:
            del self.storage[policy_id]
            return True
        return False


class CustomTestAuditRepository(AuditRepository):
    """Custom audit repository implementation for repository-substitution test."""
    def __init__(self):
        self.logs: List[AuditLogResponse] = []

    async def list_audit_logs(self, limit: int = 100, offset: int = 0) -> List[AuditLogResponse]:
        return self.logs

    async def create_audit_log(self, data: AuditLogCreate) -> AuditLogResponse:
        entry = AuditLogResponse(
            id=f"custom-aud-{len(self.logs)+1}",
            timestamp="2026-08-20T10:00:00Z",
            action=data.action,
            actor_type=data.actor_type,
            actor_name=data.actor_name,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            entity_name=data.entity_name,
            status=data.status,
            details=data.details
        )
        self.logs.append(entry)
        return entry


@pytest.mark.asyncio
async def test_repository_substitution_and_audit_generation():
    """
    Verifies that PolicyService operates seamlessly when supplied with a custom repository,
    and that all state-changing operations trigger append-only audit events.
    """
    custom_policy_repo = CustomTestPolicyRepository()
    custom_audit_repo = CustomTestAuditRepository()
    audit_service = AuditService(custom_audit_repo)
    policy_service = PolicyService(custom_policy_repo, audit_service)

    # 1. Create a policy
    rule = PolicyRuleSchema(
        id="r1",
        name="Velocity Rule",
        rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
        category=PolicyCategory.VELOCITY,
        parameters={"max_txns": 3},
        action=RuleAction.BLOCK,
        is_enabled=True,
        sequence_order=1
    )
    create_req = PolicyCreate(
        name="Custom Substituted Policy",
        description="Testing repository substitution",
        category=PolicyCategory.VELOCITY,
        rules=[rule]
    )

    created = await policy_service.create_policy("m-custom-01", create_req, actor_name="Test Auditor")

    assert created.id == "custom-pol-1"
    assert created.name == "Custom Substituted Policy"

    # Verify audit event was logged
    audit_logs = await audit_service.list_audit_logs()
    assert len(audit_logs) == 1
    assert audit_logs[0].action == "POLICY_CREATED"
    assert audit_logs[0].entity_id == "custom-pol-1"
    assert audit_logs[0].actor_name == "Test Auditor"

    # Verify policy query works
    retrieved = await policy_service.get_policy("custom-pol-1")
    assert retrieved.id == "custom-pol-1"
