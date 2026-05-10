import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import EmailVerificationToken, User

class EmailService:
    @staticmethod
    def send_verification_email(user):
        """Send email verification link to user"""
        # Generate token
        alphabet = string.ascii_letters + string.digits
        token = ''.join(secrets.choice(alphabet) for _ in range(64))
        
        # Create or update token
        from django.utils import timezone
        from datetime import timedelta

        verification_token, created = EmailVerificationToken.objects.get_or_create(
            user=user,
            defaults={
                'token': token,
                'expires_at': timezone.now() + timedelta(hours=24)
            }
        )
        if not created:
            verification_token.token = token
            verification_token.expires_at = timezone.now() + timedelta(hours=24)
            verification_token.save()
        
        # Send email
        subject = 'Verify Your Email - ElimuHub'
        verification_url = f"{settings.FRONTEND_URL}/verify-email/{token}"
        
        html_message = render_to_string('emails/verify_email.html', {
            'user': user,
            'verification_url': verification_url,
        })
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
            print(f"Failed to send verification email: {e}")
            return False

    @staticmethod
    def send_welcome_email(user, login_url, plain_password=None):
        """Send a welcome email with credentials/links"""
        subject = 'Welcome to ElimuHub!'
        
        html_message = render_to_string('emails/welcome_email.html', {
            'user': user,
            'login_url': login_url,
            'plain_password': plain_password,
        })
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
            print(f"Failed to send welcome email: {e}")
            return False