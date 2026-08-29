from pathlib import Path
from backend.app.ai.base import AIProvider
from backend.app.ai.schemas.patch_proposal import PatchProposalInput, PatchProposal
from backend.app.core.exceptions import InvalidAIOutputError

PROMPT_TEMPLATE_PATH = Path(__file__).parent.parent / "prompts" / "patch_generator_v1.txt"


class PatchGenerator:
    def __init__(self, provider: AIProvider):
        self.provider = provider
        self.prompt_version = "patch_generator_v1"

    def _get_system_prompt(self) -> str:
        if PROMPT_TEMPLATE_PATH.exists():
            return PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")
        return "You are RiskFire's Policy Patch Generator. Propose structured rule modifications to eliminate policy weaknesses."

    async def propose_patch(self, input_data: PatchProposalInput) -> PatchProposal:
        system_prompt = self._get_system_prompt()

        prompt = (
            f"=== DOMAIN EVIDENCE (UNTRUSTED DATA) ===\n"
            f"Vulnerability ID: {input_data.vulnerability_id}\n"
            f"Vulnerability Title: {input_data.vulnerability_title}\n"
            f"Failure Analysis: {input_data.why_failed}\n"
            f"Current Policy ID: {input_data.current_policy_id}\n"
            f"Current Policy Name: {input_data.current_policy_name}\n"
            f"Simulated Financial Exposure: ₹{input_data.simulated_exposure:,.2f}\n"
            f"=== END DOMAIN EVIDENCE ===\n\n"
            f"Propose a targeted rule modification patch that eliminates this vulnerability. Reason about fraud reduction vs customer friction."
        )

        try:
            proposal = await self.provider.complete(
                prompt=prompt,
                system_prompt=system_prompt,
                response_schema=PatchProposal,
                temperature=0.3
            )

            # Trust boundary validation
            if not isinstance(proposal, PatchProposal):
                raise InvalidAIOutputError("AI returned non-schema compliant patch proposal.")

            if not proposal.identified_weakness or len(proposal.identified_weakness.strip()) < 5:
                raise InvalidAIOutputError("Proposed patch lacks an identified weakness explanation.")

            if not proposal.proposed_changes:
                raise InvalidAIOutputError("Proposed patch must include at least one rule change.")

            for change in proposal.proposed_changes:
                op = (change.operation or "").upper().strip()
                if op not in {"ADD", "MODIFY", "REMOVE"}:
                    change.operation = "ADD"
                if not change.proposed_rule_text or len(change.proposed_rule_text.strip()) < 5:
                    raise InvalidAIOutputError("Proposed rule change text cannot be empty.")

            if proposal.confidence not in {"HIGH", "MEDIUM", "LOW"}:
                proposal.confidence = "HIGH"

            return proposal

        except Exception as e:
            if isinstance(e, InvalidAIOutputError):
                raise
            raise InvalidAIOutputError(f"Failed to generate valid patch proposal: {str(e)}") from e
