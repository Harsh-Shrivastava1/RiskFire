from typing import Any, Dict, List, Optional
from datetime import datetime
from backend.app.schemas.common import RiskDecisionOutcome
from backend.app.schemas.policy import PolicyRuleSchema, PolicyRuleType, RuleAction


class PolicyEvaluationResult:
    def __init__(
        self,
        transaction_id: str,
        outcome: RiskDecisionOutcome,
        triggered_rules: List[str],
        reason: str,
        rule_details: List[Dict[str, Any]],
        processing_time_ms: int = 1
    ):
        self.transaction_id = transaction_id
        self.outcome = outcome
        self.triggered_rules = triggered_rules
        self.reason = reason
        self.rule_details = rule_details
        self.processing_time_ms = processing_time_ms


class PolicyEngine:
    """
    Deterministic rule evaluation engine.
    Applies sequential policy rules to incoming synthetic transactions.
    """

    def evaluate_transaction(
        self,
        transaction: Dict[str, Any],
        rules: List[PolicyRuleSchema],
        history: List[Dict[str, Any]]
    ) -> PolicyEvaluationResult:
        triggered_rules: List[str] = []
        rule_details: List[Dict[str, Any]] = []
        final_outcome = RiskDecisionOutcome.ALLOWED
        reasons: List[str] = []

        # Sort rules by sequence_order
        sorted_rules = sorted(rules, key=lambda r: r.sequence_order)

        txn_amount = float(transaction.get("amount", 0.0))
        txn_account = transaction.get("account_id", "")
        txn_device = transaction.get("device_id", "")
        txn_ip = transaction.get("ip_id", "")
        txn_time_iso = transaction.get("created_at_sim", "")

        for rule in sorted_rules:
            if not rule.is_enabled:
                continue

            rule_triggered = False
            trigger_reason = ""

            if rule.rule_type == PolicyRuleType.AMOUNT_MAX:
                max_amt = float(rule.parameters.get("max_amount", 50000.0))
                if txn_amount > max_amt:
                    rule_triggered = True
                    trigger_reason = f"Transaction amount ₹{txn_amount:.2f} exceeded max threshold ₹{max_amt:.2f}"

            elif rule.rule_type == PolicyRuleType.VELOCITY_ACCOUNT:
                max_txns = int(rule.parameters.get("max_txns", 3))
                window_mins = int(rule.parameters.get("window_minutes", 10))
                
                # Count recent transactions for this account within window
                recent_count = self._count_recent_by_key(
                    history, "account_id", txn_account, txn_time_iso, window_mins
                )
                if recent_count >= max_txns:
                    rule_triggered = True
                    trigger_reason = f"Account velocity of {recent_count + 1} txns exceeded limit of {max_txns} in {window_mins}m window"

            elif rule.rule_type == PolicyRuleType.VELOCITY_DEVICE:
                max_txns = int(rule.parameters.get("max_txns_per_device", 4))
                window_mins = int(rule.parameters.get("window_minutes", 60))
                
                recent_count = self._count_recent_by_key(
                    history, "device_id", txn_device, txn_time_iso, window_mins
                )
                if recent_count >= max_txns:
                    rule_triggered = True
                    trigger_reason = f"Device velocity of {recent_count + 1} txns exceeded limit of {max_txns} in {window_mins}m window"

            elif rule.rule_type == PolicyRuleType.VELOCITY_IP:
                max_txns = int(rule.parameters.get("max_txns_per_ip", 10))
                window_mins = int(rule.parameters.get("window_minutes", 30))
                
                recent_count = self._count_recent_by_key(
                    history, "ip_id", txn_ip, txn_time_iso, window_mins
                )
                if recent_count >= max_txns:
                    rule_triggered = True
                    trigger_reason = f"IP velocity of {recent_count + 1} txns exceeded limit of {max_txns} in {window_mins}m window"

            if rule_triggered:
                triggered_rules.append(rule.name)
                rule_details.append({
                    "rule_id": rule.id,
                    "rule_name": rule.name,
                    "rule_type": rule.rule_type.value,
                    "action": rule.action.value,
                    "reason": trigger_reason
                })
                reasons.append(trigger_reason)

                # Determine strictest outcome: BLOCK > FLAG > ALLOWED
                if rule.action == RuleAction.BLOCK:
                    final_outcome = RiskDecisionOutcome.BLOCKED
                elif rule.action == RuleAction.FLAG and final_outcome != RiskDecisionOutcome.BLOCKED:
                    final_outcome = RiskDecisionOutcome.FLAGGED

        combined_reason = "; ".join(reasons) if reasons else "No policy constraints violated."

        return PolicyEvaluationResult(
            transaction_id=transaction.get("id", ""),
            outcome=final_outcome,
            triggered_rules=triggered_rules,
            reason=combined_reason,
            rule_details=rule_details,
            processing_time_ms=1
        )

    def _count_recent_by_key(
        self,
        history: List[Dict[str, Any]],
        key: str,
        target_val: str,
        current_time_iso: str,
        window_minutes: int
    ) -> int:
        if not target_val:
            return 0
        count = 0
        try:
            curr_dt = datetime.fromisoformat(current_time_iso.replace("Z", "+00:00"))
        except Exception:
            curr_dt = datetime.now()

        for h in history:
            if h.get(key) == target_val:
                try:
                    h_time = datetime.fromisoformat(h.get("created_at_sim", "").replace("Z", "+00:00"))
                    diff_mins = (curr_dt - h_time).total_seconds() / 60.0
                    if 0 <= diff_mins <= window_minutes:
                        count += 1
                except Exception:
                    count += 1
        return count
