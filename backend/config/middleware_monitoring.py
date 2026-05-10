import logging
import time

from django.core.cache import cache
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """
    Middleware to monitor request performance and collect metrics
    """

    def process_request(self, request):
        request.start_time = time.time()
        request.memory_start = self._get_memory_usage()

    def process_response(self, request, response):
        if hasattr(request, "start_time"):
            duration = time.time() - request.start_time

            # Log slow requests
            if duration > 1.0:  # Log requests taking more than 1 second
                logger.warning(
                    f"Slow request: {request.method} {request.path} - {duration:.3f}s",
                    extra={
                        "duration": duration,
                        "status_code": response.status_code,
                        "user_id": (
                            getattr(request.user, "id", None)
                            if hasattr(request, "user")
                            else None
                        ),
                        "path": request.path,
                        "method": request.method,
                    },
                )

            # Collect metrics
            self._collect_metrics(request, response, duration)

        return response

    def process_exception(self, request, exception):
        if hasattr(request, "start_time"):
            duration = time.time() - request.start_time

            logger.error(
                f"Request exception: {request.method} {request.path} - {duration:.3f}s",
                extra={
                    "duration": duration,
                    "exception": str(exception),
                    "user_id": (
                        getattr(request.user, "id", None)
                        if hasattr(request, "user")
                        else None
                    ),
                    "path": request.path,
                    "method": request.method,
                },
                exc_info=True,
            )

        # Increment error metrics
        self._increment_metric("http_requests_errors_total")

    def _collect_metrics(self, request, response, duration):
        """Collect Prometheus-style metrics"""
        # Request count
        self._increment_metric("http_requests_total")

        # Request duration histogram buckets
        duration_ms = duration * 1000
        if duration_ms <= 100:
            self._increment_metric("http_request_duration_bucket_le_100ms")
        elif duration_ms <= 500:
            self._increment_metric("http_request_duration_bucket_le_500ms")
        elif duration_ms <= 1000:
            self._increment_metric("http_request_duration_bucket_le_1000ms")
        else:
            self._increment_metric("http_request_duration_bucket_over_1000ms")

        # Status code metrics
        status_bucket = f"{response.status_code // 100}xx"
        self._increment_metric(f"http_requests_status_{status_bucket}")

    def _increment_metric(self, metric_name, value=1):
        """Increment a metric in cache (simplified metrics storage)"""
        try:
            cache.incr(metric_name, value)
        except ValueError:
            # Key doesn't exist, set it
            cache.set(metric_name, value, timeout=None)

    def _get_memory_usage(self):
        """Get current memory usage (simplified)"""
        try:
            import psutil

            process = psutil.Process()
            return process.memory_info().rss / 1024 / 1024  # MB
        except ImportError:
            return 0


class ErrorTrackingMiddleware(MiddlewareMixin):
    """
    Middleware to track and categorize errors
    """

    def process_exception(self, request, exception):
        # Categorize errors
        error_type = type(exception).__name__

        if "ValidationError" in error_type:
            error_category = "validation"
        elif "PermissionDenied" in error_type:
            error_category = "permission"
        elif "AuthenticationFailed" in error_type:
            error_category = "authentication"
        elif "NotFound" in error_type:
            error_category = "not_found"
        else:
            error_category = "server_error"

        # Log structured error
        logger.error(
            f"Error {error_category}: {request.method} {request.path}",
            extra={
                "error_type": error_type,
                "error_category": error_category,
                "user_id": (
                    getattr(request.user, "id", None)
                    if hasattr(request, "user")
                    else None
                ),
                "path": request.path,
                "method": request.method,
                "user_agent": request.META.get("HTTP_USER_AGENT", ""),
            },
            exc_info=True,
        )

        # Increment error metrics
        self._increment_metric(f"errors_{error_category}_total")

    def _increment_metric(self, metric_name, value=1):
        """Increment error metric"""
        try:
            from django.core.cache import cache

            cache.incr(metric_name, value)
        except ValueError:
            cache.set(metric_name, value, timeout=None)
