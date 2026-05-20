from django.core.cache import cache


class TenantCacheService:
    """
    Helper service to manage cached values under tenant-isolated keys.
    Since config/settings.py has KEY_FUNCTION configured to make keys tenant-aware,
    standard cache operations are naturally partitioned by tenant.
    """

    @staticmethod
    def get(key, default=None):
        return cache.get(key, default)

    @staticmethod
    def set(key, value, timeout=3600):
        cache.set(key, value, timeout)

    @staticmethod
    def delete(key):
        cache.delete(key)

    @staticmethod
    def get_or_set(key, default_fn, timeout=3600):
        """
        Retrieves key value, or evaluates default_fn and sets it if not cached.
        """
        value = cache.get(key)
        if value is None:
            value = default_fn()
            cache.set(key, value, timeout)
        return value
