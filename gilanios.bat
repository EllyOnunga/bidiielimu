@echo off
set CMD=%1

if "%CMD%"=="build" (
    docker compose build --no-cache
) else if "%CMD%"=="up" (
    docker compose up -d
) else if "%CMD%"=="down" (
    docker compose down
) else if "%CMD%"=="restart" (
    docker compose down
    docker compose up -d
) else if "%CMD%"=="logs" (
    docker compose logs -f
) else if "%CMD%"=="migrate" (
    echo Running Shared Migrations...
    docker compose exec backend python manage.py migrate_schemas --shared --noinput
    echo Running Tenant Migrations...
    docker compose exec backend python manage.py migrate_schemas --tenant --noinput
) else if "%CMD%"=="superuser" (
    docker compose exec backend python manage.py createsuperuser
) else if "%CMD%"=="test" (
    docker compose exec backend python -m pytest --tb=short -q
) else if "%CMD%"=="clean" (
    docker compose down -v --rmi local
    docker system prune -f
) else if "%CMD%"=="ps" (
    docker compose ps
) else (
    echo Usage: gilanios.bat [build^|up^|down^|restart^|logs^|migrate^|superuser^|test^|clean^|ps]
)
