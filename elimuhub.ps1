# ElimuHub Platform — PowerShell Management Script
# Usage: .\elimuhub.ps1 <command>

param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("build", "up", "down", "restart", "logs", "migrate", "superuser", "test", "clean", "ps")]
    [string]$Command
)

switch ($Command) {
    "build" {
        docker compose build --no-cache
    }
    "up" {
        docker compose up -d
    }
    "down" {
        docker compose down
    }
    "restart" {
        docker compose down
        docker compose up -d
    }
    "logs" {
        docker compose logs -f
    }
    "migrate" {
        Write-Host "Running Shared Migrations..." -ForegroundColor Cyan
        docker compose exec backend python manage.py migrate_schemas --shared --noinput
        Write-Host "Running Tenant Migrations..." -ForegroundColor Cyan
        docker compose exec backend python manage.py migrate_schemas --tenant --noinput
    }
    "superuser" {
        docker compose exec backend python manage.py createsuperuser
    }
    "test" {
        docker compose exec backend python -m pytest --tb=short -q
    }
    "clean" {
        docker compose down -v --rmi local
        docker system prune -f
    }
    "ps" {
        docker compose ps
    }
}
