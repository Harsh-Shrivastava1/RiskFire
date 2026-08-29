import pytest
import mongomock
from httpx import AsyncClient, ASGITransport
from backend.app.main import app
from backend.app.database.mongo import get_database, is_mongo_connected, init_indexes
from backend.app.api.v1.dependencies import initialize_services_with_db
from backend.scripts.seed_database import seed_data_into_db
from backend.app.database.repositories.mongo import (
    MongoPolicyRepository,
    MongoSimulationRepository,
    MongoVulnerabilityRepository,
    MongoIncidentRepository,
    MongoPatchRepository,
    MongoAuditRepository,
)


@pytest.fixture(autouse=True)
def setup_mongo_test_env(monkeypatch):
    """
    Sets up the MongoDB persistence test environment.
    If live MongoDB is available, executes against the live cluster.
    Otherwise, creates a MongoDB database instance using mongomock,
    seeds it, and binds all real Mongo repositories to the service layer.
    """
    if is_mongo_connected():
        db = get_database()
        init_indexes(db)
        seed_data_into_db(db)
        initialize_services_with_db(db)
        yield db
    else:
        mock_client = mongomock.MongoClient()
        db = mock_client["riskfire_test_db"]
        init_indexes(db)
        seed_data_into_db(db)
        initialize_services_with_db(db)
        monkeypatch.setattr("backend.app.main.is_mongo_connected", lambda: True)
        monkeypatch.setattr("backend.app.api.v1.routes.health.is_mongo_connected", lambda: True)
        monkeypatch.setattr("backend.app.database.mongo.get_database", lambda: db)
        yield db


@pytest.mark.anyio
async def test_health_check_database_connected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["service"] == "riskfire-backend"
        assert data["database"] == "connected"

        res_v1 = await client.get("/api/v1/health")
        assert res_v1.status_code == 200
        assert res_v1.json()["database"] == "connected"


@pytest.mark.anyio
async def test_dashboard_summary_from_mongo():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/dashboard/summary")
        assert res.status_code == 200
        data = res.json()
        assert "metrics" in data
        assert "riskTrend" in data
        assert "attackVectors" in data
        assert "policyEffectiveness" in data
        assert "topVulnerabilities" in data
        assert "recentSimulations" in data
        assert "activeIncidents" in data
        assert data["metrics"]["riskPostureScore"] is not None
        assert data["metrics"]["riskPostureScore"] >= 0



@pytest.mark.anyio
async def test_policy_crud_e2e_persistence(setup_mongo_test_env):
    transport = ASGITransport(app=app)
    db = setup_mongo_test_env
    policy_repo = MongoPolicyRepository(db)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create a new policy via API
        policy_payload = {
            "name": "E2E Automated Test Policy",
            "description": "Integration persistence testing",
            "category": "VELOCITY",
            "rules": [
                {
                    "name": "E2E Velocity Rule",
                    "rule_type": "VELOCITY_ACCOUNT",
                    "category": "VELOCITY",
                    "parameters": {"max_txns": 3, "window_minutes": 15},
                    "action": "BLOCK",
                    "is_enabled": True,
                    "sequence_order": 1,
                    "description": "Test rule",
                }
            ],
            "notes": "Created during E2E persistence test",
        }

        create_res = await client.post("/api/v1/policies", json=policy_payload)
        assert create_res.status_code == 201
        created_policy = create_res.json()
        policy_id = created_policy["id"]
        assert created_policy["name"] == "E2E Automated Test Policy"

        # 2. Verify directly in MongoDB
        doc_in_mongo = db.policies.find_one({"id": policy_id}, {"_id": 0})
        assert doc_in_mongo is not None
        assert doc_in_mongo["name"] == "E2E Automated Test Policy"

        # 3. Fetch via GET API
        get_res = await client.get(f"/api/v1/policies/{policy_id}")
        assert get_res.status_code == 200
        assert get_res.json()["id"] == policy_id

        # 4. Update policy via PUT API
        update_res = await client.put(
            f"/api/v1/policies/{policy_id}",
            json={"name": "E2E Updated Policy Name", "description": "Updated description"}
        )
        assert update_res.status_code == 200
        assert update_res.json()["name"] == "E2E Updated Policy Name"

        # 5. Verify update directly in MongoDB
        updated_doc = db.policies.find_one({"id": policy_id}, {"_id": 0})
        assert updated_doc["name"] == "E2E Updated Policy Name"

        # 6. Simulate server restart by creating a new repository instance
        fresh_repo = MongoPolicyRepository(db)
        persisted_policy = await fresh_repo.get_policy_by_id(policy_id)
        assert persisted_policy is not None
        assert persisted_policy.name == "E2E Updated Policy Name"

        # 7. Clean up
        db.policies.delete_one({"id": policy_id})


