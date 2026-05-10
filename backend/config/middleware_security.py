import logging
from django.http import JsonResponse
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class APIKeyAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware to authenticate API requests using API keys
    """

    def process_request(self, request):
        # Check if this is an API request
        if not request.path.startswith('/api/'):
            return

        # Check for API key in header
        api_key = request.META.get('HTTP_X_API_KEY')
        if not api_key:
            return

        # Validate API key
        try:
            from accounts.models_api import APIKey
            key_obj = APIKey.objects.select_related('user', 'school').get(
                key=api_key,
                is_active=True
            )

            if key_obj.is_expired:
                return JsonResponse(
                    {'error': 'API key has expired'},
                    status=401
                )

            # Update last used timestamp (throttled)
            cache_key = f"api_key_last_used_{key_obj.id}"
            if not cache.get(cache_key):
                key_obj.last_used_at = timezone.now()
                key_obj.save(update_fields=['last_used_at'])
                cache.set(cache_key, True, 300)  # Cache for 5 minutes

            # Attach API key info to request
            request.api_key = key_obj
            request.user = key_obj.user
            request.school = key_obj.school

        except APIKey.DoesNotExist:
            return JsonResponse(
                {'error': 'Invalid API key'},
                status=401
            )


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers to all responses
    """

    def process_response(self, request, response):
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googletagmanager.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' https://*.google.com https://*.microsoft.com;"
        )
        response['Content-Security-Policy'] = csp

        # HSTS (only for HTTPS)
        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        return response


class RequestEncryptionMiddleware(MiddlewareMixin):
    """
    Middleware to handle encrypted request/response data for sensitive endpoints
    """

    SENSITIVE_ENDPOINTS = [
        '/api/v1/accounts/login/',
        '/api/v1/accounts/register/',
        '/api/v1/accounts/change-password/',
    ]

    def process_request(self, request):
        if any(endpoint in request.path for endpoint in self.SENSITIVE_ENDPOINTS):
            # Log sensitive request (without sensitive data)
            logger.info(
                f"Sensitive request: {request.method} {request.path}",
                extra={
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'remote_addr': self._get_client_ip(request),
                }
            )

    def process_response(self, request, response):
        # Add encryption headers for sensitive responses
        if any(endpoint in request.path for endpoint in self.SENSITIVE_ENDPOINTS):
            response['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'

        return response

    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class InputValidationMiddleware(MiddlewareMixin):
    """
    Middleware to validate and sanitize input data
    """

    def process_request(self, request):
        # Basic input validation
        if request.method in ['POST', 'PUT', 'PATCH']:
            self._validate_json_content(request)

    def _validate_json_content(self, request):
        """Validate JSON content for API requests"""
        if request.content_type == 'application/json':
            try:
                # Attempt to parse JSON
                import json
                json.loads(request.body.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError):
                from django.http import JsonResponse
                return JsonResponse(
                    {'error': 'Invalid JSON content'},
                    status=400
                )