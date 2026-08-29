import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from backend.app.schemas.benchmark import (
    BenchmarkMetricsSchema,
    BenchmarkComparisonResponse,
    ScenarioMetricResult,
    CandidatePolicySnapshot,
)
from backend.app.schemas.common import DatasetSplitType
from backend.app.schemas.patch import PatchDecisionEvaluation


class PatchDecisionPolicy:
    """
    Transparent, configurable criteria for deterministic patch decisions.
    All decision criteria are mathematical and verifiable — no magic numbers.
    Decision policy thresholds represent configurable risk tolerances (e.g. merchant
    friction ceilings and minimum required recall improvements) and can be tailored
    to specific merchant risk appetites.
    """
    def __init__(
        self,
        max_acceptable_fpr_increase: float = 1.0,
        min_required_recall_gain: float = 10.0,
        max_acceptable_recall_loss: float = -1.0,
        require_held_out_evaluation: bool = False,
    ):
        self.max_acceptable_fpr_increase = max_acceptable_fpr_increase
        self.min_required_recall_gain = min_required_recall_gain
        self.max_acceptable_recall_loss = max_acceptable_recall_loss
        self.require_held_out_evaluation = require_held_out_evaluation

    def to_dict(self) -> Dict[str, Any]:
        return {
            "max_acceptable_fpr_increase_pct": self.max_acceptable_fpr_increase,
            "min_required_recall_gain_pct": self.min_required_recall_gain,
            "max_acceptable_recall_loss_pct": self.max_acceptable_recall_loss,
            "require_held_out_evaluation": self.require_held_out_evaluation,
            "policy_type": "ConfigurableRiskDecisionPolicy",
        }


