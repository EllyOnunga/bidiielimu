from django.conf import settings
from django.db import models

from schools.models import SoftDeleteModel


class DisciplineIncident(SoftDeleteModel):
    CATEGORY_CHOICES = (
        ("MINOR", "Minor"),
        ("MAJOR", "Major"),
        ("SEVERE", "Severe"),
    )

    STATUS_CHOICES = (
        ("PENDING", "Pending Investigation"),
        ("RESOLVED", "Resolved"),
        ("APPEALED", "Appealed"),
        ("CANCELLED", "Cancelled"),
    )

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="discipline_incidents",
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reported_incidents",
    )
    date = models.DateField()
    category = models.CharField(
        max_length=10, choices=CATEGORY_CHOICES, default="MINOR"
    )
    summary = models.CharField(max_length=255)
    description = models.TextField()
    action_taken = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="PENDING")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.student.full_name} - {self.summary} ({self.date})"
