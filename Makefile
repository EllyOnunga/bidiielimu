# GilaniOS Development Makefile

.PHONY: help install clean test test-backend-docker test-backend-local lint format docker-build docker-up docker-down migrate collectstatic bump-version release-patch release-minor release-major

# Default target
help:
	@echo "Available commands:"
	@echo "  install          Install all dependencies"
	@echo "  clean            Clean up cache files and dependencies"
	@echo "  test             Run all tests"
	@echo "  lint             Run linting and formatting checks"
	@echo "  format           Format code"
	@echo "  build            Build Docker images"
	@echo "  up               Start all services with Docker Compose"
	@echo "  down             Stop all services"
	@echo "  migrate          Run database migrations"
	@echo "  collectstatic    Collect static files"
	@echo "  setup            Initial project setup"
	@echo ""
	@echo "Release commands:"
	@echo "  release-patch    Bump patch version (1.0.0 → 1.0.1), tag & push"
	@echo "  release-minor    Bump minor version (1.0.0 → 1.1.0), tag & push"
	@echo "  release-major    Bump major version (1.0.0 → 2.0.0), tag & push"
	@echo "  bump-version     Bump VERSION=x.y.z manually (does not tag)"
	@echo "  current-version  Show current version"

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
	docker compose exec -T backend sh -lc 'export DATABASE_URL="postgres://$${DB_USER:-gilanios_admin}:$${DB_PASSWORD}@db:5432/$${DB_NAME:-gilanios}"; export DATABASE_READ_URL="$$DATABASE_URL"; python manage.py test --noinput'

test-backend-local:
	cd backend && DATABASE_URL="$${DATABASE_URL}" DATABASE_READ_URL="$${DATABASE_READ_URL}" python manage.py test --noinput

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

# ─────────────────────────────────────────────
# Version & Release Management
# ─────────────────────────────────────────────
current-version:
	@cat VERSION

# Usage: make bump-version VERSION=1.2.0
bump-version:
	@if [ -z "$(VERSION)" ]; then echo "Usage: make bump-version VERSION=x.y.z"; exit 1; fi
	@echo "$(VERSION)" > VERSION
	@cd frontend && npm version $(VERSION) --no-git-tag-version --allow-same-version
	@echo "✅ Version bumped to $(VERSION)"
	@echo "   Next: git add VERSION frontend/package.json && git commit -m 'chore: release v$(VERSION)'"

release-patch:
	$(eval CURRENT := $(shell cat VERSION))
	$(eval NEXT := $(shell echo $(CURRENT) | awk -F. '{printf "%d.%d.%d", $$1, $$2, $$3+1}'))
	@$(MAKE) _do-release VERSION=$(NEXT)

release-minor:
	$(eval CURRENT := $(shell cat VERSION))
	$(eval NEXT := $(shell echo $(CURRENT) | awk -F. '{printf "%d.%d.0", $$1, $$2+1}'))
	@$(MAKE) _do-release VERSION=$(NEXT)

release-major:
	$(eval CURRENT := $(shell cat VERSION))
	$(eval NEXT := $(shell echo $(CURRENT) | awk -F. '{printf "%d.0.0", $$1+1}'))
	@$(MAKE) _do-release VERSION=$(NEXT)

# Internal target — do not call directly
_do-release:
	@echo "🚀 Releasing v$(VERSION) (current: $(shell cat VERSION))"
	@$(MAKE) bump-version VERSION=$(VERSION)
	git add VERSION frontend/package.json
	git commit -m "chore: release v$(VERSION)"
	git tag -a v$(VERSION) -m "Release v$(VERSION)"
	git push origin main
	git push origin v$(VERSION)
	@echo "✅ Release v$(VERSION) tagged and pushed — GitHub Actions will build the release."
