import hashlib
from functools import wraps

from django.core.cache import cache
from django.http import HttpResponse


def _ensure_rendered(response):
    """
    Ensure the response is rendered before accessing .content.
    Required for TemplateResponse and some DRF responses.
    """
    if hasattr(response, "render") and callable(response.render):
        # DRF Response objects need an accepted_renderer to render.
        # If it's not set, we can't render it manually yet.
        if hasattr(response, "accepted_renderer") and not getattr(
            response, "accepted_renderer", None
        ):
            try:
                return response.content
            except Exception:
                return b""

        if hasattr(response, "is_rendered"):
            if not response.is_rendered:
                try:
                    response.render()
                except Exception:
                    pass
        else:
            try:
                response.render()
            except Exception:
                pass

    try:
        return response.content
    except Exception:
        return b""


def cache_api_response(timeout=300, key_prefix="api_response"):
    """
    Decorator to cache API view responses.
    Handles both function-based views and class-based view methods.
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(*args, **kwargs):
            # Determine which argument is the request
            # In DRF ViewSets, the signature is (self, request, *args, **kwargs)
            # In regular views, it is (request, *args, **kwargs)
            if len(args) > 0 and hasattr(args[0], "method"):
                request = args[0]
            elif len(args) > 1 and hasattr(args[1], "method"):
                request = args[1]
            else:
                # Fallback or error if no request object found
                return view_func(*args, **kwargs)

            # Only cache GET requests
            if request.method != "GET":
                return view_func(*args, **kwargs)

            # Create cache key from request
            cache_key = _generate_cache_key(request, key_prefix)

            # Try to get cached response
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                # Return cached response
                response = HttpResponse(
                    cached_response["content"],
                    status=cached_response["status"],
                    content_type=cached_response["content_type"],
                )
                # Restore headers
                for header, value in cached_response.get("headers", {}).items():
                    response[header] = value
                return response

            # Get fresh response
            response = view_func(*args, **kwargs)

            # Cache the response
            if hasattr(response, "status_code") and response.status_code == 200:
                content = _ensure_rendered(response)
                cached_data = {
                    "content": content,
                    "status": response.status_code,
                    "content_type": response.get("Content-Type", "application/json"),
                    "headers": dict(response.items()),
                }
                cache.set(cache_key, cached_data, timeout)

            return response

        return _wrapped_view

    return decorator


def cache_tenant_page(timeout=300):
    """
    Decorator for tenant-aware page caching
    """
    return cache_api_response(timeout=timeout, key_prefix="tenant_page")


def _generate_cache_key(request, prefix):
    """
    Generate a unique cache key for the request.
    Uses a hierarchical structure to allow surgical invalidation.
    Format: prefix:schema:user_id:hash
    """
    # Include user ID for user-specific caching
    user_id = (
        request.user.id
        if hasattr(request, "user") and request.user.is_authenticated
        else "anonymous"
    )

    # Include tenant schema for multi-tenant caching
    schema = getattr(request, "tenant", None)
    if hasattr(schema, "schema_name"):
        schema_name = schema.schema_name
    else:
        schema_name = "public"

    # Create path hash for the specific endpoint
    path_components = [
        request.path,
        request.GET.urlencode() if request.GET else "",
    ]
    path_string = "|".join(path_components)
    path_hash = hashlib.md5(path_string.encode()).hexdigest()

    # Hierarchical key structure
    return f"{prefix}:{schema_name}:{user_id}:{path_hash}"


def clear_api_cache(request):
    """
    Invalidate all API cache for the current tenant and user.
    """
    schema = getattr(request, "tenant", None)
    schema_name = schema.schema_name if hasattr(schema, "schema_name") else "public"
    user_id = getattr(request.user, "id", "*") if hasattr(request, "user") else "*"

    # We use patterns to clear related cache keys
    # Note: delete_pattern is specific to django-redis
    from django.core.cache import cache

    user_id = request.user.id if request.user.is_authenticated else "anonymous"

    prefixes = ["api_response", "tenant_page"]
    for prefix in prefixes:
        # Clear specific user cache and potentially shared tenant cache
        patterns = [
            f"{prefix}:{schema_name}:{user_id}:*",
            f"{prefix}:{schema_name}:anonymous:*",
        ]

        for pattern in patterns:
            if hasattr(cache, "delete_pattern"):
                cache.delete_pattern(pattern)
            else:
                if "LocMemCache" in str(type(cache)):
                    cache.clear()
                    break


class APICacheMiddleware:
    """
    Middleware for caching API responses and invalidating cache on mutations.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only handle API requests
        if not request.path.startswith("/api/"):
            return self.get_response(request)

        # 1. Handle Cache Invalidation on Mutations
        # If this is a successful mutating request, clear the cache
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            response = self.get_response(request)
            if 200 <= response.status_code < 300:
                clear_api_cache(request)
            return response

        # 2. Handle Cache Retrieval
        # Check if response should be cached (marked by decorator)
        if hasattr(request, "_cache_response") and request._cache_response:
            cached_response = self._get_cached_response(request)
            if cached_response:
                return cached_response

        # 3. Get Fresh Response and Cache it if marked
        response = self.get_response(request)

        if (
            request.method == "GET"
            and response.status_code == 200
            and hasattr(request, "_cache_response")
            and request._cache_response
        ):

            self._cache_response(request, response)

        return response

    def _get_cached_response(self, request):
        """Get cached response if available"""
        from django.core.cache import cache

        cache_key = _generate_cache_key(request, "api_response")

        cached_data = cache.get(cache_key)
        if cached_data:
            response = HttpResponse(
                cached_data["content"],
                status=cached_data["status"],
                content_type=cached_data["content_type"],
            )
            # Restore headers
            for header, value in cached_data.get("headers", {}).items():
                response[header] = value
            return response

        return None

    def _cache_response(self, request, response):
        """Cache the response"""
        from django.core.cache import cache

        cache_key = _generate_cache_key(request, "api_response")

        content = _ensure_rendered(response)
        cached_data = {
            "content": content,
            "status": response.status_code,
            "content_type": response.get("Content-Type", "application/json"),
            "headers": dict(response.items()),
        }

        # Use timeout from request attribute or default
        timeout = getattr(request, "_cache_timeout", 300)
        cache.set(cache_key, cached_data, timeout)


def cache_response(timeout=300):
    """
    Decorator to mark a view for response caching
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(*args, **kwargs):
            # Find the request object
            if len(args) > 0 and hasattr(args[0], "method"):
                request = args[0]
            elif len(args) > 1 and hasattr(args[1], "method"):
                request = args[1]
            else:
                return view_func(*args, **kwargs)

            request._cache_response = True
            request._cache_timeout = timeout
            return view_func(*args, **kwargs)

        return _wrapped_view

    return decorator
