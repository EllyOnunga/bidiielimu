import secrets
import string

from django.conf import settings
from django.db import models


class APIKey(models.Model):
    """
    API Key model for third-party integrations
    """

    KEY_TYPES = (
        ("READ", "Read Only"),
        ("WRITE", "Read Write"),
        ("ADMIN", "Full Access"),
    )

    name = models.CharField(max_length=100, help_text="Name for this API key")
    key = models.CharField(max_length=64, unique=True, editable=False)
    key_type = models.CharField(max_length=10, choices=KEY_TYPES, default="READ")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="api_keys"
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="api_keys",
        null=True,
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    rate_limit_requests = models.IntegerField(
        default=1000, help_text="Requests per hour"
    )
    rate_limit_burst = models.IntegerField(default=100, help_text="Burst requests")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["key"]),
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["school", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.key_type})"

    def save(self, *args, **kwargs):
        if not self.key:
            # Generate a secure API key
            alphabet = string.ascii_letters + string.digits
            self.key = "".join(secrets.choice(alphabet) for _ in range(32))
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        if self.expires_at:
            from django.utils import timezone

            return timezone.now() > self.expires_at
        return False

    def can_access(self, permission_required):
        """
        Check if this API key has the required permission
        """
        permissions = {
            "READ": ["read"],
            "WRITE": ["read", "write"],
            "ADMIN": ["read", "write", "admin"],
        }
        return permission_required in permissions.get(self.key_type, [])
