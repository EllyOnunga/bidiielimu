from rest_framework.throttling import SimpleRateThrottle


class APIKeyRateThrottle(SimpleRateThrottle):
    """
    Rate throttle based on API key
    """

    scope = "api_key"
    rate = "1000/hour"

    def get_cache_key(self, request, view):
        if hasattr(request, "api_key"):
            return f"throttle_api_key_{request.api_key.id}"
        return None

    def get_rate(self):
        """Get rate limit from API key if available"""
        # Safe default for __init__
        return getattr(self, "rate", "1000/hour")

    def allow_request(self, request, view):
        # Dynamically set rate based on API key if present
        if hasattr(request, "api_key"):
            self.rate = f"{request.api_key.rate_limit_requests}/hour"
            self.num_requests, self.duration = self.parse_rate(self.rate)

        return super().allow_request(request, view)


class BurstRateThrottle(SimpleRateThrottle):
    """
    Burst rate throttle for short-term request spikes
    """

    scope = "burst"
    rate = "100/minute"

    def get_cache_key(self, request, view):
        if hasattr(request, "user") and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class ScopedRateThrottle(SimpleRateThrottle):
    """
    Scoped rate throttle based on view action
    """

    scope_attr = "throttle_scope"

    def get_cache_key(self, request, view):
        # Determine the scope from the view
        self.scope = getattr(view, self.scope_attr, None)
        if not self.scope:
            return None

        # Determine the allowed rate for the scope
        self.rate = self.get_rate()
        self.num_requests, self.duration = self.parse_rate(self.rate)

        if hasattr(request, "user") and request.user.is_authenticated:
            ident = request.user.pk
        elif hasattr(request, "api_key"):
            ident = f"api_key_{request.api_key.id}"
        else:
            ident = self.get_ident(request)

        return self.cache_format % {"scope": self.scope, "ident": ident}

    def get_rate(self):
        """Get rate from DEFAULT_THROTTLE_RATES settings mapping"""
        from django.conf import settings

        rates = getattr(settings, "REST_FRAMEWORK", {}).get(
            "DEFAULT_THROTTLE_RATES", {}
        )

        # If scope is set (at request time), use it. Otherwise use default.
        scope = getattr(self, "scope", None)
        if scope:
            return rates.get(scope, rates.get("default", "1000/hour"))

        return rates.get("default", "1000/hour")
