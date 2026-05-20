import secrets
import string

from django.contrib.auth import get_user_model
from django.db import connection
from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import Role
from students.models import Guardian

User = get_user_model()


@receiver(post_save, sender=Guardian)
def create_guardian_user(sender, instance, created, **kwargs):
    """
    Automatically creates a PARENT user account when a Guardian is registered
    with an email address, and links it to the Guardian profile.
    """
    if instance.email:
        email = instance.email.strip().lower()
        if not email:
            return

        # Get or create Role object for PARENT
        role_obj, _ = Role.objects.get_or_create(
            name="PARENT", defaults={"description": "Student Parent/Guardian"}
        )

        # Check if a user already exists with this email
        user = User.objects.filter(email__iexact=email).first()

        if not user:
            # Generate a secure temporary password
            alphabet = string.ascii_letters + string.digits
            temp_password = "".join(secrets.choice(alphabet) for _ in range(16))

            # Retrieve active school/tenant
            school = getattr(connection, "tenant", None)

            # Create parent user account
            user = User.objects.create_user(
                email=email,
                password=temp_password,
                first_name=instance.first_name,
                last_name=instance.last_name,
                role=role_obj,
                school=school,
                is_email_verified=True,  # Auto-verify parent accounts added by admins
            )

            # Send welcome email with login credentials
            try:
                from accounts.services import EmailService

                base_url = EmailService._get_frontend_url(user)
                login_url = f"{base_url}/login"
                EmailService.send_welcome_email(
                    user, login_url=login_url, plain_password=temp_password
                )
            except Exception as e:
                print(f"[ERROR] Failed to send parent welcome email: {e}")

        # Link the user to the guardian if not already linked
        if instance.user != user:
            instance.user = user
            # Temporarily disconnect to avoid infinite recursion recursion
            post_save.disconnect(create_guardian_user, sender=Guardian)
            instance.save(update_fields=["user"])
            post_save.connect(create_guardian_user, sender=Guardian)
