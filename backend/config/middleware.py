import uuid
import logging

logger = logging.getLogger(__name__)

class RequestCorrelationMiddleware:
    """
    Middleware that ensures every request has an X-Request-ID attached for
    correlation across microservices and log tracking.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Retrieve existing request ID or generate a new one
        request_id = request.headers.get('X-Request-ID')
        if not request_id:
            request_id = str(uuid.uuid4())
            
        request.correlation_id = request_id
        
        # Add correlation ID to logging context (if using a package like django-log-request-id)
        # For now, we will simply attach it to the request object.
        
        response = self.get_response(request)
        
        # Attach the correlation ID to the response header
        if response is not None:
            response['X-Request-ID'] = request_id
        
        return response

class TenantAccessMiddleware:
    """
    Middleware that ensures an authenticated user only accesses the school 
    schema they are assigned to. This prevents cross-tenant data leaks.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from django.db import connection
        from django.http import JsonResponse
        
        # current_tenant is set by django-tenants middleware (TenantMainMiddleware)
        tenant = getattr(request, 'tenant', None)
        user = request.user
        
        if user.is_authenticated and tenant and tenant.schema_name != 'public':
            # Ignore Super Admins who manage the platform
            if user.role != 'SUPER_ADMIN':
                if not user.school or user.school.id != tenant.id:
                    return JsonResponse({
                        "detail": "Access Denied. This user does not belong to this school tenant.",
                        "code": "cross_tenant_access_denied"
                    }, status=403)
                    
        return self.get_response(request)
