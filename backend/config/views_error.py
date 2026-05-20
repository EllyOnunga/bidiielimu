import logging
import os

import sentry_sdk
from django.http import JsonResponse
from django.shortcuts import render
from sentry_sdk.integrations.django import DjangoIntegration

logger = logging.getLogger(__name__)


def handler404(request, exception):
    """Custom 404 handler with tenant awareness"""
    tenant = getattr(request, "tenant", None)
    if request.path.startswith("/api/"):
        return JsonResponse(
            {
                "error": "Not Found",
                "message": "The requested resource was not found.",
                "tenant": tenant.schema_name if tenant else "public",
            },
            status=404,
        )
    else:
        return render(request, "404.html", {"tenant": tenant}, status=404)


def handler500(request):
    """Custom 500 handler with tenant awareness and error recovery"""
    tenant = getattr(request, "tenant", None)
    logger.error(
        "500 error occurred",
        extra={
            "tenant": tenant.schema_name if tenant else "public",
            "path": request.path,
            "user_id": (
                getattr(request.user, "id", None) if hasattr(request, "user") else None
            ),
        },
        exc_info=True,
    )

    if request.path.startswith("/api/"):
        return JsonResponse(
            {
                "error": "Internal Server Error",
                "message": "An unexpected error occurred. Please try again later.",
                "tenant": tenant.schema_name if tenant else "public",
            },
            status=500,
        )
    else:
        return render(request, "500.html", {"tenant": tenant}, status=500)


def handler403(request, exception):
    """Custom 403 handler with tenant awareness"""
    tenant = getattr(request, "tenant", None)
    if request.path.startswith("/api/"):
        return JsonResponse(
            {
                "error": "Forbidden",
                "message": "You do not have permission to access this resource.",
                "tenant": tenant.schema_name if tenant else "public",
            },
            status=403,
        )
    else:
        return render(request, "403.html", {"tenant": tenant}, status=403)
