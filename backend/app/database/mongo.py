import time
from typing import Optional
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from backend.app.core.config import settings
from backend.app.core.logging import logger

_client: Optional[MongoClient] = None


import certifi

def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        if not settings.MONGODB_URI:
            raise RuntimeError(
                "MONGODB_URI is not configured in backend/.env. "
                "RiskFire Phase 3 requires a valid MongoDB connection string."
            )
        try:
            _client = MongoClient(
                settings.MONGODB_URI,
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=8000,
                connectTimeoutMS=8000,
                socketTimeoutMS=15000,
                retryWrites=True,
                appName="RiskFire-Backend"
            )
        except Exception:
            _client = MongoClient(
                settings.MONGODB_URI,
                tlsCAFile=certifi.where(),
                tlsAllowInvalidCertificates=True,
                serverSelectionTimeoutMS=8000,
                connectTimeoutMS=8000,
                socketTimeoutMS=15000,
                retryWrites=True,
                appName="RiskFire-Backend"
            )
    return _client


def get_database() -> Database:
    client = get_mongo_client()
    return client[settings.MONGODB_DB_NAME]


def init_indexes(db: Database) -> None:
    """
    Creates indexes tailored to actual API query and filter access patterns.
    """
    try:
        # Policies
        db.policies.create_index([("id", ASCENDING)], unique=True)
        db.policies.create_index([("merchant_id", ASCENDING)])
        db.policies.create_index([("is_active", ASCENDING)])

        # Simulations
        db.simulations.create_index([("id", ASCENDING)], unique=True)
        db.simulations.create_index([("merchant_id", ASCENDING), ("started_at", DESCENDING)])
        db.simulations.create_index([("status", ASCENDING)])

        # Simulation Events
        db.simulation_events.create_index([("simulation_id", ASCENDING), ("sequence_num", ASCENDING)])

        # Vulnerabilities
        db.vulnerabilities.create_index([("id", ASCENDING)], unique=True)
        db.vulnerabilities.create_index([("simulation_id", ASCENDING)])
        db.vulnerabilities.create_index([("status", ASCENDING)])
        db.vulnerabilities.create_index([("severity", ASCENDING)])

        # Patches
        db.patches.create_index([("id", ASCENDING)], unique=True)
        db.patches.create_index([("vulnerability_id", ASCENDING)])
        db.patches.create_index([("status", ASCENDING)])

        # Benchmarks
        db.benchmarks.create_index([("id", ASCENDING)], unique=True)
        db.benchmarks.create_index([("dataset_split", ASCENDING)])
        db.benchmark_comparisons.create_index([("id", ASCENDING)], unique=True)
        db.benchmark_comparisons.create_index([("dataset_split", ASCENDING)])

        # Datasets
        db.datasets.create_index([("id", ASCENDING)], unique=True)

        # Incidents
        db.incidents.create_index([("id", ASCENDING)], unique=True)
        db.incidents.create_index([("status", ASCENDING)])
        db.incidents.create_index([("severity", ASCENDING)])

        # Audit Logs
        db.audit_logs.create_index([("id", ASCENDING)], unique=True)
        db.audit_logs.create_index([("timestamp", DESCENDING)])

        # Reports
        db.reports.create_index([("id", ASCENDING)], unique=True)

        # Attack Agents & Scenarios
        db.attack_agents.create_index([("id", ASCENDING)], unique=True)
        db.attack_agents.create_index([("type", ASCENDING)], unique=True)
        db.attack_scenarios.create_index([("id", ASCENDING)], unique=True)
        db.attack_scenarios.create_index([("simulation_id", ASCENDING)])

        logger.info("MongoDB domain collection indexes verified successfully.")
    except Exception as e:
        logger.error(f"Error creating MongoDB indexes: {e}", exc_info=True)
        raise


def init_mongo(max_retries: int = 3, delay_seconds: float = 1.0) -> Database:
    """
    Initializes MongoDB client, verifies connection with a ping, and initializes indexes.
    Fails fast with clear error if connection cannot be established after retries.
    """
    global _client
    logger.info("Connecting to MongoDB persistence layer...")
    
    last_error: Optional[Exception] = None
    for attempt in range(1, max_retries + 1):
        try:
            client = get_mongo_client()
            client.admin.command("ping")
            logger.info(f"MongoDB connected successfully to database: '{settings.MONGODB_DB_NAME}'")
            db = client[settings.MONGODB_DB_NAME]
            init_indexes(db)
            return db
        except Exception as exc:
            last_error = exc
            logger.warning(
                f"MongoDB connection attempt {attempt}/{max_retries} encountered: {exc}. Retrying..."
            )
            # Reset client to force fresh connection pool if needed
            _client = None
            if attempt < max_retries:
                time.sleep(delay_seconds * attempt)

    logger.critical(f"MongoDB connection failed after {max_retries} attempts: {last_error}", exc_info=True)
    raise RuntimeError(
        f"Failed to connect to MongoDB after {max_retries} attempts. "
        f"Ensure MONGODB_URI is valid and cluster is reachable. Error: {last_error}"
    ) from last_error


def is_mongo_connected() -> bool:
    """
    Lightweight health check probe for MongoDB connectivity with fast 1s timeout.
    """
    global _client
    if not settings.MONGODB_URI:
        return False
    try:
        test_client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=1000,
            connectTimeoutMS=1000,
            socketTimeoutMS=2000,
            tlsAllowInvalidCertificates=True
        )
        test_client.admin.command("ping")
        return True
    except Exception:
        return False


def close_mongo() -> None:
    global _client
    if _client is not None:
        logger.info("Closing MongoDB connection client...")
        _client.close()
        _client = None

