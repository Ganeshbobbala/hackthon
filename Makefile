.PHONY: help install dev dev-backend dev-frontend test test-backend test-frontend build docker-up docker-down

help:
	@echo "FARE RADAR PRO - Build & Execution Targets"
	@echo "------------------------------------------"
	@echo "make install       Install backend and frontend dependencies"
	@echo "make dev           Run backend (:8000) and frontend (:5173) concurrently"
	@echo "make test          Run full test suite (pytest + vitest)"
	@echo "make build         Build frontend production bundle"
	@echo "make docker-up     Launch with Docker Compose"

install:
	pip install -r backend/requirements.txt
	cd frontend && npm install

dev:
	@echo "Starting Fare Radar Pro Full Stack..."
	python -m uvicorn app.main:app --app-dir backend --reload --port 8000 & cd frontend && npm run dev

test: test-backend test-frontend

test-backend:
	set PYTHONPATH=backend&& python -m pytest backend/tests -v

test-frontend:
	cd frontend && npm run test

build:
	cd frontend && npm run build

docker-up:
	docker-compose up --build

docker-down:
	docker-compose down
