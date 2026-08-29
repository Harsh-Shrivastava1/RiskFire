import pytest
from backend.app.engines.policy.policy_engine import PolicyEngine
from backend.app.schemas.policy import PolicyRuleSchema, PolicyRuleType, PolicyCategory, RuleAction
from backend.app.schemas.common import RiskDecisionOutcome


def test_amount_ceiling_rule_blocks_high_amount():
    engine = PolicyEngine()
    rule = PolicyRuleSchema(
        id="rule-amt",
        name="Max Amount Ceiling",
        rule_type=PolicyRuleType.AMOUNT_MAX,
        category=PolicyCategory.AMOUNT,
        parameters={"max_amount": 10000.0},
        action=RuleAction.BLOCK,
        is_enabled=True,
        sequence_order=1
    )

    txn_under = {"id": "t1", "amount": 5000.0, "account_id": "acc-1", "created_at_sim": "2026-08-20T10:00:00Z"}
    txn_over = {"id": "t2", "amount": 15000.0, "account_id": "acc-1", "created_at_sim": "2026-08-20T10:01:00Z"}

    res_under = engine.evaluate_transaction(txn_under, [rule], [])
    res_over = engine.evaluate_transaction(txn_over, [rule], [])

    assert res_under.outcome == RiskDecisionOutcome.ALLOWED
    assert len(res_under.triggered_rules) == 0

    assert res_over.outcome == RiskDecisionOutcome.BLOCKED
    assert "Max Amount Ceiling" in res_over.triggered_rules


def test_account_velocity_rule_window_counting():
    engine = PolicyEngine()
    rule = PolicyRuleSchema(
        id="rule-vel",
        name="Account 3-in-10m Limit",
        rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
        category=PolicyCategory.VELOCITY,
        parameters={"max_txns": 3, "window_minutes": 10},
        action=RuleAction.BLOCK,
        is_enabled=True,
        sequence_order=1
    )

    history = [
        {"id": "t1", "amount": 1000.0, "account_id": "acc-1", "created_at_sim": "2026-08-20T10:00:00Z"},
        {"id": "t2", "amount": 1000.0, "account_id": "acc-1", "created_at_sim": "2026-08-20T10:02:00Z"},
        {"id": "t3", "amount": 1000.0, "account_id": "acc-1", "created_at_sim": "2026-08-20T10:04:00Z"},
    ]

    # 4th transaction within 10m window should trigger BLOCK
    txn_4 = {"id": "t4", "amount": 1000.0, "account_id": "acc-1", "created_at_sim": "2026-08-20T10:06:00Z"}
    res_4 = engine.evaluate_transaction(txn_4, [rule], history)

    assert res_4.outcome == RiskDecisionOutcome.BLOCKED
    assert "Account 3-in-10m Limit" in res_4.triggered_rules

    # A transaction 15m later should be ALLOWED because previous ones are outside window
    txn_late = {"id": "t5", "amount": 1000.0, "account_id": "acc-1", "created_at_sim": "2026-08-20T10:25:00Z"}
    res_late = engine.evaluate_transaction(txn_late, [rule], history)

    assert res_late.outcome == RiskDecisionOutcome.ALLOWED


def test_rule_precedence_block_overrides_flag():
    engine = PolicyEngine()
    rule_flag = PolicyRuleSchema(
        id="r1",
        name="Flag Rule",
        rule_type=PolicyRuleType.AMOUNT_MAX,
        category=PolicyCategory.AMOUNT,
        parameters={"max_amount": 1000.0},
        action=RuleAction.FLAG,
        is_enabled=True,
        sequence_order=1
    )
    rule_block = PolicyRuleSchema(
        id="r2",
        name="Block Rule",
        rule_type=PolicyRuleType.AMOUNT_MAX,
        category=PolicyCategory.AMOUNT,
        parameters={"max_amount": 5000.0},
        action=RuleAction.BLOCK,
        is_enabled=True,
        sequence_order=2
    )

    txn = {"id": "t1", "amount": 8000.0, "account_id": "acc-1", "created_at_sim": "2026-08-20T10:00:00Z"}
    res = engine.evaluate_transaction(txn, [rule_flag, rule_block], [])

    assert res.outcome == RiskDecisionOutcome.BLOCKED
    assert len(res.triggered_rules) == 2
