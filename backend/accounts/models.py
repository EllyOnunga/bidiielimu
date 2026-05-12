from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.db import models
from django_otp.models import Device


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)

        # If is_email_verified is not explicitly passed as False (e.g., self-registration),
        # default to True so internally provisioned accounts (Teachers, Students) can log in immediately.
        is_email_verified = extra_fields.pop("is_email_verified", True)

        user = self.model(
            email=email, is_email_verified=is_email_verified, **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)

        # Automatically create verified EmailAddress for allauth if verified
        if is_email_verified:
            try:
                from allauth.account.models import EmailAddress

                EmailAddress.objects.get_or_create(
                    user=user,
                    email=user.email,
                    defaults={"primary": True, "verified": True},
                )
            except Exception:
                pass  # Fails gracefully if allauth tables aren't fully migrated yet

        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        # Ensure the SUPER_ADMIN role exists and assign it
        from .models import Role

        role, _ = Role.objects.get_or_create(name="SUPER_ADMIN")
        extra_fields.setdefault("role", role)

        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    """
    Dynamic roles and permissions stored in JSONB.
    """

    name = models.CharField(max_length=50, unique=True)
    permissions = models.JSONField(
        default=dict,
        help_text="JSON object mapping permissions to boolean values or structures.",
    )
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    ROLES = (
        ("SUPER_ADMIN", "Platform Super Admin"),
        ("ADMIN", "School Admin"),
        ("PRINCIPAL", "Principal"),
        ("HOD", "Head of Department"),
        ("TEACHER", "Teacher"),
        ("LIBRARIAN", "Librarian"),
        ("FINANCE", "Finance / Bursar"),
        ("STUDENT", "Student"),
        ("PARENT", "Parent"),
    )

    username = None
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)
    role = models.ForeignKey(
        Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )
    role_old = models.CharField(
        max_length=20, choices=ROLES, default="ADMIN", null=True, blank=True
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    phone_regex = RegexValidator(
        regex=r"^\+?1?\d{9,15}$",
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
    )
    phone_number = models.CharField(
        validators=[phone_regex], max_length=17, null=True, blank=True
    )

    # Social profile fields
    profile_picture_url = models.URLField(null=True, blank=True)
    github_username = models.CharField(max_length=100, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    job_title = models.CharField(max_length=100, null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role", "is_email_verified"]),
            models.Index(fields=["school", "role"]),
            models.Index(fields=["is_active", "is_email_verified"]),
        ]

    def __str__(self):
        return f"{self.email} ({self.role.name if self.role else 'No Role'})"

    @property
    def is_admin(self):
        return self.role.name in ["ADMIN", "SUPER_ADMIN"] if self.role else False

    @property
    def is_teacher(self):
        return self.role.name == "TEACHER" if self.role else False

    @property
    def is_student(self):
        return self.role.name == "STUDENT" if self.role else False

    def has_role(self, role_name):
        return self.role.name == role_name if self.role else False

    @property
    def role_name(self):
        return self.role.name if self.role else self.role_old


class EmailVerificationToken(models.Model):
    """
    Model for storing email verification tokens for new users.
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="email_verification"
    )
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Verification token for {self.user.email}"

    @property
    def is_expired(self):
        from django.utils import timezone

        return timezone.now() > self.expires_at

    def save(self, *args, **kwargs):
        if not self.expires_at:
            from datetime import timedelta

            from django.utils import timezone

            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)


class SMSDevice(Device):
    """
    A custom device for SMS-based Two-Factor Authentication.
    """

    phone_number = models.CharField(
        max_length=17,
        help_text="The verified phone number to send the OTP to.",
    )
    last_sent_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"SMS Device for {self.user.email} ({self.phone_number})"

    class Meta:
        verbose_name = "SMS Device"
        verbose_name_plural = "SMS Devices"
