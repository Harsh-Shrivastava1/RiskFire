"""
Integration tests for Policy Scoping, Policy Lineage, Fair Deterministic Policy Comparison,
and Strict Persistence in RiskFire.
"""

import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.schemas.policy import PolicyCreate, PolicyRuleSchema, RuleAction, PolicyRuleType, PolicyCategory
from backend.app.schemas.benchmark import PolicyComparisonRequest


@pytest.mark.asyncio
async def test_dashboard_scoped_to_evaluated_policy():
    """Verify that requesting dashboard summary for evaluated policy returns scoped metrics and policy metadata."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Fetch active policies
        pol_res = await ac.get("/api/v1/policies")
        assert pol_res.status_code == 200
        policies = pol_res.json()
        assert len(policies) > 0
        target_policy = policies[0]
        policy_id = target_policy["id"]

        # Get dashboard summary for this policy
        res = await ac.get(f"/api/v1/dashboard/summary?policy_id={policy_id}")
        assert res.status_code == 200
        data = res.json()

        assert "policyScope" in data
        assert data["policyScope"]["policyId"] == policy_id
        assert data["policyScope"]["policyName"] == target_policy["name"]
        assert "metrics" in data
        assert "isEvaluated" in data["metrics"]
        assert data["metrics"]["isEvaluated"] is True
        assert data["metrics"]["riskPostureScore"] is not None
        assert 0 <= data["metrics"]["riskPostureScore"] <= 100
        assert data["metrics"]["detectionRecall"] >= 0.0


@pytest.mark.asyncio
async def test_dashboard_scoped_to_unevaluated_policy():
    """Verify that an unevaluated policy returns is_evaluated=False with no fake fallbacks."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create a brand new policy that has zero simulations
        new_policy_payload = {
            "name": "Untested Test Policy For Verification",
            "description": "Brand new policy with zero simulation history",
            "category": "VELOCITY",
            "rules": [
                {
                    "name": "Account Velocity Block",
                    "rule_type": "VELOCITY_ACCOUNT",
                    "category": "VELOCITY",
                    "action": "BLOCK",
                    "parameters": {"max_count": 5, "window_minutes": 10},
                    "description": "Block >5 txns per account in 10 mins",
                }
            ],
        }
        create_res = await ac.post("/api/v1/policies", json=new_policy_payload)
        assert create_res.status_code == 201
        created_policy = create_res.json()
        new_policy_id = created_policy["id"]

        # Fetch dashboard summary for this brand new policy
        res = await ac.get(f"/api/v1/dashboard/summary?policy_id={new_policy_id}")
        assert res.status_code == 200
        data = res.json()

        assert data["policyScope"]["policyId"] == new_policy_id
        assert data["policyScope"]["isEvaluated"] is False
        assert data["metrics"]["isEvaluated"] is False
        # Unevaluated policies must have 0 / None metrics, never fake fallback data
        assert data["metrics"]["simulationsRunCount"] == 0
        assert data["metrics"]["policyBypassesCount"] == 0
        assert data["metrics"]["simulatedExposure"] == 0.0
        assert data["metrics"]["riskPostureScore"] is None
        assert len(data["topVulnerabilities"]) == 0


