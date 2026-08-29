from mongomock import Database
from typing import Generator
from fastapi import Depends
from backend.app.core.config import settings
from backend.app.core.security import get_current_user, UserContext
from backend.app.database.mongo import get_database

# Mongo Repository Implementations
from backend.app.database.repositories.mongo import (
    MongoPolicyRepository,
    MongoSimulationRepository,
    MongoAttackRepository,
    MongoVulnerabilityRepository,
    MongoPatchRepository,
    MongoBenchmarkRepository,
    MongoDatasetRepository,
    MongoIncidentRepository,
    MongoAuditRepository,
    MongoReportRepository,
)

# AI Provider Factory (Phase 4 Real Groq Integration with Mock test mode)
from backend.app.ai.factory import get_ai_provider as resolve_ai_provider

# Services
from backend.app.services.audit_service import AuditService
from backend.app.services.policy_service import PolicyService
from backend.app.services.attack_service import AttackService
from backend.app.services.vulnerability_service import VulnerabilityService
from backend.app.services.simulation_service import SimulationService
from backend.app.services.patch_service import PatchService
from backend.app.services.benchmark_service import BenchmarkService
from backend.app.services.dataset_service import DatasetService
from backend.app.services.incident_service import IncidentService
from backend.app.services.report_service import ReportService
from backend.app.services.graph_service import GraphService
from backend.app.services.dashboard_service import DashboardService

# Persistence Layer Initialization
from backend.app.core.logging import logger
from backend.app.database.mongo import is_mongo_connected

require_mongo = settings.PERSISTENCE_MODE == "mongo"
require_prod_mongo = settings.APP_ENV == "production"
explicit_memory = settings.PERSISTENCE_MODE == "memory" or (settings.APP_ENV == "test" and settings.PERSISTENCE_MODE != "mongo")

if require_mongo:
    if not is_mongo_connected():
        logger.critical("PERSISTENCE_MODE=mongo configured, but MongoDB is unreachable. Failing fast.")
        raise RuntimeError("PERSISTENCE_MODE=mongo requires a reachable MongoDB instance. Unreachable cluster at MONGODB_URI.")
    use_mongo = True
elif explicit_memory:
    logger.info("Explicit test/memory mode: Initializing InMemory repositories.")
    use_mongo = False
elif require_prod_mongo:
    if not is_mongo_connected():
        logger.critical("Production mode configured, but MongoDB is unreachable. Failing fast.")
        raise RuntimeError("Production runtime requires MongoDB. Unreachable cluster at MONGODB_URI.")
    use_mongo = True
else:
    # "auto" development mode
    use_mongo = is_mongo_connected()
    if not use_mongo:
        logger.warning("DEVELOPMENT MODE: MongoDB is offline/unreachable. Initializing InMemory repositories for local dev.")


if use_mongo:
    try:
        _db = get_database()
        _policy_repo = MongoPolicyRepository(_db)
        _simulation_repo = MongoSimulationRepository(_db)
        _attack_repo = MongoAttackRepository(_db)
        _vulnerability_repo = MongoVulnerabilityRepository(_db)
        _patch_repo = MongoPatchRepository(_db)
        _benchmark_repo = MongoBenchmarkRepository(_db)
        _dataset_repo = MongoDatasetRepository(_db)
        _incident_repo = MongoIncidentRepository(_db)
        _audit_repo = MongoAuditRepository(_db)
        _report_repo = MongoReportRepository(_db)
        logger.info("MongoDB repositories initialized successfully.")
    except Exception as e:
        if require_mongo:
            logger.critical(f"Failed to initialize MongoDB repositories in production mode: {e}")
            raise
        logger.warning(f"Failed to connect to MongoDB, falling back to InMemory repositories for dev: {e}")
        from backend.app.database.repositories.memory.memory_policy_repo import InMemoryPolicyRepository
        from backend.app.database.repositories.memory.memory_simulation_repo import InMemorySimulationRepository
        from backend.app.database.repositories.memory.memory_attack_repo import InMemoryAttackRepository
        from backend.app.database.repositories.memory.memory_vulnerability_repo import InMemoryVulnerabilityRepository
        from backend.app.database.repositories.memory.memory_patch_repo import InMemoryPatchRepository
        from backend.app.database.repositories.memory.memory_benchmark_repo import InMemoryBenchmarkRepository
        from backend.app.database.repositories.memory.memory_dataset_repo import InMemoryDatasetRepository
        from backend.app.database.repositories.memory.memory_incident_repo import InMemoryIncidentRepository
        from backend.app.database.repositories.memory.memory_audit_repo import InMemoryAuditRepository
        from backend.app.database.repositories.memory.memory_report_repo import InMemoryReportRepository

        _policy_repo = InMemoryPolicyRepository()
        _simulation_repo = InMemorySimulationRepository()
        _attack_repo = InMemoryAttackRepository()
        _vulnerability_repo = InMemoryVulnerabilityRepository()
        _patch_repo = InMemoryPatchRepository()
        _benchmark_repo = InMemoryBenchmarkRepository()
        _dataset_repo = InMemoryDatasetRepository()
        _incident_repo = InMemoryIncidentRepository()
        _audit_repo = InMemoryAuditRepository()
        _report_repo = InMemoryReportRepository()
