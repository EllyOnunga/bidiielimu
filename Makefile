# ElimuHub Development Makefile

.PHONY: help install clean test lint format docker-build docker-up docker-down migrate collectstatic

# Default target
help:
	@echo "Available commands:"
	@echo "  install       Install all dependencies"
	@echo "  clean         Clean up cache files and dependencies"
	@echo "  test          Run all tests"
	@echo "  lint          Run linting and formatting checks"
	@echo "  format        Format code"
	@echo "  docker-build  Build Docker images"
	@echo "  docker-up     Start all services with Docker Compose"
	@echo "  docker-down   Stop all services"
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
	cd backend && python manage.py test
	cd frontend && npm run test

# Linting and formatting
lint:
	cd backend && flake8 . && black --check . && isort --check-only --profile black .
	cd frontend && npm run lint

format:
	cd backend && black . && isort --profile black .
	cd frontend && npm run format

# Docker commands
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

# Django commands
migrate:
	cd backend && python manage.py migrate_schemas --noinput

collectstatic:
	cd backend && python manage.py collectstatic --noinput

# Initial setup
setup: install migrate collectstatic
	cd backend && python manage.py createsuperuser --noinput || true
	cd frontend && npm run build