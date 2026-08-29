from typing import Any, Dict, List
from backend.app.schemas.common import RiskDecisionOutcome


class ExposureCalculationResult:
    def __init__(
        self,
        total_exposure: float,
        bypass_count: int,
        average_bypass_amount: float,
        exposure_by_vector: Dict[str, float]
    ):
        self.total_exposure = total_exposure
        self.bypass_count = bypass_count
        self.average_bypass_amount = average_bypass_amount
        self.exposure_by_vector = exposure_by_vector


class ExposureEngine:
    """
    Deterministic financial exposure calculator for synthetic payment traffic.
    """

    def calculate_exposure(self, evaluated_transactions: List[Dict[str, Any]]) -> ExposureCalculationResult:
        bypasses = [
            t for t in evaluated_transactions
            if t.get("is_adversarial") and t.get("outcome") == RiskDecisionOutcome.ALLOWED
        ]

        total_exposure = sum(float(t.get("amount", 0.0)) for t in bypasses)
        bypass_count = len(bypasses)
        avg_amount = (total_exposure / bypass_count) if bypass_count > 0 else 0.0

        by_vector: Dict[str, float] = {}
        for b in bypasses:
            vec = b.get("attack_type", "UNKNOWN")
            by_vector[vec] = by_vector.get(vec, 0.0) + float(b.get("amount", 0.0))

        return ExposureCalculationResult(
            total_exposure=round(total_exposure, 2),
            bypass_count=bypass_count,
            average_bypass_amount=round(avg_amount, 2),
            exposure_by_vector=by_vector
        )
