# RiskFire — Developer Makefile
# Usage: make <target>

.PHONY: help setup dev-backend dev-frontend dev docs-check

# Default target
help:
	@echo ""
	@echo "RiskFire Developer Commands"
	@echo "==========================="
	@echo ""
	@echo "  make setup          - First-time setup (copy .env, install deps)"
	@echo "  make dev            - Start full stack with Docker Compose"
	@echo "  make dev-backend    - Start backend only (requires local Python venv)"
	@echo "  make dev-frontend   - Start frontend only"
	@echo "  make db-migrate     - Run Alembic migrations"
	@echo "  make db-seed        - Seed development data"
	@echo "  make test           - Run all tests"
	@echo "  make test-backend   - Run backend tests only"
	@echo "  make benchmark      - Run benchmark against latest simulation"
	@echo "  make docs-check     - Verify documentation files are present"
	@echo "  make clean          - Stop and remove Docker containers"
	@echo ""

# First-time setup
setup:
	@echo "Setting up RiskFire..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env from .env.example -- fill in your secrets"; fi
	@echo "Done. Edit .env and then run: make dev"

# Full stack via Docker
dev:
	docker-compose up

# Backend only (local Python)
dev-backend:
	@cd backend && \
	  python -m venv .venv && \
	  . .venv/bin/activate && \
	  pip install -r requirements.txt && \
	  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend only
dev-frontend:
	@cd frontend && npm install && npm run dev

# Run Alembic migrations
db-migrate:
	@cd backend && . .venv/bin/activate && alembic upgrade head

# Seed development data
db-seed:
	@cd backend && . .venv/bin/activate && python -m scripts.seed_database

# Run all tests
test: test-backend

# Run backend tests
test-backend:
	@cd backend && . .venv/bin/activate && pytest tests/ -v

# Run benchmark
benchmark:
	@cd backend && . .venv/bin/activate && python scripts/run_benchmark.py

# Verify all required documentation files exist
docs-check:
	@echo "Checking documentation files..."
	@test -f docs/product/riskfire-product-spec.md && echo "OK: product-spec" || echo "MISSING: product-spec"
	@test -f docs/product/riskfire-user-flows.md && echo "OK: user-flows" || echo "MISSING: user-flows"
	@test -f docs/architecture/riskfire-system-architecture.md && echo "OK: system-architecture" || echo "MISSING: system-architecture"
	@test -f docs/architecture/riskfire-ai-architecture.md && echo "OK: ai-architecture" || echo "MISSING: ai-architecture"
	@test -f docs/architecture/riskfire-simulation-architecture.md && echo "OK: simulation-architecture" || echo "MISSING: simulation-architecture"
	@test -f docs/architecture/riskfire-data-model.md && echo "OK: data-model" || echo "MISSING: data-model"
	@test -f docs/architecture/riskfire-benchmarking.md && echo "OK: benchmarking" || echo "MISSING: benchmarking"
	@test -f docs/architecture/riskfire-security.md && echo "OK: security" || echo "MISSING: security"
	@echo "Documentation check complete."

# Stop and remove containers
clean:
	docker-compose down
