from django.db import models
from django.utils import timezone

class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return super().update(deleted_at=timezone.now())

class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(deleted_at__isnull=True)

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


class School(models.Model):
    """
    Represents a tenant (School) in the SaaS platform.
    All major entities are linked back to a School instance.
    """
    name = models.CharField(max_length=255)
    address = models.TextField(null=True, blank=True)
    contact_email = models.EmailField(null=True, blank=True)
    contact_phone = models.CharField(max_length=20, null=True, blank=True)
    logo = models.ImageField(upload_to='school_logos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Subscription(models.Model):
    PLAN_CHOICES = (
        ('BASIC', 'Basic'),
        ('PREMIUM', 'Premium'),
        ('ENTERPRISE', 'Enterprise'),
    )
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    )

    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='subscription')
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='BASIC')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE', db_index=True)
    start_date = models.DateField(auto_now_add=True)
    expiry_date = models.DateField()

    def __str__(self):
        return f"{self.school.name} - {self.plan}"

class SchoolSetting(models.Model):
    school = models.OneToOneField(School, on_delete=models.CASCADE, related_name='settings')
    
    # Academic Settings
    current_term = models.CharField(max_length=50, default='Term 1')
    academic_year = models.CharField(max_length=20, default='2026')
    
    # Financial Settings
    currency = models.CharField(max_length=10, default='KES')
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    # Notification Settings
    enable_email_notifications = models.BooleanField(default=True)
    enable_sms_notifications = models.BooleanField(default=False)
    
    # Branding
    principal_name = models.CharField(max_length=100, blank=True, default='')
    school_motto = models.CharField(max_length=255, blank=True, default='')
    accent_color = models.CharField(max_length=20, default='#6366f1')
    
    def __str__(self):
        return f"Settings for {self.school.name}"

