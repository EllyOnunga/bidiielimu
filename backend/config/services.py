"""
Service interfaces and contracts for microservices architecture
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from django.utils import timezone


@dataclass
class ServiceResponse:
    success: bool
    data: Any = None
    error: str = ""
    metadata: Dict[str, Any] = None


class UserServiceInterface(ABC):
    """Interface for user management service"""

    @abstractmethod
    def create_user(self, user_data: Dict[str, Any]) -> ServiceResponse:
        pass

    @abstractmethod
    def get_user(self, user_id: int) -> ServiceResponse:
        pass

    @abstractmethod
    def update_user(self, user_id: int, user_data: Dict[str, Any]) -> ServiceResponse:
        pass

    @abstractmethod
    def authenticate_user(self, credentials: Dict[str, str]) -> ServiceResponse:
        pass

    @abstractmethod
    def verify_email(self, token: str) -> ServiceResponse:
        pass


class StudentServiceInterface(ABC):
    """Interface for student management service"""

    @abstractmethod
    def enroll_student(self, student_data: Dict[str, Any]) -> ServiceResponse:
        pass

    @abstractmethod
    def get_student_profile(self, student_id: int) -> ServiceResponse:
        pass

    @abstractmethod
    def update_student_progress(
        self, student_id: int, progress_data: Dict[str, Any]
    ) -> ServiceResponse:
        pass

    @abstractmethod
    def get_student_performance(self, student_id: int) -> ServiceResponse:
        pass


class ExamServiceInterface(ABC):
    """Interface for examination service"""

    @abstractmethod
    def create_exam(self, exam_data: Dict[str, Any]) -> ServiceResponse:
        pass

    @abstractmethod
    def submit_marks(self, marks_data: List[Dict[str, Any]]) -> ServiceResponse:
        pass

    @abstractmethod
    def get_exam_results(self, exam_id: int) -> ServiceResponse:
        pass

    @abstractmethod
    def calculate_grades(self, exam_id: int) -> ServiceResponse:
        pass


class NotificationServiceInterface(ABC):
    """Interface for notification service"""

    @abstractmethod
    def send_email(
        self, recipient: str, subject: str, template: str, context: Dict[str, Any]
    ) -> ServiceResponse:
        pass

    @abstractmethod
    def send_sms(self, recipient: str, message: str) -> ServiceResponse:
        pass

    @abstractmethod
    def create_notification(
        self, user_id: int, title: str, message: str, notification_type: str
    ) -> ServiceResponse:
        pass

    @abstractmethod
    def broadcast_notification(
        self, school_id: int, title: str, message: str
    ) -> ServiceResponse:
        pass


class AnalyticsServiceInterface(ABC):
    """Interface for analytics service"""

    @abstractmethod
    def generate_report(
        self, report_type: str, parameters: Dict[str, Any]
    ) -> ServiceResponse:
        pass

    @abstractmethod
    def predict_performance(self, student_id: int, subject_id: int) -> ServiceResponse:
        pass

    @abstractmethod
    def detect_anomalies(self, school_id: int) -> ServiceResponse:
        pass

    @abstractmethod
    def get_insights(self, school_id: int) -> ServiceResponse:
        pass


class AttendanceServiceInterface(ABC):
    """Interface for attendance service"""

    @abstractmethod
    def mark_attendance(self, attendance_data: Dict[str, Any]) -> ServiceResponse:
        pass

    @abstractmethod
    def get_attendance_report(
        self, student_id: int, date_range: Dict[str, str]
    ) -> ServiceResponse:
        pass

    @abstractmethod
    def get_class_attendance(self, class_id: int, date: str) -> ServiceResponse:
        pass


class FinanceServiceInterface(ABC):
    """Interface for finance service"""

    @abstractmethod
    def process_payment(self, payment_data: Dict[str, Any]) -> ServiceResponse:
        pass

    @abstractmethod
    def generate_invoice(self, invoice_data: Dict[str, Any]) -> ServiceResponse:
        pass

    @abstractmethod
    def get_financial_report(self, school_id: int, period: str) -> ServiceResponse:
        pass


# Event definitions for event-driven architecture
@dataclass
class DomainEvent:
    event_type: str
    aggregate_id: str
    event_data: Dict[str, Any]
    timestamp: str
    metadata: Dict[str, Any] = None


class EventPublisher:
    """Event publisher for event-driven communication"""

    @staticmethod
    def publish_event(event: DomainEvent):
        """Publish event to message broker"""
        # In a real implementation, this would publish to Kafka, RabbitMQ, etc.
        print(
            f"Publishing event: {event.event_type} for aggregate {event.aggregate_id}"
        )


class EventSubscriber(ABC):
    """Base class for event subscribers"""

    @abstractmethod
    def handle_event(self, event: DomainEvent):
        pass


# Service registry for service discovery
class ServiceRegistry:
    """Registry for service discovery and health monitoring"""

    _services: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def register_service(cls, service_name: str, service_info: Dict[str, Any]):
        cls._services[service_name] = {
            **service_info,
            "registered_at": str(timezone.now()),
            "status": "healthy",
        }

    @classmethod
    def get_service(cls, service_name: str) -> Optional[Dict[str, Any]]:
        return cls._services.get(service_name)

    @classmethod
    def get_all_services(cls) -> Dict[str, Dict[str, Any]]:
        return cls._services.copy()

    @classmethod
    def update_service_status(cls, service_name: str, status: str):
        if service_name in cls._services:
            cls._services[service_name]["status"] = status
            cls._services[service_name]["last_updated"] = str(timezone.now())


# Circuit breaker pattern for service resilience
class CircuitBreaker:
    """Circuit breaker for service fault tolerance"""

    def __init__(
        self, service_name: str, failure_threshold: int = 5, recovery_timeout: int = 60
    ):
        self.service_name = service_name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open

    def call(self, func, *args, **kwargs):
        if self.state == "open":
            if self._should_attempt_reset():
                self.state = "half-open"
            else:
                raise Exception(f"Service {self.service_name} is currently unavailable")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e

    def _on_success(self):
        self.failure_count = 0
        self.state = "closed"

    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = timezone.now()

        if self.failure_count >= self.failure_threshold:
            self.state = "open"

    def _should_attempt_reset(self) -> bool:
        if not self.last_failure_time:
            return False

        time_since_failure = (timezone.now() - self.last_failure_time).total_seconds()
        return time_since_failure >= self.recovery_timeout
