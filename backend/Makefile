# ElimuHub Backend Shortcut Makefile
# Redirects common commands to the root Makefile or runs them directly

.PHONY: help docker-build docker-up docker-down migrate test shell

help:
	@echo "Backend shortcut commands:"
	@echo "  docker-build  Build Docker images (runs from root)"
	@echo "  docker-up     Start services (runs from root)"
	@echo "  migrate       Run Django migrations"
	@echo "  test          Run backend tests"
	@echo "  shell         Open Django shell"

docker-build:
	cd .. && make docker-build

docker-up:
	cd .. && make docker-up

docker-down:
	cd .. && make docker-down

migrate:
	python manage.py migrate_schemas --noinput

test:
	python manage.py test

shell:
	python manage.py shell
