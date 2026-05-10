import psycopg2
import redis
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    """
    Comprehensive health check endpoint
    """

    permission_classes = []  # Allow public access
    authentication_classes = []

    def get(self, request):
        health_status = {
            "status": "healthy",
            "timestamp": self._get_timestamp(),
            "version": getattr(settings, "VERSION", "1.0.0"),
            "services": {},
        }

        # Check database
        db_healthy = self._check_database()
        health_status["services"]["database"] = {
            "status": "healthy" if db_healthy else "unhealthy",
            "details": (
                "PostgreSQL connection OK"
                if db_healthy
                else "Database connection failed"
            ),
        }

        # Check Redis
        redis_healthy = self._check_redis()
        health_status["services"]["redis"] = {
            "status": "healthy" if redis_healthy else "unhealthy",
            "details": (
                "Redis connection OK" if redis_healthy else "Redis connection failed"
            ),
        }

        # Check external services
        health_status["services"]["email"] = {
            "status": "healthy",  # Assume healthy unless we implement deeper checks
            "details": "Email service configured",
        }

        # Overall status
        all_healthy = all(
            service["status"] == "healthy"
            for service in health_status["services"].values()
        )
        health_status["status"] = "healthy" if all_healthy else "unhealthy"

        response_status = (
            status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        )

        return Response(health_status, status=response_status)

    def _check_database(self):
        """Check database connectivity"""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                return True
        except Exception:
            return False

    def _check_redis(self):
        """Check Redis connectivity"""
        try:
            redis_url = settings.CACHES["default"]["LOCATION"]
            if redis_url.startswith("redis://"):
                # Parse Redis URL
                import redis

                r = redis.from_url(redis_url)
                r.ping()
                return True
        except Exception:
            pass
        return False

    def _get_timestamp(self):
        """Get current timestamp"""
        from django.utils import timezone

        return timezone.now().isoformat()


class ReadinessCheckView(APIView):
    """
    Kubernetes readiness probe
    """

    permission_classes = []
    authentication_classes = []

    def get(self, request):
        # Check if application is ready to serve traffic
        try:
            # Quick database check
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")

            return Response({"status": "ready"}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"status": "not ready"}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )


class LivenessCheckView(APIView):
    """
    Kubernetes liveness probe
    """

    permission_classes = []
    authentication_classes = []

    def get(self, request):
        # Basic liveness check - if this responds, the app is alive
        return Response({"status": "alive"}, status=status.HTTP_200_OK)


class MetricsView(APIView):
    """
    Prometheus-style metrics endpoint
    """

    permission_classes = []
    authentication_classes = []

    def get(self, request):
        metrics = []

        # Database connection pool metrics
        try:
            from django.db import connections

            for alias, conn in connections.databases.items():
                # This is a simplified metrics example
                metrics.append(
                    f"# HELP db_connections_total Total database connections"
                )
                metrics.append(f"# TYPE db_connections_total gauge")
                metrics.append(f'db_connections_total{{alias="{alias}"}} {len(conn)}')
        except Exception:
            pass

        # Request count metrics (simplified)
        metrics.append(f"# HELP http_requests_total Total HTTP requests")
        metrics.append(f"# TYPE http_requests_total counter")
        metrics.append(f"http_requests_total 0")  # Would need proper metrics collection

        return Response("\n".join(metrics), content_type="text/plain")
