import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_simulation_run_endpoints_with_various_paths():
    """Verify that POST /simulations, POST /simulations/, POST /simulations/run, and POST /simulations/run/ all succeed."""
    payload = {
        "policy_id": "pol-vel-01",
        "seed": 49201,
        "attack_types": ["VELOCITY_ATTACKER"],
        "legitimate_transaction_count": 50,
        "attack_transaction_count": 20,
    }

    for path in [
        "/api/v1/simulations",
        "/api/v1/simulations/",
        "/api/v1/simulations/run",
        "/api/v1/simulations/run/",
    ]:
        res = client.post(path, json=payload)
        assert res.status_code == 201, f"Failed for path {path}: {res.text}"
        data = res.json()
        assert data["seed"] == 49201
        assert data["total_transactions"] == 70
        assert data["status"] == "COMPLETED"


def test_simulation_fire_drill_with_policy_version_id_and_legacy_id():
    """
    Verify that POST /api/v1/simulations/fire-drill succeeds with:
    1. Direct policy ID ('pol-vel-01')
    2. Policy Version ID ('pv-vel-01-v10')
    3. Legacy frontend ID ('pv-001-v12') via active policy fallback
    4. Trailing slash and non-trailing slash paths
    """
    for policy_id in ["pol-vel-01", "pv-vel-01-v10", "pv-001-v12", ""]:
        for path in ["/api/v1/simulations/fire-drill", "/api/v1/simulations/fire-drill/"]:
            res = client.post(path, json={"policy_id": policy_id, "difficulty": "HIGH", "seed": 49201})
            assert res.status_code == 201, f"Failed for policy_id '{policy_id}' on path {path}: {res.text}"
            data = res.json()
            assert data["run_type"] == "FIRE_DRILL"
            assert data["status"] == "COMPLETED"


def test_simulation_events_retrieval():
    """Verify that GET /api/v1/simulations/{id}/events returns logged simulation events."""
    # First create a simulation
    res = client.post("/api/v1/simulations/run", json={
        "policy_id": "pol-vel-01",
        "seed": 49201,
        "attack_types": ["VELOCITY_ATTACKER"],
        "legitimate_transaction_count": 30,
        "attack_transaction_count": 10,
    })
    assert res.status_code == 201
    sim_id = res.json()["id"]

    # Fetch simulation details
    sim_res = client.get(f"/api/v1/simulations/{sim_id}")
    assert sim_res.status_code == 200
    assert sim_res.json()["id"] == sim_id

    # Fetch events
    events_res = client.get(f"/api/v1/simulations/{sim_id}/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) >= 1
    assert "event_type" in events[0]


def test_complete_patch_held_out_evaluation_and_approval_workflow():
    """
    Verify complete patch lifecycle:
    1. List discovered vulnerabilities
    2. Request AI explanation
    3. Generate defensive patch proposal
    4. Execute held-out evaluation on 15% sealed test split
    5. Approve patch and verify policy version promotion & audit log
    """
    # 1. List vulnerabilities
    vulns_res = client.get("/api/v1/vulnerabilities")
    assert vulns_res.status_code == 200
    vulns = vulns_res.json()
    assert len(vulns) >= 1
    vuln_id = vulns[0]["id"]

    # 2. Explain with AI
    explain_res = client.post(f"/api/v1/vulnerabilities/{vuln_id}/explain")
    assert explain_res.status_code == 200
    assert "why_the_policy_failed" in explain_res.json() or "summary" in explain_res.json()

    # 3. Generate patch
    gen_res = client.post(f"/api/v1/patches/generate/{vuln_id}")
    assert gen_res.status_code == 201
    patch = gen_res.json()
    patch_id = patch["id"]
    assert patch["vulnerability_id"] == vuln_id
    assert patch["status"] == "PENDING_SIMULATION"

    # 4. Evaluate on held-out 15% split
    eval_res = client.post(f"/api/v1/patches/{patch_id}/evaluate?split=held_out&seed=49201")
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["status"] == "SIMULATED"
    assert eval_data["candidate_checksum"] is not None
    assert eval_data["decision_evaluation"] is not None

    # 5. Approve patch
    approve_res = client.post(f"/api/v1/patches/{patch_id}/approve", json={
        "notes": "Approved in contract test"
    })
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"

    # 6. Verify audit log entry exists
    audit_res = client.get("/api/v1/audit")
    assert audit_res.status_code == 200
    audit_logs = audit_res.json()
    assert any(log["action"] == "POLICY_PATCH_APPROVED" for log in audit_logs)


def test_all_frontend_api_endpoints_return_200():
    """Verify all GET endpoints used across all 15 frontend pages return 200 OK."""
    get_endpoints = [
        "/api/v1/dashboard/summary",
        "/api/v1/policies",
        "/api/v1/simulations",
        "/api/v1/attacks/agents",
        "/api/v1/vulnerabilities",
        "/api/v1/patches",
        "/api/v1/benchmarks/runs",
        "/api/v1/benchmarks/comparison/latest",
        "/api/v1/graph",
        "/api/v1/incidents",
        "/api/v1/datasets",
        "/api/v1/audit",
        "/api/v1/reports",
    ]

    for path in get_endpoints:
        res = client.get(path)
        assert res.status_code == 200, f"GET {path} failed with {res.status_code}: {res.text}"
