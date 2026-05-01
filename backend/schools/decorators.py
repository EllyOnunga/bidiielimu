from functools import wraps
from django.core.cache import cache

def cache_tenant_page(timeout):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(self, request, *args, **kwargs):
            if not request.user.is_authenticated or not request.user.school:
                return view_func(self, request, *args, **kwargs)
                
            # Create a unique cache key per school, per view, per user role
            cache_key = f"tenant_cache_{request.user.school.id}_{request.path}_{request.user.role}"
            
            response = cache.get(cache_key)
            if response is not None:
                return response
                
            response = view_func(self, request, *args, **kwargs)
            cache.set(cache_key, response, timeout)
            return response
        return _wrapped_view
    return decorator