else:
    from backend.app.database.repositories.memory.memory_policy_repo import InMemoryPolicyRepository
    from backend.app.database.repositories.memory.memory_simulation_repo import InMemorySimulationRepository
    from backend.app.database.repositories.memory.memory_attack_repo import InMemoryAttackRepository
    from backend.app.database.repositories.memory.memory_vulnerability_repo import InMemoryVulnerabilityRepository
    from backend.app.database.repositories.memory.memory_patch_repo import InMemoryPatchRepository
    from backend.app.database.repositories.memory.memory_benchmark_repo import InMemoryBenchmarkRepository
    from backend.app.database.repositories.memory.memory_dataset_repo import InMemoryDatasetRepository
    from backend.app.database.repositories.memory.memory_incident_repo import InMemoryIncidentRepository
    from backend.app.database.repositories.memory.memory_audit_repo import InMemoryAuditRepository
    from backend.app.database.repositories.memory.memory_report_repo import InMemoryReportRepository

    _policy_repo = InMemoryPolicyRepository()
    _simulation_repo = InMemorySimulationRepository()
    _attack_repo = InMemoryAttackRepository()
    _vulnerability_repo = InMemoryVulnerabilityRepository()
    _patch_repo = InMemoryPatchRepository()
    _benchmark_repo = InMemoryBenchmarkRepository()
    _dataset_repo = InMemoryDatasetRepository()
    _incident_repo = InMemoryIncidentRepository()
    _audit_repo = InMemoryAuditRepository()
    _report_repo = InMemoryReportRepository()

_ai_provider = resolve_ai_provider()

# Wire Service Layer with Repositories and AI Provider
_audit_service = AuditService(_audit_repo)
_policy_service = PolicyService(_policy_repo, _audit_service)
_attack_service = AttackService(_attack_repo, _audit_service, _ai_provider)
_vulnerability_service = VulnerabilityService(_vulnerability_repo, _audit_service, _ai_provider)
_simulation_service = SimulationService(_simulation_repo, _policy_repo, _vulnerability_repo, _audit_service)
_patch_service = PatchService(_patch_repo, _vulnerability_repo, _policy_repo, _audit_service, _ai_provider, _benchmark_repo)
_benchmark_service = BenchmarkService(_benchmark_repo, _audit_service, _policy_repo)
_dataset_service = DatasetService(_dataset_repo)
_incident_service = IncidentService(_incident_repo, _audit_service)
_report_service = ReportService(_report_repo, _simulation_repo, _vulnerability_repo, _audit_service, _ai_provider)
_graph_service = GraphService(_simulation_service)
_dashboard_service = DashboardService(_policy_repo, _simulation_repo, _vulnerability_repo, _incident_repo)



def initialize_services_with_db(db: Database) -> None:
    """
    Explicitly re-initializes all repository and service singletons with a specified MongoDB Database.
    Used for testing and deterministic Mongo validation.
    """
    global _policy_repo, _simulation_repo, _attack_repo, _vulnerability_repo, _patch_repo
    global _benchmark_repo, _dataset_repo, _incident_repo, _audit_repo, _report_repo
    global _audit_service, _policy_service, _attack_service, _vulnerability_service, _simulation_service
    global _patch_service, _benchmark_service, _dataset_service, _incident_service, _report_service, _graph_service, _dashboard_service

    _policy_repo = MongoPolicyRepository(db)
    _simulation_repo = MongoSimulationRepository(db)
    _attack_repo = MongoAttackRepository(db)
    _vulnerability_repo = MongoVulnerabilityRepository(db)
    _patch_repo = MongoPatchRepository(db)
    _benchmark_repo = MongoBenchmarkRepository(db)
    _dataset_repo = MongoDatasetRepository(db)
    _incident_repo = MongoIncidentRepository(db)
    _audit_repo = MongoAuditRepository(db)
    _report_repo = MongoReportRepository(db)

    _audit_service = AuditService(_audit_repo)
    _policy_service = PolicyService(_policy_repo, _audit_service)
    _attack_service = AttackService(_attack_repo, _audit_service, _ai_provider)
    _vulnerability_service = VulnerabilityService(_vulnerability_repo, _audit_service, _ai_provider)
    _simulation_service = SimulationService(_simulation_repo, _policy_repo, _vulnerability_repo, _audit_service)
    _patch_service = PatchService(_patch_repo, _vulnerability_repo, _policy_repo, _audit_service, _ai_provider, _benchmark_repo)
    _benchmark_service = BenchmarkService(_benchmark_repo, _audit_service, _policy_repo)
    _dataset_service = DatasetService(_dataset_repo)
    _incident_service = IncidentService(_incident_repo, _audit_service)
    _report_service = ReportService(_report_repo, _simulation_repo, _vulnerability_repo, _audit_service, _ai_provider)
    _graph_service = GraphService(_simulation_service)
    _dashboard_service = DashboardService(_policy_repo, _simulation_repo, _vulnerability_repo, _incident_repo)


def get_policy_service() -> PolicyService:
    return _policy_service


def get_simulation_service() -> SimulationService:
    return _simulation_service


def get_attack_service() -> AttackService:
    return _attack_service


def get_vulnerability_service() -> VulnerabilityService:
    return _vulnerability_service


def get_patch_service() -> PatchService:
    return _patch_service


def get_benchmark_service() -> BenchmarkService:
    return _benchmark_service


def get_dataset_service() -> DatasetService:
    return _dataset_service


def get_incident_service() -> IncidentService:
    return _incident_service


def get_audit_service() -> AuditService:
    return _audit_service


def get_report_service() -> ReportService:
    return _report_service


def get_graph_service() -> GraphService:
    return _graph_service


def get_dashboard_service() -> DashboardService:
    return _dashboard_service

