.PHONY: help build up down restart logs shell-backend shell-db migrate collectstatic superuser clean ps

# ─────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────
help:
	@echo ""
	@echo "  Scholara Platform — Docker Management"
	@echo "  ──────────────────────────────────────────"
	@echo "  make build           Build all Docker images"
	@echo "  make up              Start all services (detached)"
	@echo "  make down            Stop and remove containers"
	@echo "  make restart         Restart all services"
	@echo "  make logs            Tail logs from all services"
	@echo "  make logs-backend    Tail backend logs only"
	@echo "  make logs-worker     Tail celery worker logs only"
	@echo "  make shell-backend   Open a shell in the backend container"
	@echo "  make shell-db        Open psql in the database container"
	@echo "  make migrate         Run Django schema migrations"
	@echo "  make collectstatic   Collect Django static files"
	@echo "  make superuser       Create a Django superuser"
	@echo "  make test            Run backend test suite"
	@echo "  make clean           Remove containers, volumes, and images"
	@echo "  make ps              Show running container status"
	@echo ""

# ─────────────────────────────────────────────
# Core Lifecycle
# ─────────────────────────────────────────────
build:
	docker compose build --no-cache

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose down && docker compose up -d

ps:
	docker compose ps

# ─────────────────────────────────────────────
# Logs
# ─────────────────────────────────────────────
logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-worker:
	docker compose logs -f celery_worker

# ─────────────────────────────────────────────
# Shell Access
# ─────────────────────────────────────────────
shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec db psql -U ${POSTGRES_USER:-scholara_user} -d ${POSTGRES_DB:-scholara}

# ─────────────────────────────────────────────
# Django Management
# ─────────────────────────────────────────────
migrate:
	docker compose exec backend python manage.py migrate_schemas --shared --noinput
	docker compose exec backend python manage.py migrate_schemas --tenant --noinput

collectstatic:
	docker compose exec backend python manage.py collectstatic --noinput

superuser:
	docker compose exec backend python manage.py createsuperuser

# ─────────────────────────────────────────────
# Testing
# ─────────────────────────────────────────────
test:
	docker compose exec backend python -m pytest --tb=short -q

# ─────────────────────────────────────────────
# Cleanup
# ─────────────────────────────────────────────
clean:
	docker compose down -v --rmi local
	docker system prune -f
