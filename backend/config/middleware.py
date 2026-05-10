import logging
import time
import uuid

from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestCorrelationMiddleware(MiddlewareMixin):
    """Middleware to ensure every request has a unique correlation ID for tracking."""

    def process_request(self, request):
        correlation_id = request.META.get("HTTP_X_CORRELATION_ID", str(uuid.uuid4()))
        request.correlation_id = correlation_id
        return None


class TenantAccessMiddleware(MiddlewareMixin):
    """
    Enforces strict tenant isolation and secures the main platform URL.
    - Main URL (public schema) is restricted to SUPER_ADMIN users only.
    - School URLs (tenant schemas) are restricted to users belonging to that specific school.
    """

    def process_request(self, request):
        from django.conf import settings
        from django.http import JsonResponse

        # If user is not authenticated, let normal auth middleware handle it or proceed to login views
        if not request.user.is_authenticated:
            return None

        tenant = getattr(request, "tenant", None)
        if not tenant:
            return None

        # 1. Accessing Main URL (Public Schema)
        if tenant.schema_name == "public":
            # Only SUPER_ADMIN can access the main platform dashboard/API
            if not (
                request.user.is_superuser or request.user.role_name == "SUPER_ADMIN"
            ):
                return JsonResponse(
                    {
                        "error": "Access Denied",
                        "message": "Only Platform Super Admins can access the main platform dashboard. Please login via your school's specific URL.",
                    },
                    status=403,
                )

        # 2. Accessing School URL (Tenant Schema)
        else:
            # Check if user belongs to this school
            if request.user.school_id != tenant.id and not request.user.is_superuser:
                # Super admins can access any school for support, but others are restricted
                return JsonResponse(
                    {
                        "error": "Tenant Access Denied",
                        "message": "You do not have permission to access this school's dashboard.",
                    },
                    status=403,
                )

        return None


class RequestLoggingMiddleware(MiddlewareMixin):
    """Middleware to log HTTP requests and responses with correlation IDs"""

    def process_request(self, request):
        # Ensure correlation ID exists (might have been set by RequestCorrelationMiddleware)
        if not hasattr(request, "correlation_id"):
            request.correlation_id = request.META.get(
                "HTTP_X_CORRELATION_ID", str(uuid.uuid4())
            )

        # Log incoming request
        logger.info(
            f"Request started: {request.method} {request.path}",
            extra={
                "correlation_id": request.correlation_id,
                "method": request.method,
                "path": request.path,
                "user_agent": request.META.get("HTTP_USER_AGENT", ""),
                "remote_addr": self._get_client_ip(request),
            },
        )

        # Store start time for duration calculation
        request.start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, "correlation_id") and hasattr(request, "start_time"):
            duration = time.time() - request.start_time

            logger.info(
                f"Request completed: {request.method} {request.path} - {response.status_code}",
                extra={
                    "correlation_id": request.correlation_id,
                    "method": request.method,
                    "path": request.path,
                    "status_code": response.status_code,
                    "duration": f"{duration:.3f}s",
                    "user_id": (
                        getattr(request.user, "id", None)
                        if hasattr(request, "user")
                        else None
                    ),
                },
            )

        return response

    def process_exception(self, request, exception):
        if hasattr(request, "correlation_id"):
            logger.error(
                f"Request exception: {request.method} {request.path} - {str(exception)}",
                extra={
                    "correlation_id": request.correlation_id,
                    "method": request.method,
                    "path": request.path,
                    "exception": str(exception),
                    "user_id": (
                        getattr(request.user, "id", None)
                        if hasattr(request, "user")
                        else None
                    ),
                },
                exc_info=True,
            )

    def _get_client_ip(self, request):
        """Get the client IP address, handling proxy headers"""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip
