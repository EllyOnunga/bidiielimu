import logging

from django.core.cache import cache
from django.db.models import Q
from django.http import JsonResponse
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


def add_security_headers(get_response):
    def middleware(request):
        response = get_response(request)
        response["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self' 'unsafe-inline'"
        )
        response["X-Content-Type-Options"] = "nosniff"
        return response

    return middleware


class APIKeyAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware to authenticate API requests using API keys
    """

    def process_request(self, request):
        # Check if this is an API request
        if not request.path.startswith("/api/"):
            return

        # Check for API key in header
        api_key = request.META.get("HTTP_X_API_KEY")
        if not api_key:
            return

        # Validate API key
        try:
            from accounts.models_api import APIKey

            key_hash = APIKey.hash_key(api_key)
            key_obj = APIKey.objects.select_related("user", "school").get(
                Q(key_hash=key_hash) | Q(key=api_key),
                is_active=True,
            )

            # Check if this is a legacy plaintext key
            if key_obj.key == api_key or key_obj.is_legacy:
                # Rotate the key immediately to invalidate it and trigger rotation lifecycle
                key_obj.rotate_key()
                key_obj.is_legacy = True
                key_obj.save(
                    update_fields=["key", "key_hash", "key_prefix", "is_legacy"]
                )
                return JsonResponse(
                    {
                        "error": "Legacy API key detected. Your key has been automatically rotated for security. Please retrieve your new API key from your school dashboard."
                    },
                    status=401,
                )

            if key_obj.is_expired:
                return JsonResponse({"error": "API key has expired"}, status=401)

            # Update last used timestamp (throttled)
            cache_key = f"api_key_last_used_{key_obj.id}"
            if not cache.get(cache_key):
                key_obj.last_used_at = timezone.now()
                key_obj.save(update_fields=["last_used_at"])
                cache.set(cache_key, True, 300)  # Cache for 5 minutes

            # Attach API key info to request
            request.api_key = key_obj
            request.user = key_obj.user
            request.school = key_obj.school

        except APIKey.DoesNotExist:
            return JsonResponse({"error": "Invalid API key"}, status=401)


class SecurityMiddleware(MiddlewareMixin):
    """
    Consolidated middleware for security headers, input validation, and sensitive endpoint handling
    """

    SENSITIVE_ENDPOINTS = [
        "/api/v1/accounts/login/",
        "/api/v1/accounts/register/",
        "/api/v1/accounts/change-password/",
    ]

    def process_request(self, request):
        # Input validation
        if request.method in ["POST", "PUT", "PATCH"]:
            invalid_json_response = self._validate_json_content(request)
            if invalid_json_response:
                return invalid_json_response

        # Log sensitive requests
        if any(endpoint in request.path for endpoint in self.SENSITIVE_ENDPOINTS):
            logger.info(
                f"Sensitive request: {request.method} {request.path}",
                extra={
                    "user_agent": request.META.get("HTTP_USER_AGENT", ""),
                    "remote_addr": self._get_client_ip(request),
                },
            )

    def process_response(self, request, response):
        # Security headers
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["X-XSS-Protection"] = "1; mode=block"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # Content Security Policy
        csp = (
            "default-src 'self' blob:; "
            "script-src 'self' https://*.google.com https://*.googletagmanager.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com; "
            "font-src 'self' https://fonts.gstatic.com https://api.fontshare.com https://cdn.fontshare.com data:; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' http: https: ws: wss: https://*.google.com https://*.microsoft.com; "
            "object-src 'none';"
        )
        response["Content-Security-Policy"] = csp

        # HSTS (only for HTTPS)
        if request.is_secure():
            response["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        # Cache control for sensitive endpoints and all API responses
        if any(
            endpoint in request.path for endpoint in self.SENSITIVE_ENDPOINTS
        ) or request.path.startswith("/api/"):
            response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response["Pragma"] = "no-cache"

        return response

    def _validate_json_content(self, request):
        """Validate JSON content for API requests"""
        if request.content_type == "application/json":
            if not request.body:
                return JsonResponse({"error": "Empty JSON body"}, status=400)
            try:
                import json

                json.loads(request.body.decode("utf-8"))
            except (json.JSONDecodeError, UnicodeDecodeError):
                return JsonResponse({"error": "Invalid JSON content"}, status=400)
        return None

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip
