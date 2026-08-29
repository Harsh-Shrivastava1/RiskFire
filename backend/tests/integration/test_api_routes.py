import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoints_return_200():
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json()["status"] in {"ok", "degraded"}

    r2 = client.get("/api/v1/health")
    assert r2.status_code == 200
    assert r2.json()["sandbox_mode"] == "SYNTHETIC_ACTIVE"


def test_dashboard_summary_returns_200():
    r = client.get("/api/v1/dashboard/summary")
    assert r.status_code == 200
    data = r.json()
    assert "metrics" in data
    assert "riskTrend" in data
    assert "topVulnerabilities" in data
    assert "policyScope" in data
    assert data["metrics"]["riskPostureScore"] is not None



def test_policies_crud_and_status_codes():
    # 1. List policies -> 200
    r_list = client.get("/api/v1/policies")
    assert r_list.status_code == 200
    assert len(r_list.json()) >= 1

    # 2. Get specific existing policy -> 200
    r_get = client.get("/api/v1/policies/pol-vel-01")
    assert r_get.status_code == 200
    assert r_get.json()["id"] == "pol-vel-01"

    # 3. Get non-existent policy -> 404
    r_404 = client.get("/api/v1/policies/pol-non-existent")
    assert r_404.status_code == 404
    assert r_404.json()["error"]["code"] == "RESOURCE_NOT_FOUND"

    # 4. Create valid policy -> 201 Created
    create_payload = {
        "name": "Integration Test Policy",
        "description": "Created during API integration tests",
        "category": "VELOCITY",
        "rules": [
            {
                "id": "rule-int-1",
                "name": "Amount Cap",
                "rule_type": "AMOUNT_MAX",
                "category": "AMOUNT",
                "parameters": {"max_amount": 25000.0},
                "action": "BLOCK",
                "is_enabled": True,
                "sequence_order": 1,
                "description": "Block > 25k"
            }
        ]
    }
    r_create = client.post("/api/v1/policies", json=create_payload)
    assert r_create.status_code == 201
    created_id = r_create.json()["id"]

    # 5. Create invalid policy (empty rules) -> 400 Bad Request
    r_invalid = client.post("/api/v1/policies", json={
        "name": "Invalid Empty Policy",
        "description": "No rules",
        "category": "VELOCITY",
        "rules": []
    })
    assert r_invalid.status_code == 400
    assert r_invalid.json()["error"]["code"] == "INVALID_POLICY"

    # 6. Update policy -> 200 OK
    r_update = client.put(f"/api/v1/policies/{created_id}", json={"name": "Updated Test Policy"})
    assert r_update.status_code == 200
    assert r_update.json()["name"] == "Updated Test Policy"


def test_simulations_endpoints_and_status_codes():
    # 1. List simulations -> 200
    r_list = client.get("/api/v1/simulations")
    assert r_list.status_code == 200
    assert len(r_list.json()) >= 1

    # 2. Get specific simulation -> 200
    r_get = client.get("/api/v1/simulations/sim-run-8921")
    assert r_get.status_code == 200
    assert r_get.json()["seed"] == 49201

    # 3. Create simulation -> 201 Created
    r_run = client.post("/api/v1/simulations", json={
        "policy_id": "pol-vel-01",
        "seed": 49201,
        "attack_types": ["VELOCITY_ATTACKER"],
        "legitimate_transaction_count": 50,
        "attack_transaction_count": 20
    })
    assert r_run.status_code == 201
    assert r_run.json()["total_transactions"] == 70

    # 4. Trigger Fire Drill -> 201 Created
    r_fd = client.post("/api/v1/simulations/fire-drill", json={
        "policy_id": "pol-vel-01",
        "seed": 49201,
        "difficulty": "HIGH"
    })
    assert r_fd.status_code == 201
    assert r_fd.json()["run_type"] == "FIRE_DRILL"


