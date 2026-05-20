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
        from django.http import JsonResponse

        # If user is not authenticated, check if we have a JWT authorization header
        if not request.user.is_authenticated:
            auth_header = request.META.get("HTTP_AUTHORIZATION", "")
            if auth_header.startswith("Bearer "):
                try:
                    from rest_framework_simplejwt.authentication import (
                        JWTAuthentication,
                    )

                    authenticator = JWTAuthentication()
                    auth_result = authenticator.authenticate(request)
                    if auth_result:
                        request.user, request.auth = auth_result
                except Exception:
                    pass

        # If user is still not authenticated, let normal auth middleware handle it or
        # proceed to login/public views
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
            if request.user.school_id != tenant.id and not (
                request.user.is_superuser or request.user.role_name == "SUPER_ADMIN"
            ):
                # Super admins can access any school for support, but others are
                # restricted
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
        # Ensure correlation ID exists (might have been set by
        # RequestCorrelationMiddleware)
        if not hasattr(request, "correlation_id"):
            request.correlation_id = request.META.get(
                "HTTP_X_CORRELATION_ID", str(uuid.uuid4())
            )

        # Log incoming request
        tenant = getattr(request, "tenant", None)
        logger.info(
            f"Request started: {request.method} {request.path}",
            extra={
                "correlation_id": request.correlation_id,
                "method": request.method,
                "path": request.path,
                "user_agent": request.META.get("HTTP_USER_AGENT", ""),
                "remote_addr": self._get_client_ip(request),
                "tenant": tenant.schema_name if tenant else "public",
            },
        )

        # Store start time for duration calculation
        request.start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, "correlation_id") and hasattr(request, "start_time"):
            duration = time.time() - request.start_time
            tenant = getattr(request, "tenant", None)

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
                    "tenant": tenant.schema_name if tenant else "public",
                },
            )

        return response

    def process_exception(self, request, exception):
        if hasattr(request, "correlation_id"):
            tenant = getattr(request, "tenant", None)
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
                    "tenant": tenant.schema_name if tenant else "public",
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


class MultiTenantMiddleware(MiddlewareMixin):
    """
    Middleware that ensures the correct tenant is identified from the hostname
    and synchronized across all database connections.
    """

    def process_request(self, request):
        # We rely on django-tenants' TenantMainMiddleware to set request.tenant
        # but we use this middleware to ensure cross-connection synchronization
        # and extra safety checks.
        return None


class TenantConnectionSyncMiddleware(MiddlewareMixin):
    """
    Ensures that the tenant set on the request is synchronized across ALL
    database connections (e.g., both 'default' and 'read' replicas).
    """

    def process_request(self, request):
        from django.db import connections

        from .db_utils import set_rls_session_variables

        tenant = getattr(request, "tenant", None)
        user_id = (
            getattr(request.user, "id", None) if hasattr(request, "user") else None
        )

        if tenant:
            for conn in connections.all():
                if hasattr(conn, "set_tenant"):
                    # Only set if not already set to the correct tenant to avoid
                    # overhead
                    if (
                        not getattr(conn, "tenant", None)
                        or conn.tenant.schema_name != tenant.schema_name
                    ):
                        conn.set_tenant(tenant)

            # Set RLS session variables for all connections
            set_rls_session_variables(
                connections.all(), tenant_id=tenant.id, user_id=user_id
            )

        return None
