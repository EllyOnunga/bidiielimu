# GilaniOS Development Makefile

.PHONY: help install clean test test-backend-docker test-backend-local lint format docker-build docker-up docker-down migrate collectstatic

# Default target
help:
	@echo "Available commands:"
	@echo "  install       Install all dependencies"
	@echo "  clean         Clean up cache files and dependencies"
	@echo "  test          Run all tests"
	@echo "  lint          Run linting and formatting checks"
	@echo "  format        Format code"
	@echo "  build         Build Docker images"
	@echo "  up            Start all services with Docker Compose"
	@echo "  down          Stop all services"
	@echo "  migrate       Run database migrations"
	@echo "  collectstatic Collect static files"
	@echo "  setup         Initial project setup"

# Installation
install:
	cd backend && pip install -r requirements.txt black isort flake8
	cd frontend && npm install

# Cleanup
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name node_modules -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.pyd" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +

# Testing
test:
	@if docker compose ps --services --filter status=running 2>/dev/null | grep -qx backend; then \
		$(MAKE) test-backend-docker; \
	else \
		$(MAKE) test-backend-local; \
	fi
	cd frontend && npm run type-check

test-backend-docker:
	docker compose exec -T db sh -lc 'dropdb --if-exists --force -U "$${DB_USER:-gilanios_admin}" "test_$${DB_NAME:-gilanios}"'
	docker compose exec -T backend sh -lc 'export DATABASE_URL="postgres://$${DB_USER:-gilanios_admin}:$${DB_PASSWORD:-gilanios_pass}@db:5432/$${DB_NAME:-gilanios}"; export DATABASE_READ_URL="$$DATABASE_URL"; python manage.py test --noinput'

test-backend-local:
	cd backend && DATABASE_URL="$${DATABASE_URL:-postgres://gilanios_admin:gilanios_pass@localhost:5432/gilanios}" DATABASE_READ_URL="$${DATABASE_READ_URL:-postgres://gilanios_admin:gilanios_pass@localhost:5432/gilanios}" python manage.py test --noinput

# Linting and formatting
lint:
	cd backend && flake8 . && black --check . && isort --check-only --profile black .
	cd frontend && npm run lint

format:
	cd backend && black . && isort --profile black .
	cd frontend && npm run format

# Docker commands
build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

# Django commands
migrate:
	docker compose exec -T backend python manage.py migrate_schemas --noinput || (cd backend && python manage.py migrate_schemas --noinput)

collectstatic:
	cd backend && python manage.py collectstatic --noinput

# Initial setup
setup: install migrate collectstatic
	cd backend && python manage.py createsuperuser --noinput || true
	cd frontend && npm run build
