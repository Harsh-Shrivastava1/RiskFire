from pathlib import Path
from backend.app.ai.base import AIProvider
from backend.app.ai.schemas.attack_plan import AttackPlannerInput, AttackPlan
from backend.app.schemas.attack import AttackAgentType
from backend.app.core.exceptions import InvalidAIOutputError

PROMPT_TEMPLATE_PATH = Path(__file__).parent.parent / "prompts" / "attack_planner_v1.txt"


class AttackPlanner:
    def __init__(self, provider: AIProvider):
        self.provider = provider
        self.prompt_version = "attack_planner_v1"

    def _get_system_prompt(self) -> str:
        if PROMPT_TEMPLATE_PATH.exists():
            return PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")
        return "You are RiskFire's Adversarial Red-Team Planner. Formulate structured attack plans strictly matching the AttackPlan schema."

    async def generate_plan(self, input_data: AttackPlannerInput) -> AttackPlan:
        system_prompt = self._get_system_prompt()
        policies_str = ", ".join(input_data.active_policy_names) if input_data.active_policy_names else "Default Active Risk Policy"

        prompt = (
            f"=== DOMAIN EVIDENCE (UNTRUSTED DATA) ===\n"
            f"Merchant ID: {input_data.merchant_id}\n"
            f"Simulation ID: {input_data.simulation_id}\n"
            f"Active Policies: {policies_str}\n"
            f"Attack Type: {input_data.attack_type.value}\n"
            f"Difficulty: {input_data.difficulty}\n"
            f"Available Entity Counts: {input_data.available_entity_counts}\n"
            f"=== END DOMAIN EVIDENCE ===\n\n"
            f"Formulate a structured red-team attack plan to stress-test these policies."
        )

        try:
            plan = await self.provider.complete(
                prompt=prompt,
                system_prompt=system_prompt,
                response_schema=AttackPlan,
                temperature=0.5
            )

            # Trust boundary validation
            if not isinstance(plan, AttackPlan):
                raise InvalidAIOutputError("AI returned non-schema compliant attack plan.")

            # Domain validation: ensure attack type is valid allow-list enum
            if not isinstance(plan.attack_type, AttackAgentType):
                try:
                    plan.attack_type = AttackAgentType(plan.attack_type)
                except ValueError as err:
                    raise InvalidAIOutputError(
                        f"AI suggested unsupported attack type: {plan.attack_type}",
                        details={"supported_types": [e.value for e in AttackAgentType]}
                    ) from err

            # Domain validation: bounds enforcement
            if not (1 <= plan.actors_count <= 100):
                raise InvalidAIOutputError(f"Actor count out of valid range (1-100): {plan.actors_count}")
            if not (1 <= plan.transaction_count <= 10000):
                raise InvalidAIOutputError(f"Transaction count out of valid range (1-10000): {plan.transaction_count}")
            if not (1 <= plan.duration_minutes <= 1440):
                raise InvalidAIOutputError(f"Duration out of valid range (1-1440 minutes): {plan.duration_minutes}")

            return plan

        except Exception as e:
            if isinstance(e, InvalidAIOutputError):
                raise
            raise InvalidAIOutputError(f"Failed to generate valid attack plan: {str(e)}") from e
