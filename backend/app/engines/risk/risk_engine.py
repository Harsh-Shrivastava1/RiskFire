from typing import Any, Dict


class RiskPostureResult:
    def __init__(
        self,
        risk_score: int,
        attack_success_rate: float,
        detection_recall: float,
        false_positive_rate: float,
        simulated_exposure: float,
        breakdown: Dict[str, Any]
    ):
        self.risk_score = risk_score
        self.attack_success_rate = attack_success_rate
        self.detection_recall = detection_recall
        self.false_positive_rate = false_positive_rate
        self.simulated_exposure = simulated_exposure
        self.breakdown = breakdown


class RiskEvaluationEngine:
    """
    Computes composite merchant risk posture score from empirical simulation factors.
    """

    def compute_risk_posture(
        self,
        detection_recall: float,
        false_positive_rate: float,
        attack_success_rate: float,
        simulated_exposure: float
    ) -> RiskPostureResult:
        # Penalty factors:
        # ASR penalty: up to 60 pts (if ASR is 100%)
        asr_penalty = min(60.0, (attack_success_rate / 100.0) * 60.0)

        # Exposure penalty: 1 pt per ₹50,000 exposure up to 30 pts
        exposure_penalty = min(30.0, (simulated_exposure / 50000.0) * 1.5)

        # FPR penalty: up to 10 pts (customer friction penalty)
        fpr_penalty = min(10.0, (false_positive_rate / 10.0) * 10.0)

        raw_score = 100.0 - (asr_penalty + exposure_penalty + fpr_penalty)
        final_score = int(max(0, min(100, round(raw_score))))

        breakdown = {
            "base_score": 100,
            "asr_penalty": round(asr_penalty, 1),
            "exposure_penalty": round(exposure_penalty, 1),
            "fpr_penalty": round(fpr_penalty, 1),
            "raw_score": round(raw_score, 1),
            "final_score": final_score
        }

        return RiskPostureResult(
            risk_score=final_score,
            attack_success_rate=attack_success_rate,
            detection_recall=detection_recall,
            false_positive_rate=false_positive_rate,
            simulated_exposure=simulated_exposure,
            breakdown=breakdown
        )
