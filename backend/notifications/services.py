import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

class CommunicationService:
    @staticmethod
    def send_email(subject, message, recipient_list):
        """
        Sends an email using Django's core mail system.
        """
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                recipient_list,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    @staticmethod
    def send_sms(phone_number, message):
        """
        Mock SMS sending logic. 
        In production, integrate with AfricasTalking, Twilio, etc.
        """
        try:
            # Simulate network latency
            logger.info(f"Sending SMS to {phone_number}: {message}")
            # Real integration would go here:
            # client = AfricasTalkingSMS(api_key, username)
            # client.send(message, [phone_number])
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return False

    @staticmethod
    def notify_user(notification):
        """
        Checks notification preferences and sends external alerts if needed.
        """
        # For now, we'll just log that a system notification was created
        # In a real app, you might check user.settings.wants_sms
        pass
