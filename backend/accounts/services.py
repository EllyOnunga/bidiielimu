import logging
import secrets
import string

from django.conf import settings

logger = logging.getLogger(__name__)
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from .models import EmailVerificationToken


class EmailService:
    @staticmethod
    def _get_frontend_url(user):
        """Helper to get the correct frontend base URL for a user's school"""
        if user.school:
            domain = user.school.domains.filter(is_primary=True).first()
            if domain:
                protocol = "http" if "localhost" in domain.domain else "https"
                # Keep link directly on port 80/443 without React dev port 5173
                return f"{protocol}://{domain.domain}"

        return settings.FRONTEND_URL

    @staticmethod
    def send_verification_email(user):
        """Send email verification link to user"""
        # Generate token
        alphabet = string.ascii_letters + string.digits
        token = "".join(secrets.choice(alphabet) for _ in range(64))

        # Create or update token
        from datetime import timedelta

        from django.utils import timezone

        verification_token, created = EmailVerificationToken.objects.get_or_create(
            user=user,
            defaults={
                "token": token,
                "expires_at": timezone.now() + timedelta(hours=24),
            },
        )
        if not created:
            verification_token.token = token
            verification_token.expires_at = timezone.now() + timedelta(hours=24)
            verification_token.save()

        # Send email
        subject = "Verify Your Email - GilaniOS"
        base_url = EmailService._get_frontend_url(user)
        verification_url = f"{base_url}/verify-email/{token}"

        html_message = render_to_string(
            "emails/verify_email.html",
            {
                "user": user,
                "verification_url": verification_url,
            },
        )
        plain_message = strip_tags(html_message)

        try:
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.exception("Failed to send verification email: %s", str(e))
            return False

    @staticmethod
    def send_welcome_email(user, login_url, plain_password=None):
        """Send a welcome email with credentials/links"""
        subject = "Welcome to GilaniOS!"

        html_message = render_to_string(
            "emails/welcome_email.html",
            {
                "user": user,
                "login_url": login_url,
                "plain_password": plain_password,
            },
        )
        plain_message = strip_tags(html_message)

        try:
            send_mail(
                subject,
                plain_message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.exception("Failed to send welcome email: %s", str(e))
            return False
