from fastapi import APIRouter
from backend.app.api.v1.routes import (
    health,
    dashboard,
    policies,
    simulations,
    attacks,
    vulnerabilities,
    patches,
    benchmarks,
    graph,
    incidents,
    datasets,
    audit,
    reports,
)

api_v1_router = APIRouter()

api_v1_router.include_router(health.router)
api_v1_router.include_router(dashboard.router)
api_v1_router.include_router(policies.router)
api_v1_router.include_router(simulations.router)
api_v1_router.include_router(attacks.router)
api_v1_router.include_router(vulnerabilities.router)
api_v1_router.include_router(patches.router)
api_v1_router.include_router(benchmarks.router)
api_v1_router.include_router(graph.router)
api_v1_router.include_router(incidents.router)
api_v1_router.include_router(datasets.router)
api_v1_router.include_router(audit.router)
api_v1_router.include_router(reports.router)