def test_vulnerabilities_and_patches_endpoints():
    # 1. List vulnerabilities -> 200
    r_vulns = client.get("/api/v1/vulnerabilities")
    assert r_vulns.status_code == 200
    assert len(r_vulns.json()) >= 1

    # 2. Get specific vulnerability -> 200
    r_v = client.get("/api/v1/vulnerabilities/vuln-001")
    assert r_v.status_code == 200
    assert r_v.json()["id"] == "vuln-001"

    # 3. Generate AI patch for vulnerability -> 201 Created
    r_gen = client.post("/api/v1/patches/generate/vuln-001")
    assert r_gen.status_code == 201
    patch_data = r_gen.json()
    assert patch_data["vulnerability_id"] == "vuln-001"
    patch_id = patch_data["id"]

    # 4. Approve patch -> 200 OK
    r_app = client.post(f"/api/v1/patches/{patch_id}/approve", json={"notes": "Approved in API test"})
    assert r_app.status_code == 200
    assert r_app.json()["status"] == "APPROVED"

    # 5. Approving already approved patch -> 409 Conflict
    r_conflict = client.post(f"/api/v1/patches/{patch_id}/approve", json={"notes": "Duplicate"})
    assert r_conflict.status_code == 409
    assert r_conflict.json()["error"]["code"] == "RESOURCE_CONFLICT"


def test_benchmarks_and_graph_and_datasets_and_audit():
    # Benchmarks
    r_bm = client.get("/api/v1/benchmarks/runs")
    assert r_bm.status_code == 200
    assert len(r_bm.json()) >= 1

    r_cmp = client.get("/api/v1/benchmarks/comparison/latest")
    assert r_cmp.status_code == 200
    assert r_cmp.json()["recommendation"] == "APPROVE_PATCH"

    # Attack Graph
    r_graph = client.get("/api/v1/graph")
    assert r_graph.status_code == 200
    graph_data = r_graph.json()
    assert "nodes" in graph_data
    assert "edges" in graph_data
    assert len(graph_data["nodes"]) >= 1

    # Datasets
    r_ds = client.get("/api/v1/datasets")
    assert r_ds.status_code == 200
    assert len(r_ds.json()) >= 1

    # Audit Logs
    r_aud = client.get("/api/v1/audit")
    assert r_aud.status_code == 200
    assert len(r_aud.json()) >= 1

    # Incidents
    r_inc = client.get("/api/v1/incidents")
    assert r_inc.status_code == 200
    assert len(r_inc.json()) >= 1

    # Reports
    r_rep = client.get("/api/v1/reports")
    assert r_rep.status_code == 200
    assert len(r_rep.json()) >= 1

    # Generate Report -> 201 Created
    r_gen_rep = client.post("/api/v1/reports/generate", json={
        "title": "API Test Generated Report",
        "simulation_id": "sim-run-8921"
    })
    assert r_gen_rep.status_code == 201
    assert r_gen_rep.json()["title"] == "API Test Generated Report"


def test_ai_routes_plan_and_explain():
    # 1. Attack Plan -> 200 OK
    r_plan = client.post("/api/v1/attacks/plan", json={
        "merchant_id": "m-dev-01",
        "simulation_id": "sim-run-8921",
        "active_policy_names": ["Core Merchant Velocity & High-Value Guard"],
        "attack_type": "IDENTITY_FRAGMENTER",
        "difficulty": "HIGH"
    })
    assert r_plan.status_code == 200
    plan = r_plan.json()
    assert plan["attack_type"] == "IDENTITY_FRAGMENTER"
    assert "objective" in plan
    assert plan["actors_count"] >= 1

    # 2. Vulnerability Explain -> 200 OK
    r_vulns = client.get("/api/v1/vulnerabilities")
    assert r_vulns.status_code == 200
    vulns = r_vulns.json()
    assert len(vulns) >= 1
    target_vuln_id = vulns[0]["id"]

    r_explain = client.post(f"/api/v1/vulnerabilities/{target_vuln_id}/explain")
    assert r_explain.status_code == 200
    explanation = r_explain.json()
    assert "summary" in explanation
    assert "key_signal_missed" in explanation
    assert explanation["confidence"] in {"HIGH", "MEDIUM", "LOW"}
