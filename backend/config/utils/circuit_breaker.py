from functools import wraps

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)


def circuit_breaker(
    max_attempts=3,
    exceptions=(Exception,),
    reraise=True,
):
    """Decorator providing circuit-breaker style retry with exponential backoff."""

    def decorator(func):
        @retry(
            stop=stop_after_attempt(max_attempts),
            wait=wait_exponential(multiplier=1, min=1, max=10),
            retry=retry_if_exception_type(exceptions),
            reraise=reraise,
        )
        @wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)

        return wrapper

    return decorator
