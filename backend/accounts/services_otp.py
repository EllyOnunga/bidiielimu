import logging
import random
import string
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone

from notifications.services_sms import SMSService

from .models import SMSDevice

logger = logging.getLogger(__name__)


class OTPService:
    @staticmethod
    def generate_otp(user, length=6):
        """
        Generates a numeric OTP and stores it in cache for 5 minutes.
        """
        otp = "".join(random.choices(string.digits, k=length))
        cache_key = f"sms_otp_{user.id}"
        cache.set(cache_key, otp, timeout=300)  # 5 minutes
        return otp

    @staticmethod
    def send_otp(user, phone_number=None, method="SMS"):
        """
        Sends an OTP to the user via the specified method (SMS or EMAIL).
        """
        otp = OTPService.generate_otp(user)

        if method == "SMS":
            return OTPService._send_sms(user, otp, phone_number)
        elif method == "EMAIL":
            return OTPService._send_email(user, otp)
        return False

    @staticmethod
    def _send_sms(user, otp, phone_number=None):
        if not phone_number:
            device = SMSDevice.objects.filter(user=user, confirmed=True).first()
            if not device:
                logger.error(f"No confirmed SMS device for user {user.email}")
                return False
            phone_number = device.phone_number

        message = f"Your ElimuHub verification code is: {otp}. It expires in 5 minutes."
        sms_service = SMSService()
        response = sms_service.send_bulk_sms([phone_number], message)

        if response:
            SMSDevice.objects.filter(user=user, phone_number=phone_number).update(
                last_sent_at=timezone.now()
            )
            return True
        return False

    @staticmethod
    def _send_email(user, otp):
        from django.conf import settings
        from django.core.mail import send_mail
        from django.template.loader import render_to_string

        subject = f"{otp} is your ElimuHub verification code"
        html_message = render_to_string(
            "emails/otp_email.html", {"user": user, "otp": otp}
        )

        try:
            send_mail(
                subject,
                f"Your verification code is: {otp}",
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send OTP email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def verify_otp(user, otp):
        """
        Verifies the provided OTP against the cached one.
        """
        cache_key = f"sms_otp_{user.id}"
        cached_otp = cache.get(cache_key)

        if cached_otp and cached_otp == otp:
            cache.delete(cache_key)
            return True
        return False
