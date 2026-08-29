import time
import threading
from collections import deque
from typing import Dict, Tuple, Optional, Set
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from backend.app.core.config import settings
from backend.app.core.logging import logger


class InMemoryRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter.
    Tracks request timestamps using monotonic clocks with lazy cleanup.
    """

    def __init__(self):
        self._records: Dict[str, deque] = {}
        self._lock = threading.Lock()
        self._last_cleanup = time.monotonic()

    def is_rate_limited(
        self,
        key: str,
        limit: int,
        window_seconds: int
    ) -> Tuple[bool, int, int, int]:
        """
        Evaluates whether a key has exceeded the request limit within the sliding window.

        Returns:
            Tuple of (is_limited, current_count, remaining_quota, retry_after_seconds)
        """
        now = time.monotonic()

        with self._lock:
            # Periodic cleanup of expired records every 60s
            if now - self._last_cleanup > 60.0:
                self._cleanup_expired(now, max_window=300.0)
                self._last_cleanup = now

            if key not in self._records:
                self._records[key] = deque()

            window_queue = self._records[key]
            cutoff = now - float(window_seconds)

            # Evict timestamps older than the sliding window
            while window_queue and window_queue[0] <= cutoff:
                window_queue.popleft()

            current_count = len(window_queue)

            if current_count >= limit:
                oldest_timestamp = window_queue[0]
                retry_after = max(1, int(oldest_timestamp + window_seconds - now))
                return True, current_count, 0, retry_after

            # Record this request
            window_queue.append(now)
            remaining = max(0, limit - len(window_queue))
            reset_seconds = max(1, int(window_queue[0] + window_seconds - now))

            return False, len(window_queue), remaining, reset_seconds

    def reset(self) -> None:
        """Clears all tracking history (primarily for test isolation)."""
        with self._lock:
            self._records.clear()
            self._last_cleanup = time.monotonic()

    def _cleanup_expired(self, now: float, max_window: float = 300.0) -> None:
        """Removes dormant keys to prevent memory leaks over time."""
        cutoff = now - max_window
        stale_keys = []
        for k, q in self._records.items():
            while q and q[0] <= cutoff:
                q.popleft()
            if not q:
                stale_keys.append(k)
        for k in stale_keys:
            del self._records[k]


# Global rate limiter instance
limiter = InMemoryRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Production-grade rate limiting middleware for FastAPI.
    Enforces sliding-window request quotas with tiered limits for standard
    and compute-heavy endpoints while guaranteeing zero disruption to internal
    simulations, health probes, and legitimate browser interactions.
    """

    EXEMPT_PATHS: Set[str] = {
        "/health",
        "/health/",
        f"{settings.API_V1_STR}/health",
        f"{settings.API_V1_STR}/health/",
        "/docs",
        "/redoc",
        "/openapi.json",
    }

    HEAVY_ROUTE_PREFIXES = (
        f"{settings.API_V1_STR}/simulations/fire-drill",
        f"{settings.API_V1_STR}/simulations/run",
        f"{settings.API_V1_STR}/benchmarks/compare-policies",
        f"{settings.API_V1_STR}/benchmarks/run",
        f"{settings.API_V1_STR}/attacks/plan",
        f"{settings.API_V1_STR}/patches/generate",
        f"{settings.API_V1_STR}/reports/generate",
    )

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Always exempt CORS preflight requests
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        # Exempt health and system metadata endpoints
        if path in self.EXEMPT_PATHS:
            return await call_next(request)

        # Determine limit tier based on path and method
        is_heavy = False
        if request.method == "POST":
            for prefix in self.HEAVY_ROUTE_PREFIXES:
                if path.startswith(prefix):
                    is_heavy = True
                    break
            # Also catch POST /simulations and POST /vulnerabilities/*/explain
            if path == f"{settings.API_V1_STR}/simulations" or "/explain" in path:
                is_heavy = True

        limit = settings.RATE_LIMIT_HEAVY_PER_MINUTE if is_heavy else settings.RATE_LIMIT_DEFAULT_PER_MINUTE
        window = settings.RATE_LIMIT_WINDOW_SECONDS

        # Extract client identifier
        client_key = self._get_client_key(request, tier="heavy" if is_heavy else "default")

        is_limited, count, remaining, reset_seconds = limiter.is_rate_limited(
            key=client_key,
            limit=limit,
            window_seconds=window
        )

        if is_limited:
            logger.warning(
                f"[RateLimiter] Rate limit exceeded for '{client_key}' on {request.method} {path} "
                f"(limit={limit}/{window}s, retry_after={reset_seconds}s)"
            )
            return JSONResponse(
                status_code=429,
                headers={
                    "Retry-After": str(reset_seconds),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_seconds),
                },
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit of {limit} requests per {window} seconds exceeded. Please retry after {reset_seconds} seconds.",
                        "details": {
                            "retry_after_seconds": reset_seconds,
                            "limit": limit,
                            "window_seconds": window,
                            "tier": "compute_heavy" if is_heavy else "standard"
                        }
                    }
                }
            )

        # Process the request
        response = await call_next(request)

        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_seconds)

        return response

    def _get_client_key(self, request: Request, tier: str) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        elif request.client and request.client.host:
            client_ip = request.client.host
        else:
            client_ip = "127.0.0.1"

        merchant_id = request.headers.get("x-merchant-id") or "anon"
        return f"{tier}:{client_ip}:{merchant_id}"
