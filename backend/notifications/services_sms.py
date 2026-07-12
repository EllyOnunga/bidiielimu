import time
from enum import Enum

import africastalking
from django.conf import settings


class CircuitBreakerState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreaker:
    def __init__(
        self, failure_threshold=3, recovery_timeout=300, expected_exception=Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitBreakerState.CLOSED

    def call(self, func, *args, **kwargs):
        if self.state == CircuitBreakerState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitBreakerState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is open")

        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except self.expected_exception as e:
            self.on_failure()
            raise e

    def on_success(self):
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.reset()
        self.failure_count = 0

    def on_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN

    def reset(self):
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED


def normalize_phone_number(phone):
    """
    Normalizes local/international phone numbers to E.164 format for Africa's Talking.
    """
    if not phone:
        return ""
    # Convert to string and remove non-digit/non-plus characters
    clean_phone = "".join(c for c in str(phone) if c.isdigit() or c == "+")

    if clean_phone.startswith("+"):
        return clean_phone

    if clean_phone.startswith("0") and len(clean_phone) == 10:
        return "+254" + clean_phone[1:]

    if clean_phone.startswith("254") and len(clean_phone) == 12:
        return "+" + clean_phone

    if len(clean_phone) == 9:
        return "+254" + clean_phone

    return clean_phone


class SMSService:
    def __init__(self):
        self.username = settings.AT_USERNAME
        self.api_key = settings.AT_API_KEY
        africastalking.initialize(self.username, self.api_key)
        self.sms = africastalking.SMS
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=3, recovery_timeout=300
        )  # 3 failures, 5 min recovery

    def send_bulk_sms(self, phone_numbers, message):
        """
        Sends a message to multiple phone numbers.
        phone_numbers: List of strings (e.g. ['+254711...'])
        """
        normalized_numbers = []
        for num in phone_numbers:
            normalized = normalize_phone_number(num)
            if normalized:
                normalized_numbers.append(normalized)

        def _send():
            return self.sms.send(message, normalized_numbers)

        try:
            response = self.circuit_breaker.call(_send)
            return response
        except Exception as e:
            import logging

            logger = logging.getLogger(__name__)
            logger.exception("SMS Broadcast failed: %s", str(e))
            return None

    @staticmethod
    def broadcast_to_parents(message):
        from students.models import Guardian

        guardians = Guardian.objects.all().values_list("phone_number", flat=True)
        phone_numbers = list(set(guardians))  # Unique numbers

        service = SMSService()
        return service.send_bulk_sms(phone_numbers, message)
