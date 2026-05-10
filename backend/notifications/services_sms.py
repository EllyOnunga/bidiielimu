import os

import africastalking
from django.conf import settings


class SMSService:
    def __init__(self):
        self.username = settings.AT_USERNAME
        self.api_key = settings.AT_API_KEY
        africastalking.initialize(self.username, self.api_key)
        self.sms = africastalking.SMS

    def send_bulk_sms(self, phone_numbers, message):
        """
        Sends a message to multiple phone numbers.
        phone_numbers: List of strings (e.g. ['+254711...'])
        """
        try:
            response = self.sms.send(message, phone_numbers)
            return response
        except Exception as e:
            print(f"SMS Broadcast failed: {str(e)}")
            return None

    @staticmethod
    def broadcast_to_parents(message):
        from students.models import Guardian

        guardians = Guardian.objects.all().values_list("phone_number", flat=True)
        phone_numbers = list(set(guardians))  # Unique numbers

        service = SMSService()
        return service.send_bulk_sms(phone_numbers, message)
