import threading

_thread_locals = threading.local()

def get_current_request():
    return getattr(_thread_locals, 'request', None)

def get_current_user():
    request = get_current_request()
    if request and hasattr(request, 'user'):
        return request.user
    return None

def get_client_ip():
    request = get_current_request()
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

class RequestTrackingMiddleware:
    """
    Middleware to store the request object in thread-local storage.
    This allows models and signals to access the current user and IP address
    without having it explicitly passed to them.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        
        response = self.get_response(request)
        
        # Clean up
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request
            
        return response
