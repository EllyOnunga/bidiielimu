import hashlib
import secrets

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
    key_prefix = models.CharField(max_length=16, blank=True, db_index=True)
    key_hash = models.CharField(max_length=64, unique=True, null=True, blank=True)
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
    is_legacy = models.BooleanField(default=False, help_text="Flag to mark legacy plaintext keys that need rotation")
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
            models.Index(fields=["key_prefix"]),
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["school", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.key_type})"

    @staticmethod
    def hash_key(raw_key):
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    @classmethod
    def generate_secret(cls):
        return f"eh_live_{secrets.token_urlsafe(32)}"

    def set_key(self, raw_key):
        hashed = self.hash_key(raw_key)
        self.key = hashed
        self.key_hash = hashed
        self.key_prefix = raw_key[:16]
        self._plain_key = raw_key

    def rotate_key(self):
        raw_key = self.generate_secret()
        self.set_key(raw_key)
        return raw_key

    def save(self, *args, **kwargs):
        if not self.key_hash:
            if self.key:
                # Backfill legacy raw keys into hashed storage on the next save.
                raw_key = self.key
                self.key_hash = self.hash_key(raw_key)
                self.key = self.key_hash
                self.key_prefix = raw_key[:16]
                self.is_legacy = True
            else:
                self.rotate_key()
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
