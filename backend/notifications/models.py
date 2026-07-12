from django.conf import settings
from django.db import models
from django.utils import timezone

# Per-plan monthly limits for SMS and email communications
PLAN_LIMITS = {
    "FREE": {"sms": 500, "email": 1_000},
    "STARTER": {"sms": 5_000, "email": 10_000},
    "PROFESSIONAL": {"sms": 20_000, "email": 50_000},
    "ENTERPRISE": {"sms": 100_000, "email": 200_000},
}


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ("info", "Information"),
        ("success", "Success"),
        ("warning", "Warning"),
        ("error", "Error"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPES, default="info"
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} - {self.title}"


class Notice(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    target_audience = models.CharField(
        max_length=50, default="ALL"
    )  # ALL, TEACHERS, PARENTS
    is_published = models.BooleanField(default=True)
    published_at = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField(null=True, blank=True)


class SchoolEvent(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=255, null=True, blank=True)
    is_holiday = models.BooleanField(default=False)


class PTMMeeting(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("CONFIRMED", "Confirmed"),
        ("CANCELLED", "Cancelled"),
    )
    teacher = models.ForeignKey("teachers.Teacher", on_delete=models.CASCADE)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE)
    guardian = models.ForeignKey("students.Guardian", on_delete=models.CASCADE)
    scheduled_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    agenda = models.TextField(null=True, blank=True)


class CommunicationUsage(models.Model):
    """Tracks monthly SMS and email usage per school (tenant)."""

    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="communication_usage",
    )
    # Stored as YYYY-MM string, e.g. "2026-05"
    billing_month = models.CharField(max_length=7, db_index=True)
    sms_sent = models.PositiveIntegerField(default=0)
    email_sent = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("school", "billing_month")
        verbose_name = "Communication Usage"
        verbose_name_plural = "Communication Usages"

    def __str__(self):
        return f"{self.school} — {self.billing_month} (SMS: {self.sms_sent}, Email: {self.email_sent})"

    @classmethod
    def current_month_key(cls):
        return timezone.now().strftime("%Y-%m")

    @classmethod
    def get_or_create_for_school(cls, school):
        """Return (instance, created) for the current billing month."""
        obj, created = cls.objects.get_or_create(
            school=school,
            billing_month=cls.current_month_key(),
        )
        return obj, created
