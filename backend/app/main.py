from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.database.mongo import init_mongo, close_mongo, is_mongo_connected
from backend.app.core.exceptions import (
    RiskFireException,
    ResourceNotFoundError,
    PolicyValidationError,
    SimulationExecutionError,
    BenchmarkIntegrityError,
    InvalidAIOutputError,
    AIProviderUnavailableError,
    AIProviderTimeoutError,
    ConfigurationError,
    ConflictError,
)
from backend.app.api.v1.router import api_v1_router
from backend.app.schemas.common import APIErrorResponse, ErrorDetail


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing RiskFire Risk Intelligence Platform Backend (Phase 4)...")
    logger.info(f"Environment: {settings.APP_ENV} | AI Provider: {settings.AI_PROVIDER} ({settings.GROQ_MODEL})")
    
    # Initialize MongoDB persistence layer if connected, otherwise fallback to in-memory mode
    if is_mongo_connected():
        try:
            init_mongo()
            logger.info("Persistent MongoDB repositories initialized and ready.")
        except Exception as e:
            logger.warning(f"MongoDB initialization warning: {e}. Running in in-memory mode.")
    else:
        logger.info("Running in in-memory repository mode (MongoDB offline or test environment).")

    yield

    logger.info("Shutting down RiskFire Backend...")
    close_mongo()


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "RiskFire — Automated Red-Team Simulation, Policy Vulnerability Discovery, "
        "and Mathematical Held-Out Generalization Verification for Merchant Risk Controls."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(ResourceNotFoundError)
async def resource_not_found_handler(request: Request, exc: ResourceNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(PolicyValidationError)
async def policy_validation_handler(request: Request, exc: PolicyValidationError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(BenchmarkIntegrityError)
async def benchmark_integrity_handler(request: Request, exc: BenchmarkIntegrityError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(InvalidAIOutputError)
async def invalid_ai_output_handler(request: Request, exc: InvalidAIOutputError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(AIProviderUnavailableError)
async def ai_provider_unavailable_handler(request: Request, exc: AIProviderUnavailableError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(AIProviderTimeoutError)
async def ai_provider_timeout_handler(request: Request, exc: AIProviderTimeoutError):
    return JSONResponse(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(ConfigurationError)
async def configuration_error_handler(request: Request, exc: ConfigurationError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(SimulationExecutionError)
async def simulation_execution_handler(request: Request, exc: SimulationExecutionError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(RiskFireException)
async def generic_riskfire_handler(request: Request, exc: RiskFireException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": {"code": exc.code, "message": exc.message, "details": exc.details}}
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected server error occurred."}}
    )


# Top-level Health Check
@app.get("/health", tags=["System"])
async def root_health():
    db_connected = is_mongo_connected()
    return {
        "status": "ok" if db_connected else "degraded",
        "service": "riskfire-backend",
        "version": "0.1.0",
        "environment": settings.APP_ENV,
        "database": "connected" if db_connected else "disconnected"
    }


# Register API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)