@pytest.mark.anyio
async def test_simulation_and_vulnerabilities_persistence(setup_mongo_test_env):
    transport = ASGITransport(app=app)
    db = setup_mongo_test_env

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Run a deterministic simulation
        sim_payload = {
            "policy_id": "pol-vel-01",
            "seed": 49201,
            "attack_types": ["VELOCITY_ATTACKER"],
            "difficulty": "HIGH",
            "legitimate_transaction_count": 50,
            "attack_transaction_count": 20,
            "sim_duration_hours": 1,
        }

        sim_res = await client.post("/api/v1/simulations", json=sim_payload)
        assert sim_res.status_code == 201
        sim_data = sim_res.json()
        sim_id = sim_data["id"]

        # Verify simulation saved in MongoDB
        sim_doc = db.simulations.find_one({"id": sim_id}, {"_id": 0})
        assert sim_doc is not None
        assert sim_doc["total_transactions"] == 70

        # Verify events saved in MongoDB
        events_res = await client.get(f"/api/v1/simulations/{sim_id}/events")
        assert events_res.status_code == 200
        events = events_res.json()
        assert len(events) >= 1

        # Verify audit log entry was created
        audit_doc = db.audit_logs.find_one({"entity_id": sim_id}, {"_id": 0})
        assert audit_doc is not None


@pytest.mark.anyio
async def test_patch_lifecycle_persistence(setup_mongo_test_env):
    transport = ASGITransport(app=app)
    db = setup_mongo_test_env

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Get existing patches
        patches_res = await client.get("/api/v1/patches")
        assert patches_res.status_code == 200
        patches = patches_res.json()
        assert len(patches) >= 1
        target_patch = patches[0]
        patch_id = target_patch["id"]

        # Simulate patch
        sim_res = await client.post(f"/api/v1/patches/{patch_id}/simulate")
        assert sim_res.status_code == 200
        assert sim_res.json()["status"] == "SIMULATED"

        # Verify status in MongoDB
        patch_doc = db.patches.find_one({"id": patch_id}, {"_id": 0})
        assert patch_doc["status"] == "SIMULATED"

        # Approve patch
        appr_res = await client.post(f"/api/v1/patches/{patch_id}/approve", json={"notes": "Approved in test"})
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "APPROVED"

        # Verify MongoDB updated
        updated_doc = db.patches.find_one({"id": patch_id}, {"_id": 0})
        assert updated_doc["status"] == "APPROVED"
        assert updated_doc["reviewed_by"] is not None


@pytest.mark.anyio
async def test_incident_lifecycle_persistence(setup_mongo_test_env):
    transport = ASGITransport(app=app)
    db = setup_mongo_test_env

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create incident
        inc_payload = {
            "title": "E2E Test Incident",
            "severity": "CRITICAL",
            "affected_policy_id": "pol-vel-01",
            "affected_policy_name": "Core Merchant Velocity & High-Value Guard",
            "summary": "Testing incident lifecycle in MongoDB",
            "owner": "Arjun Mehta",
            "simulated_exposure": 120000.0,
            "bypasses_count": 15,
        }

        create_res = await client.post("/api/v1/incidents", json=inc_payload)
        assert create_res.status_code == 201
        inc_id = create_res.json()["id"]

        # Update status
        upd_res = await client.put(f"/api/v1/incidents/{inc_id}", json={"status": "INVESTIGATING"})
        assert upd_res.status_code == 200
        assert upd_res.json()["status"] == "INVESTIGATING"

        # Verify timeline in MongoDB
        inc_doc = db.incidents.find_one({"id": inc_id}, {"_id": 0})
        assert inc_doc is not None
        assert inc_doc["status"] == "INVESTIGATING"
        assert len(inc_doc["timeline"]) >= 2

        # Clean up
        db.incidents.delete_one({"id": inc_id})