class PatchDecisionEngine:
    """
    Deterministic security decision engine for evaluating candidate policy patches.
    Authority Law: Consumes benchmark & replay metrics and evaluates strictly via
    deterministic domain logic. AI cannot overwrite or modify the decision.
    """

    def __init__(self, policy: Optional[PatchDecisionPolicy] = None):
        self.policy = policy or PatchDecisionPolicy()

    def _validate_metrics_integrity(
        self,
        baseline: BenchmarkMetricsSchema,
        candidate: BenchmarkMetricsSchema
    ) -> List[str]:
        """Validates that metrics are mathematically valid, non-negative, and non-contradictory."""
        anomalies: List[str] = []

        # Check for NaN / Inf
        for name, m in [("Baseline", baseline), ("Candidate", candidate)]:
            for field_name in ["recall", "false_positive_rate", "precision", "f1_score", "attack_success_rate", "simulated_exposure"]:
                val = getattr(m, field_name, None)
                if val is None or math.isnan(val) or math.isinf(val):
                    anomalies.append(f"{name} metric '{field_name}' is NaN or undefined.")
                elif field_name in ["recall", "false_positive_rate", "precision", "f1_score", "attack_success_rate"]:
                    if val < 0.0 or val > 100.0:
                        anomalies.append(f"{name} metric '{field_name}' ({val}%) is outside valid 0-100% percentage range.")

            if m.total_transactions < 0:
                anomalies.append(f"{name} total_transactions ({m.total_transactions}) is negative.")
            if m.true_positives < 0 or m.false_positives < 0 or m.true_negatives < 0 or m.false_negatives < 0:
                anomalies.append(f"{name} confusion matrix counts cannot be negative.")
            if m.true_positives + m.false_negatives > m.total_transactions:
                anomalies.append(f"{name} total adversarial transactions exceeds total transactions.")

        return anomalies

    def evaluate_decision(
        self,
        baseline_metrics: BenchmarkMetricsSchema,
        candidate_metrics: BenchmarkMetricsSchema,
        comparison: Optional[BenchmarkComparisonResponse],
        candidate_snapshot: Optional[CandidatePolicySnapshot],
        scenario_results: Optional[List[ScenarioMetricResult]] = None,
        dataset_split: DatasetSplitType = DatasetSplitType.HELD_OUT,
    ) -> PatchDecisionEvaluation:
        now_iso = datetime.now(timezone.utc).isoformat()
        checksum = candidate_snapshot.candidate_checksum if candidate_snapshot else "UNFROZEN_CANDIDATE"
        is_held_out = (dataset_split == DatasetSplitType.HELD_OUT)

        # 1. Metric Integrity Check (Rule: Malformed or contradictory metrics must NEVER approve)
        anomalies = self._validate_metrics_integrity(baseline_metrics, candidate_metrics)
        if anomalies:
            return PatchDecisionEvaluation(
                decision="REJECT_PATCH",
                recommendation_title="Patch Rejected: Metric Integrity Error",
                recommendation_summary="Deterministic evaluation failed due to anomalous or contradictory benchmark metrics.",
                reasons=[f"Metric anomaly: {a}" for a in anomalies],
                security_improvements=["No verifiable security improvement due to metric anomalies."],
                operational_regressions=["Metric integrity validation failed."],
                trade_off_summary="Cannot evaluate trade-offs on contradictory or malformed metrics.",
                metrics_considered={"anomalies": anomalies},
                thresholds_applied=self.policy.to_dict(),
                evaluated_at=now_iso,
                candidate_checksum=checksum,
                dataset_split=dataset_split.value,
                is_held_out_evaluated=is_held_out
            )

        # 2. Calculate deltas
        delta_recall = round(candidate_metrics.recall - baseline_metrics.recall, 1)
        delta_fpr = round(candidate_metrics.false_positive_rate - baseline_metrics.false_positive_rate, 1)
        delta_precision = round(candidate_metrics.precision - baseline_metrics.precision, 1)
        delta_exposure = round(baseline_metrics.simulated_exposure - candidate_metrics.simulated_exposure, 2)
        delta_bypasses = baseline_metrics.successful_bypasses - candidate_metrics.successful_bypasses
        net_improvement = round(delta_recall - delta_fpr, 1)

        # 3. Categorize Security Improvements
        improvements: List[str] = []
        if delta_recall > 0:
            improvements.append(
                f"Detection recall increased by +{delta_recall:.1f}% "
                f"({baseline_metrics.recall:.1f}% -> {candidate_metrics.recall:.1f}%)."
            )
        if delta_exposure > 0:
            improvements.append(
                f"Simulated financial exposure reduced by INR {delta_exposure:,.2f} "
                f"(from INR {baseline_metrics.simulated_exposure:,.2f} to INR {candidate_metrics.simulated_exposure:,.2f})."
            )
        if delta_bypasses > 0:
            improvements.append(
                f"Adversarial bypasses blocked: {delta_bypasses} successful attacks prevented "
                f"({baseline_metrics.successful_bypasses} -> {candidate_metrics.successful_bypasses})."
            )
        if delta_precision > 0:
            improvements.append(
                f"Precision improved by +{delta_precision:.1f}% "
                f"({baseline_metrics.precision:.1f}% -> {candidate_metrics.precision:.1f}%)."
            )

        if not improvements:
            improvements.append("No measurable security or financial exposure improvements detected.")

        # 4. Categorize Operational Regressions
        regressions: List[str] = []
        if delta_fpr > self.policy.max_acceptable_fpr_increase:
            regressions.append(
                f"False positive rate increased by +{delta_fpr:.1f}% "
                f"({baseline_metrics.false_positive_rate:.1f}% -> {candidate_metrics.false_positive_rate:.1f}%), "
                f"exceeding the {self.policy.max_acceptable_fpr_increase:.1f}% allowable customer friction ceiling."
            )
        elif delta_fpr > 0:
            regressions.append(
                f"Marginal false positive rate increase of +{delta_fpr:.1f}% "
                f"({baseline_metrics.false_positive_rate:.1f}% -> {candidate_metrics.false_positive_rate:.1f}%)."
            )

        if delta_recall < self.policy.max_acceptable_recall_loss:
            regressions.append(
                f"Detection recall degraded by {delta_recall:.1f}% "
                f"({baseline_metrics.recall:.1f}% -> {candidate_metrics.recall:.1f}%)."
            )

        if delta_exposure < 0:
            regressions.append(
                f"Simulated financial exposure increased by INR {abs(delta_exposure):,.2f}."
            )

        if not regressions:
            regressions.append("Zero operational or false-positive regressions detected.")

        # 5. Evaluate Deterministic Decision Rules
        reasons: List[str] = []

        # Rule 1: Operational or Security Regression Check
        has_fpr_regression = delta_fpr > self.policy.max_acceptable_fpr_increase
        has_recall_regression = delta_recall < self.policy.max_acceptable_recall_loss
        has_negative_net = net_improvement < 0

        if has_fpr_regression or has_recall_regression or has_negative_net:
            decision = "REJECT_PATCH"
            title = "Patch Rejected: Operational / Security Regression Detected"
            
            if has_fpr_regression:
                reasons.append(
                    f"FPR increase of +{delta_fpr:.1f}% violates maximum acceptable threshold of "
                    f"{self.policy.max_acceptable_fpr_increase:.1f}%, introducing excessive merchant checkout friction."
                )
            if has_recall_regression:
                reasons.append(
                    f"Recall degradation of {delta_recall:.1f}% leaves new attack vectors unprotected."
                )
            if has_negative_net:
                reasons.append(
                    f"Net policy improvement score is {net_improvement:+.1f} (Delta Recall - Delta FPR < 0)."
                )

            summary = (
                f"RiskFire's deterministic decision engine recommends REJECTING this patch. While it "
                f"{'reduced exposure by INR ' + f'{delta_exposure:,.2f}' if delta_exposure > 0 else 'had no exposure benefit'}, "
                f"the operational friction (FPR {delta_fpr:+.1f}%) exceeds acceptable enterprise safety boundaries."
            )
            trade_off = (
                f"Security gain (+{delta_recall:.1f}% recall) is outweighed by operational regression "
                f"(+{delta_fpr:.1f}% false positives on legitimate customer orders)."
            )

        # Rule 2: Clear Improvement Approval
        elif net_improvement >= self.policy.min_required_recall_gain and delta_fpr <= self.policy.max_acceptable_fpr_increase:
            decision = "APPROVE_PATCH"
            title = "Patch Approved: Significant Net Security Gain Proven"
            reasons.append(
                f"Net policy improvement (+{net_improvement:.1f}%) meets or exceeds the required target of "
                f"+{self.policy.min_required_recall_gain:.1f}%."
            )
            reasons.append(
                f"FPR impact ({delta_fpr:+.1f}%) remains strictly within the {self.policy.max_acceptable_fpr_increase:.1f}% ceiling."
            )
            if delta_exposure > 0:
                reasons.append(
                    f"INR {delta_exposure:,.2f} in simulated adversarial financial loss prevented."
                )
            summary = (
                f"RiskFire's deterministic decision engine recommends APPROVING this candidate. It achieves "
                f"a verified +{delta_recall:.1f}% recall increase with safe false-positive impact ({delta_fpr:+.1f}%)."
            )
            trade_off = (
                f"High-confidence security gain with minimal customer friction impact. Net improvement: +{net_improvement:.1f}%."
            )

        # Rule 3: Marginal / Ambiguous Changes -> Manual Review
        else:
            decision = "MANUAL_REVIEW_REQUIRED"
            title = "Manual Review Required: Marginal Improvement"
            reasons.append(
                f"Net improvement (+{net_improvement:.1f}%) is below the automated approval threshold "
                f"(+{self.policy.min_required_recall_gain:.1f}%)."
            )
            reasons.append(
                f"No disqualifying regressions found (FPR {delta_fpr:+.1f}% <= {self.policy.max_acceptable_fpr_increase:.1f}%)."
            )
            summary = (
                f"Candidate demonstrates marginal changes (+{delta_recall:.1f}% recall, {delta_fpr:+.1f}% FPR). "
                f"Requires risk team manual review before deployment."
            )
            trade_off = (
                f"Marginal security gain (+{delta_recall:.1f}%) with modest operational footprint ({delta_fpr:+.1f}% FPR)."
            )

        # Check Scenario-Level Consistency
        if scenario_results:
            zero_recall_scenarios = [s.scenario_id for s in scenario_results if s.recall == 0.0]
            if zero_recall_scenarios:
                reasons.append(
                    f"{len(zero_recall_scenarios)}/10 attack scenarios (e.g. {', '.join(zero_recall_scenarios[:3])}) "
                    "remain unmitigated by this candidate configuration."
                )

        metrics_considered = {
            "baseline_recall": baseline_metrics.recall,
            "candidate_recall": candidate_metrics.recall,
            "delta_recall": delta_recall,
            "baseline_fpr": baseline_metrics.false_positive_rate,
            "candidate_fpr": candidate_metrics.false_positive_rate,
            "delta_fpr": delta_fpr,
            "baseline_exposure": baseline_metrics.simulated_exposure,
            "candidate_exposure": candidate_metrics.simulated_exposure,
            "delta_exposure": delta_exposure,
            "baseline_bypasses": baseline_metrics.successful_bypasses,
            "candidate_bypasses": candidate_metrics.successful_bypasses,
            "net_improvement": net_improvement,
        }

        return PatchDecisionEvaluation(
            decision=decision,
            recommendation_title=title,
            recommendation_summary=summary,
            reasons=reasons,
            security_improvements=improvements,
            operational_regressions=regressions,
            trade_off_summary=trade_off,
            metrics_considered=metrics_considered,
            thresholds_applied=self.policy.to_dict(),
            evaluated_at=now_iso,
            candidate_checksum=checksum,
            dataset_split=dataset_split.value,
            is_held_out_evaluated=is_held_out
        )
