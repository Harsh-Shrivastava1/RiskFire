from typing import Any, Dict, List, Optional
from backend.app.schemas.policy import PolicyResponse, PolicyRuleSchema
from backend.app.schemas.patch import BeforeAfterMetricsSchema, MetricDelta
from backend.app.schemas.common import RiskDecisionOutcome
from backend.app.engines.policy.policy_engine import PolicyEngine


class ReplayEngine:
    """
    Deterministically replays existing historical attack transaction streams
    against candidate patched policy rules.
    """

    def __init__(self):
        self.policy_engine = PolicyEngine()

    def replay_transactions(
        self,
        transactions: List[Dict[str, Any]],
        baseline_policy: PolicyResponse,
        patched_rules: List[PolicyRuleSchema]
    ) -> BeforeAfterMetricsSchema:
        # 1. Baseline Evaluation (from original transaction outcomes or evaluated on baseline rules)
        b_tp, b_fn, b_fp, b_tn = 0, 0, 0, 0
        b_exposure = 0.0

        for t in transactions:
            is_adv = bool(t.get("is_adversarial", False))
            outcome = t.get("outcome", RiskDecisionOutcome.ALLOWED)
            amt = float(t.get("amount", 0.0))

            if is_adv:
                if outcome in [RiskDecisionOutcome.BLOCKED, RiskDecisionOutcome.FLAGGED]:
                    b_tp += 1
                else:
                    b_fn += 1
                    b_exposure += amt
            else:
                if outcome in [RiskDecisionOutcome.BLOCKED, RiskDecisionOutcome.FLAGGED]:
                    b_fp += 1
                else:
                    b_tn += 1

        b_adv = b_tp + b_fn
        b_legit = b_fp + b_tn
        b_recall = (b_tp / b_adv * 100.0) if b_adv > 0 else 0.0
        b_precision = (b_tp / (b_tp + b_fp) * 100.0) if (b_tp + b_fp) > 0 else 0.0
        b_f1 = (2 * b_precision * b_recall / (b_precision + b_recall)) if (b_precision + b_recall) > 0 else 0.0
        b_fpr = (b_fp / b_legit * 100.0) if b_legit > 0 else 0.0
        b_asr = (b_fn / b_adv * 100.0) if b_adv > 0 else 0.0

        # 2. Patched Policy Evaluation
        p_tp, p_fn, p_fp, p_tn = 0, 0, 0, 0
        p_exposure = 0.0
        history: List[Dict[str, Any]] = []

        for t in transactions:
            is_adv = bool(t.get("is_adversarial", False))
            amt = float(t.get("amount", 0.0))

            eval_res = self.policy_engine.evaluate_transaction(t, patched_rules, history)
            history.append(t)

            if is_adv:
                if eval_res.outcome in [RiskDecisionOutcome.BLOCKED, RiskDecisionOutcome.FLAGGED]:
                    p_tp += 1
                else:
                    p_fn += 1
                    p_exposure += amt
            else:
                if eval_res.outcome in [RiskDecisionOutcome.BLOCKED, RiskDecisionOutcome.FLAGGED]:
                    p_fp += 1
                else:
                    p_tn += 1

        p_adv = p_tp + p_fn
        p_legit = p_fp + p_tn
        p_recall = (p_tp / p_adv * 100.0) if p_adv > 0 else 0.0
        p_precision = (p_tp / (p_tp + p_fp) * 100.0) if (p_tp + p_fp) > 0 else 0.0
        p_f1 = (2 * p_precision * p_recall / (p_precision + p_recall)) if (p_precision + p_recall) > 0 else 0.0
        p_fpr = (p_fp / p_legit * 100.0) if p_legit > 0 else 0.0
        p_asr = (p_fn / p_adv * 100.0) if p_adv > 0 else 0.0

        return BeforeAfterMetricsSchema(
            precision=MetricDelta(before=round(b_precision, 1), after=round(p_precision, 1), delta=round(p_precision - b_precision, 1)),
            recall=MetricDelta(before=round(b_recall, 1), after=round(p_recall, 1), delta=round(p_recall - b_recall, 1)),
            f1=MetricDelta(before=round(b_f1, 1), after=round(p_f1, 1), delta=round(p_f1 - b_f1, 1)),
            false_positive_rate=MetricDelta(before=round(b_fpr, 1), after=round(p_fpr, 1), delta=round(p_fpr - b_fpr, 1)),
            attack_success_rate=MetricDelta(before=round(b_asr, 1), after=round(p_asr, 1), delta=round(p_asr - b_asr, 1)),
            bypasses_count=MetricDelta(before=float(b_fn), after=float(p_fn), delta=float(p_fn - b_fn)),
            simulated_exposure=MetricDelta(before=round(b_exposure, 2), after=round(p_exposure, 2), delta=round(p_exposure - b_exposure, 2)),
            customer_friction_impact="LOW" if (p_fpr - b_fpr) <= 1.0 else "MEDIUM"
        )
