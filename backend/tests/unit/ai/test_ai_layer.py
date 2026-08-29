import pytest
from backend.app.ai.providers.mock import MockAIProvider
from backend.app.ai.base import AIProvider
from backend.app.ai.modules.attack_planner import AttackPlanner
from backend.app.ai.modules.patch_generator import PatchGenerator
from backend.app.ai.schemas.attack_plan import AttackPlannerInput, AttackPlan
from backend.app.ai.schemas.patch_proposal import PatchProposalInput, PatchProposal
from backend.app.schemas.attack import AttackAgentType
from backend.app.engines.policy.policy_engine import PolicyEngine
from backend.app.schemas.policy import PolicyRuleSchema, PolicyRuleType, PolicyCategory, RuleAction
from backend.app.schemas.common import RiskDecisionOutcome
from backend.app.core.exceptions import InvalidAIOutputError


class BrokenAIProvider(AIProvider):
    @property
    def provider_name(self) -> str:
        return "broken"

    @property
    def model_name(self) -> str:
        return "broken-model"

    async def health_check(self) -> bool:
        return False

    async def complete(self, prompt, system_prompt, response_schema, **kwargs):
        raise ValueError("Malformed AI JSON generation error")


@pytest.mark.asyncio
async def test_mock_ai_provider_structured_completion():
    provider = MockAIProvider()
    planner = AttackPlanner(provider)

    plan_input = AttackPlannerInput(
        merchant_id="m-dev-01",
        simulation_id="sim-01",
        active_policy_names=["Velocity Policy"],
        attack_type=AttackAgentType.IDENTITY_FRAGMENTER
    )
    plan = await planner.generate_plan(plan_input)

    assert isinstance(plan, AttackPlan)
    assert plan.attack_type == AttackAgentType.IDENTITY_FRAGMENTER
    assert plan.shared_device is True
    assert plan.actors_count == 8


@pytest.mark.asyncio
async def test_ai_trust_boundary_rejection():
    broken_provider = BrokenAIProvider()
    planner = AttackPlanner(broken_provider)

    plan_input = AttackPlannerInput(
        merchant_id="m-dev-01",
        simulation_id="sim-01",
        active_policy_names=["Velocity Policy"],
        attack_type=AttackAgentType.IDENTITY_FRAGMENTER
    )

    with pytest.raises(InvalidAIOutputError):
        await planner.generate_plan(plan_input)


def test_deterministic_policy_authority_over_ai():
    """
    CRITICAL POLICY AUTHORITY TEST:
    Even if an AI model or recommendation proposes 'ALLOW',
    the deterministic PolicyEngine evaluates the concrete transaction
    and enforces 'BLOCK'. The policy engine remains the final authority.
    """
    engine = PolicyEngine()
    rule = PolicyRuleSchema(
        id="r-block",
        name="Strict Velocity Block",
        rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
        category=PolicyCategory.VELOCITY,
        parameters={"max_txns": 1, "window_minutes": 10},
        action=RuleAction.BLOCK,
        is_enabled=True,
        sequence_order=1
    )

    history = [{"id": "t0", "amount": 1000.0, "account_id": "acc-1", "created_at_sim": "2026-08-20T10:00:00Z"}]
    txn = {
        "id": "t1",
        "amount": 2000.0,
        "account_id": "acc-1",
        "created_at_sim": "2026-08-20T10:02:00Z",
        "ai_proposed_action": "ALLOW"  # AI claims allow
    }

    res = engine.evaluate_transaction(txn, [rule], history)

    # Policy decision MUST be BLOCKED regardless of what AI said
    assert res.outcome == RiskDecisionOutcome.BLOCKED
    assert "Strict Velocity Block" in res.triggered_rules
