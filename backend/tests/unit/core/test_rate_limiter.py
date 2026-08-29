import time
import threading
import pytest
from fastapi.testclient import TestClient

from backend.app.core.config import settings
from backend.app.core.rate_limit import InMemoryRateLimiter, limiter
from backend.app.main import app


@pytest.fixture(autouse=True)
def reset_limiter_fixture():
    """Ensure limiter history is clean before each test."""
    limiter.reset()
    yield
    limiter.reset()


def test_in_memory_rate_limiter_basic():
    """Test sliding window tracking and threshold enforcement."""
    test_limiter = InMemoryRateLimiter()
    key = "test_client_1"
    limit = 3
    window = 2

    # First 3 requests should pass
    for i in range(limit):
        is_limited, count, remaining, reset_sec = test_limiter.is_rate_limited(key, limit, window)
        assert not is_limited
        assert count == i + 1
        assert remaining == limit - (i + 1)
        assert reset_sec >= 1

    # 4th request should be blocked
    is_limited, count, remaining, retry_after = test_limiter.is_rate_limited(key, limit, window)
    assert is_limited
    assert count == 3
    assert remaining == 0
    assert retry_after >= 1


def test_in_memory_rate_limiter_window_expiry():
    """Test that timestamps expire after the window passes."""
    test_limiter = InMemoryRateLimiter()
    key = "test_client_expiry"
    limit = 2
    window = 1  # 1 second window

    for _ in range(limit):
        is_limited, _, _, _ = test_limiter.is_rate_limited(key, limit, window)
        assert not is_limited

    # Should be limited immediately
    is_limited, _, _, _ = test_limiter.is_rate_limited(key, limit, window)
    assert is_limited

    # Wait for window to expire
    time.sleep(1.1)

    # Should now be allowed again
    is_limited, count, remaining, _ = test_limiter.is_rate_limited(key, limit, window)
    assert not is_limited
    assert count == 1
    assert remaining == limit - 1


def test_in_memory_rate_limiter_concurrency():
    """Test thread-safety under concurrent load."""
    test_limiter = InMemoryRateLimiter()
    key = "concurrent_client"
    limit = 50
    window = 10

    results = []

    def make_request():
        res = test_limiter.is_rate_limited(key, limit, window)
        results.append(res[0])  # store is_limited

    threads = [threading.Thread(target=make_request) for _ in range(70)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(results) == 70
    allowed = results.count(False)
    blocked = results.count(True)

    assert allowed == limit
    assert blocked == 20


def test_api_rate_limit_headers_on_success():
    """Test that API responses include rate limit headers."""
    client = TestClient(app)
    response = client.get("/api/v1/policies")
    assert response.status_code == 200
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers
    assert int(response.headers["X-RateLimit-Limit"]) == settings.RATE_LIMIT_DEFAULT_PER_MINUTE


def test_api_rate_limit_exempt_paths():
    """Test that health checks and docs are exempt from rate limiting."""
    client = TestClient(app)
    for _ in range(10):
        res = client.get("/health")
        assert res.status_code == 200
        # Exempt paths should not increment rate limiter
        res_v1 = client.get("/api/v1/health")
        assert res_v1.status_code == 200


def test_api_rate_limit_exceeded_429():
    """Test that flooding an endpoint triggers 429 Too Many Requests."""
    client = TestClient(app)
    # Temporarily set a low limit for deterministic test
    original_limit = settings.RATE_LIMIT_DEFAULT_PER_MINUTE
    settings.RATE_LIMIT_DEFAULT_PER_MINUTE = 5
    try:
        # 5 allowed requests
        for i in range(5):
            res = client.get("/api/v1/policies", headers={"X-Merchant-ID": "m-rate-test"})
            assert res.status_code == 200

        # 6th request should hit 429
        res_429 = client.get("/api/v1/policies", headers={"X-Merchant-ID": "m-rate-test"})
        assert res_429.status_code == 429
        assert "Retry-After" in res_429.headers
        assert res_429.headers["X-RateLimit-Remaining"] == "0"

        body = res_429.json()
        assert body["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert "retry_after_seconds" in body["error"]["details"]
        assert body["error"]["details"]["limit"] == 5
    finally:
        settings.RATE_LIMIT_DEFAULT_PER_MINUTE = original_limit


def test_compute_heavy_route_tier():
    """Test that compute-heavy routes use the heavy rate limit tier."""
    client = TestClient(app)
    original_heavy = settings.RATE_LIMIT_HEAVY_PER_MINUTE
    settings.RATE_LIMIT_HEAVY_PER_MINUTE = 3
    try:
        # POST /api/v1/simulations/fire-drill is heavy
        for i in range(3):
            res = client.post(
                "/api/v1/simulations/fire-drill",
                json={"policy_id": "pol-vel-01", "seed": 49201, "difficulty": "LOW"},
                headers={"X-Merchant-ID": "m-heavy-test"}
            )
            assert res.status_code == 201
            assert int(res.headers["X-RateLimit-Limit"]) == 3

        # 4th heavy request should be blocked
        res_blocked = client.post(
            "/api/v1/simulations/fire-drill",
            json={"policy_id": "pol-vel-01", "seed": 49201, "difficulty": "LOW"},
            headers={"X-Merchant-ID": "m-heavy-test"}
        )
        assert res_blocked.status_code == 429
        assert res_blocked.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert res_blocked.json()["error"]["details"]["tier"] == "compute_heavy"
    finally:
        settings.RATE_LIMIT_HEAVY_PER_MINUTE = original_heavy