@pytest.mark.asyncio
async def test_vulnerabilities_filtered_by_policy_id():
    """Verify vulnerability listing filters by policy_id correctly."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        pol_res = await ac.get("/api/v1/policies")
        assert pol_res.status_code == 200
        policies = pol_res.json()
        target_policy_id = policies[0]["id"]

        # Query vulnerabilities scoped to target policy
        vuln_res = await ac.get(f"/api/v1/vulnerabilities?policy_id={target_policy_id}")
        assert vuln_res.status_code == 200
        vulns = vuln_res.json()
        assert isinstance(vulns, list)
        for v in vulns:
            assert v["policy_id"] == target_policy_id


@pytest.mark.asyncio
async def test_deterministic_policy_comparison_engine():
    """Verify fair deterministic policy comparison between Policy A and Policy B."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        pol_res = await ac.get("/api/v1/policies")
        assert pol_res.status_code == 200
        policies = pol_res.json()

        if len(policies) < 2:
            # Create a second policy to compare against
            policy_b_payload = {
                "name": "Candidate Tightened Guard Policy",
                "description": "Stricter velocity thresholds for comparison",
                "category": "VELOCITY",
                "rules": [
                    {
                        "name": "Tight Velocity Rule",
                        "rule_type": "VELOCITY_ACCOUNT",
                        "category": "VELOCITY",
                        "action": "BLOCK",
                        "parameters": {"max_count": 2, "window_minutes": 5},
                        "description": "Block >2 txns per account in 5 mins",
                    },
                    {
                        "name": "Amount Threshold",
                        "rule_type": "AMOUNT_MAX",
                        "category": "AMOUNT",
                        "action": "BLOCK",
                        "parameters": {"max_amount": 10000.0},
                        "description": "Block > 10k",
                    }
                ],
            }
            create_b_res = await ac.post("/api/v1/policies", json=policy_b_payload)
            assert create_b_res.status_code == 201
            policies.append(create_b_res.json())

        policy_a = policies[0]
        policy_b = policies[1]

        comparison_req = {
            "policy_a_id": policy_a["id"],
            "policy_b_id": policy_b["id"],
            "dataset_id": "ds-synthetic-v1",
            "dataset_split": "held_out",
            "seed": 49201,
        }

        # 1. Run comparison
        res = await ac.post("/api/v1/benchmarks/compare-policies", json=comparison_req)
        assert res.status_code == 200
        report = res.json()

        # Check core report structure
        assert "comparison_id" in report
        assert report["policy_a_id"] == policy_a["id"]
        assert report["policy_b_id"] == policy_b["id"]
        assert report["seed"] == 49201
        assert report["dataset_split"] == "held_out"

        # Check fairness verification
        assert "fairness" in report
        assert report["fairness"]["is_fair_comparison"] is True
        assert report["fairness"]["fairness_status"] == "VERIFIED"
        assert report["fairness"]["total_workload_transactions"] > 0
        assert report["fairness"]["scenarios_hash"] is not None

        # Check deterministic recommendation
        assert report["recommendation"] in [
            "RECOMMEND_POLICY_A",
            "RECOMMEND_POLICY_B",
            "MANUAL_REVIEW_REQUIRED",
            "NO_CLEAR_WINNER",
            "NOT_DIRECTLY_COMPARABLE",
        ]
        assert len(report["recommendation_reason"]) > 0

        # Check 10 canonical scenarios
        assert len(report["scenarios"]) == 10
        assert report["total_scenarios_evaluated"] == 10
        scenario_ids = [s["scenario_id"] for s in report["scenarios"]]
        assert "SCN-01" in scenario_ids
        assert "SCN-10" in scenario_ids

        # 2. Verify comparison is persisted and retrievable by ID
        comparison_id = report["comparison_id"]
        get_res = await ac.get(f"/api/v1/benchmarks/comparisons/{comparison_id}")
        assert get_res.status_code == 200
        fetched = get_res.json()
        assert fetched["comparison_id"] == comparison_id

        # 3. Verify comparison listing
        list_res = await ac.get("/api/v1/benchmarks/comparisons")
        assert list_res.status_code == 200
        comparisons_list = list_res.json()
        assert any(c["comparison_id"] == comparison_id for c in comparisons_list)


@pytest.mark.asyncio
async def test_dashboard_policy_switching_flow():
    """Verify switching between evaluated Policy A and unevaluated Policy B returns distinct scoped metrics."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Get active policies list
        pol_res = await ac.get("/api/v1/policies")
        assert pol_res.status_code == 200
        policies = pol_res.json()
        assert len(policies) > 0
        policy_a_id = policies[0]["id"]

        # 1. Fetch summary for evaluated Policy A
        res_a = await ac.get(f"/api/v1/dashboard/summary?policy_id={policy_a_id}")
        assert res_a.status_code == 200
        data_a = res_a.json()
        assert data_a["policyScope"]["policyId"] == policy_a_id
        assert data_a["policyScope"]["isEvaluated"] is True

        # 2. Create unevaluated Policy B
        new_policy_payload = {
            "name": "Candidate Switch Test Guard Policy",
            "description": "Unevaluated candidate policy for testing switching",
            "category": "VELOCITY",
            "rules": [
                {
                    "name": "Switch Velocity Rule",
                    "rule_type": "VELOCITY_ACCOUNT",
                    "category": "VELOCITY",
                    "action": "BLOCK",
                    "parameters": {"max_count": 5, "window_minutes": 10},
                    "description": "Block >5 txns per account in 10 mins",
                }
            ],
        }
        create_res = await ac.post("/api/v1/policies", json=new_policy_payload)
        assert create_res.status_code == 201
        policy_b = create_res.json()
        policy_b_id = policy_b["id"]

        # Switch to unevaluated Policy B
        res_b = await ac.get(f"/api/v1/dashboard/summary?policy_id={policy_b_id}")
        assert res_b.status_code == 200
        data_b = res_b.json()
        assert data_b["policyScope"]["policyId"] == policy_b_id
        assert data_b["policyScope"]["isEvaluated"] is False
        assert data_b["metrics"]["isEvaluated"] is False
        assert data_b["metrics"]["riskPostureScore"] is None
        assert data_b["metrics"]["simulatedExposure"] == 0.0

        # 3. Switch back to Policy A and confirm clean restore
        res_a_again = await ac.get(f"/api/v1/dashboard/summary?policy_id={policy_a_id}")
        assert res_a_again.status_code == 200
        data_a_again = res_a_again.json()
        assert data_a_again["policyScope"]["policyId"] == policy_a_id
        assert data_a_again["policyScope"]["isEvaluated"] is True
        assert data_a_again["metrics"]["riskPostureScore"] == data_a["metrics"]["riskPostureScore"]
        assert data_a_again["metrics"]["simulatedExposure"] == data_a["metrics"]["simulatedExposure"]


