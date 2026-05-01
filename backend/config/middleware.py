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
