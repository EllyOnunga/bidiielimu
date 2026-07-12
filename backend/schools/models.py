from django.db import models
from django.utils import timezone
from django_tenants.models import DomainMixin, TenantMixin


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return super().update(deleted_at=timezone.now())


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(
            deleted_at__isnull=True
        )


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    def delete(self, using=None, keep_parents=False):
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.deleted_at = None
        self.save()

    class Meta:
        abstract = True


class School(TenantMixin):
    """
    Represents a tenant (School) in the SaaS platform.
    All major entities are linked back to a School instance.
    """

    CURRICULUM_CHOICES = (
        ("CBC", "Kenya CBC"),
        ("844", "Kenya 8-4-4"),
        ("IGCSE_EDEXCEL", "Pearson Edexcel IGCSE"),
        ("IGCSE_CAMBRIDGE", "Cambridge IGCSE"),
    )
    STATUS_CHOICES = (
        ("ACTIVE", "Active"),
        ("INACTIVE", "Inactive"),
        ("SUSPENDED", "Suspended"),
    )

    name = models.CharField(max_length=255)
    curriculum = models.CharField(
        max_length=20, choices=CURRICULUM_CHOICES, default="CBC"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ACTIVE")
    address = models.TextField(null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)
    contact_phone = models.CharField(max_length=20, null=True, blank=True)
    logo = models.ImageField(upload_to="school_logos/", null=True, blank=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    geofence_radius = models.IntegerField(
        default=200, help_text="Radius in meters within which check-in is allowed"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    auto_create_schema = True

    # Citus Distributed Sharding Configuration
    citus_partition_key = "schema_name"

    def __str__(self):
        return self.name


class Domain(DomainMixin):
    pass


class Subscription(models.Model):
    PLAN_CHOICES = (
        ("FREE", "Free Trial"),
        ("STARTER", "Starter"),
        ("PROFESSIONAL", "Professional"),
        ("ENTERPRISE", "Enterprise"),
    )
    STATUS_CHOICES = (
        ("ACTIVE", "Active"),
        ("EXPIRED", "Expired"),
        ("CANCELLED", "Cancelled"),
    )

    school = models.OneToOneField(
        School, on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="STARTER")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="ACTIVE", db_index=True
    )
    start_date = models.DateField(auto_now_add=True)
    expiry_date = models.DateField()
    grace_period_days = models.IntegerField(
        default=7, help_text="Number of days after expiry before hard lockdown"
    )
    stripe_subscription_id = models.CharField(max_length=100, null=True, blank=True)
    mpesa_transaction_reference = models.CharField(
        max_length=100, null=True, blank=True
    )

    # Citus Distributed Sharding Configuration
    citus_partition_key = "school_id"

    def is_locked(self):
        """Returns True if subscription is expired AND past the grace period."""
        if self.status != "ACTIVE":
            return True
        if self.expiry_date < timezone.now().date():
            days_expired = (timezone.now().date() - self.expiry_date).days
            if days_expired > self.grace_period_days:
                return True
        return False

    def __str__(self):
        return f"{self.school.name} - {self.plan}"


class SchoolSetting(models.Model):
    # Academic Settings
    current_term = models.CharField(max_length=50, default="Term 1")
    academic_year = models.CharField(max_length=20, default="2026")

    # Financial Settings
    currency = models.CharField(max_length=10, default="KES")
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    # Notification Settings
    enable_email_notifications = models.BooleanField(default=True)
    enable_sms_notifications = models.BooleanField(default=False)

    # Branding
    principal_name = models.CharField(max_length=100, blank=True, default="")
    school_motto = models.CharField(max_length=255, blank=True, default="")
    accent_color = models.CharField(max_length=20, default="#6366f1")

    def __str__(self):
        return "School Settings"


class MediaAsset(models.Model):
    VISIBILITY_CHOICES = (
        ("PRIVATE", "Private"),
        ("TENANT", "Tenant"),
        ("PUBLIC", "Public"),
    )
    SCAN_STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("CLEAN", "Clean"),
        ("INFECTED", "Infected"),
        ("FAILED", "Failed"),
        ("SKIPPED", "Skipped"),
    )

    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="media_assets",
        null=True,
        blank=True,
    )
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="media_assets",
        null=True,
        blank=True,
    )
    storage_key = models.CharField(max_length=500, unique=True)
    original_filename = models.CharField(max_length=255)
    content_type = models.CharField(max_length=120)
    size_bytes = models.BigIntegerField()
    checksum_sha256 = models.CharField(max_length=64, blank=True, default="")
    visibility = models.CharField(
        max_length=20, choices=VISIBILITY_CHOICES, default="PRIVATE"
    )
    scan_status = models.CharField(
        max_length=20, choices=SCAN_STATUS_CHOICES, default="PENDING"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["school", "visibility"]),
            models.Index(fields=["scan_status", "created_at"]),
            models.Index(fields=["content_type"]),
        ]

    def __str__(self):
        return self.original_filename


# Blog models moved to dedicated blog app
