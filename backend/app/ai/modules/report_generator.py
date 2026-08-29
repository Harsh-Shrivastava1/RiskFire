from pathlib import Path
from backend.app.ai.base import AIProvider
from backend.app.ai.schemas.report_narrative import ReportNarrativeInput, ReportNarrative
from backend.app.core.exceptions import InvalidAIOutputError

PROMPT_TEMPLATE_PATH = Path(__file__).parent.parent / "prompts" / "report_generator_v1.txt"


class ReportGenerator:
    def __init__(self, provider: AIProvider):
        self.provider = provider
        self.prompt_version = "report_generator_v1"

    def _get_system_prompt(self) -> str:
        if PROMPT_TEMPLATE_PATH.exists():
            return PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")
        return "You are RiskFire's Executive Report Generator. Synthesize simulation findings into an executive narrative with mandatory synthetic disclaimers."

    async def generate_narrative(self, input_data: ReportNarrativeInput) -> ReportNarrative:
        system_prompt = self._get_system_prompt()
        vulns_str = "; ".join(input_data.vulnerabilities_summary) if input_data.vulnerabilities_summary else "None identified"

        prompt = (
            f"=== DOMAIN EVIDENCE (UNTRUSTED DATA) ===\n"
            f"Merchant: {input_data.merchant_name}\n"
            f"Policy Tested: {input_data.policy_name}\n"
            f"Total Synthetic Transactions: {input_data.total_transactions}\n"
            f"Adversarial Bypasses Found: {input_data.bypasses_found}\n"
            f"Simulated Exposure: ₹{input_data.simulated_exposure:,.2f}\n"
            f"Detection Recall: {input_data.detection_recall:.1f}%\n"
            f"False Positive Rate: {input_data.false_positive_rate:.1f}%\n"
            f"Identified Vulnerabilities: {vulns_str}\n"
            f"=== END DOMAIN EVIDENCE ===\n\n"
            f"Synthesize an executive risk report narrative. All financial numbers and metrics MUST match the figures above exactly."
        )

        try:
            narrative = await self.provider.complete(
                prompt=prompt,
                system_prompt=system_prompt,
                response_schema=ReportNarrative,
                temperature=0.3
            )

            # Trust boundary validation
            if not isinstance(narrative, ReportNarrative):
                raise InvalidAIOutputError("AI returned non-schema compliant report narrative.")

            if not narrative.executive_summary or len(narrative.executive_summary.strip()) < 20:
                raise InvalidAIOutputError("Executive summary is too short or empty.")

            if not narrative.recommended_actions:
                narrative.recommended_actions = [
                    "Deploy validated rate-limiting patches to merchant risk policies.",
                    "Schedule weekly automated red-team simulations in sandbox.",
                    "Review high-exposure payment bypass vectors with fraud ops."
                ]

            # Mandatory disclaimer check
            if not narrative.disclaimer or "synthetic" not in narrative.disclaimer.lower():
                narrative.disclaimer = (
                    "All financial exposure figures and risk metrics represent simulated estimates "
                    "generated inside a controlled synthetic payment sandbox."
                )

            return narrative

        except Exception as e:
            if isinstance(e, InvalidAIOutputError):
                raise
            raise InvalidAIOutputError(f"Failed to generate valid report narrative: {str(e)}") from e
