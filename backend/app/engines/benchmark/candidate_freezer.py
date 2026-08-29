import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.app.core.exceptions import BenchmarkIntegrityError
from backend.app.schemas.benchmark import (
    BenchmarkMetricsSchema,
    CandidatePolicySnapshot,
)
from backend.app.schemas.policy import PolicyResponse, PolicyRuleSchema


def compute_policy_checksum(rules: List[PolicyRuleSchema], candidate_version: str) -> str:
    """
    Computes a canonical SHA-256 checksum over policy rules and version string.
    Ensures identical rule definitions produce identical cryptographic digests.
    """
    canonical_rules = [
        {
            "name": r.name,
            "rule_type": r.rule_type if isinstance(r.rule_type, str) else r.rule_type.value,
            "category": r.category if isinstance(r.category, str) else r.category.value,
            "parameters": r.parameters or {},
            "action": r.action if isinstance(r.action, str) else r.action.value,
            "is_enabled": r.is_enabled,
            "sequence_order": r.sequence_order,
        }
        for r in sorted(rules, key=lambda x: x.sequence_order)
    ]
    payload = {
        "candidate_version": candidate_version,
        "rules": canonical_rules
    }
    encoded = json.dumps(payload, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


class CandidateFreezer:
    """
    Enforces candidate policy freezing and immutability before held-out evaluation.
    Prevents post-freeze mutations and tuning leakage against test splits.
    """

    def freeze_candidate(
        self,
        candidate_id: str,
        baseline_policy: PolicyResponse,
        candidate_rules: List[PolicyRuleSchema],
        candidate_version: str = "v1.1.0-candidate",
        source_vulnerability_id: Optional[str] = None,
        ai_proposal_id: Optional[str] = None,
        development_metrics: Optional[BenchmarkMetricsSchema] = None,
        validation_metrics: Optional[BenchmarkMetricsSchema] = None
    ) -> CandidatePolicySnapshot:
        """
        Creates an immutable, cryptographically hashed candidate policy snapshot.
        """
        checksum = compute_policy_checksum(candidate_rules, candidate_version)
        frozen_at_iso = datetime.now(timezone.utc).isoformat()

        return CandidatePolicySnapshot(
            candidate_id=candidate_id,
            baseline_policy_id=baseline_policy.id,
            baseline_policy_name=baseline_policy.name,
            baseline_version=baseline_policy.current_version_number,
            candidate_version=candidate_version,
            rules=candidate_rules,
            candidate_checksum=checksum,
            source_vulnerability_id=source_vulnerability_id,
            ai_proposal_id=ai_proposal_id,
            development_metrics=development_metrics,
            validation_metrics=validation_metrics,
            is_frozen=True,
            frozen_at=frozen_at_iso
        )

    def verify_candidate_immutability(
        self,
        snapshot: CandidatePolicySnapshot,
        rules_to_verify: List[PolicyRuleSchema]
    ) -> bool:
        """
        Verifies that candidate rules have not been modified post-freeze.
        Raises BenchmarkIntegrityError if checksum diverges.
        """
        if not snapshot.is_frozen:
            raise BenchmarkIntegrityError(
                f"Candidate '{snapshot.candidate_id}' is not in a FROZEN state."
            )

        current_checksum = compute_policy_checksum(rules_to_verify, snapshot.candidate_version)
        if current_checksum != snapshot.candidate_checksum:
            raise BenchmarkIntegrityError(
                f"Candidate policy '{snapshot.candidate_id}' was mutated after freeze! "
                f"Expected SHA-256 {snapshot.candidate_checksum}, computed {current_checksum}. "
                "Held-out evaluation rejected."
            )
        return True

    def reject_mutation(self, snapshot: CandidatePolicySnapshot) -> None:
        """
        Explicitly rejects any attempted mutation against a frozen candidate.
        """
        if snapshot.is_frozen:
            raise BenchmarkIntegrityError(
                f"Mutation rejected: Candidate policy '{snapshot.candidate_id}' is frozen "
                f"and locked against modifications."
            )
