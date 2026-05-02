import requests
import base64
from datetime import datetime
from django.conf import settings
from .models import FeePayment

class MpesaService:
    CONSUMER_KEY = "YOUR_CONSUMER_KEY"
    CONSUMER_SECRET = "YOUR_CONSUMER_SECRET"
    SHORTCODE = "174379"
    PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    BASE_URL = "https://sandbox.safaricom.co.ke"

    @staticmethod
    def get_access_token():
        url = f"{MpesaService.BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(url, auth=(MpesaService.CONSUMER_KEY, MpesaService.CONSUMER_SECRET))
        return response.json().get('access_token')

    @staticmethod
    def initiate_stk_push(phone, amount, invoice_id):
        access_token = MpesaService.get_access_token()
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(f"{MpesaService.SHORTCODE}{MpesaService.PASSKEY}{timestamp}".encode()).decode()

        payload = {
            "BusinessShortCode": MpesaService.SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": phone,
            "PartyB": MpesaService.SHORTCODE,
            "PhoneNumber": phone,
            "CallBackURL": "https://yourdomain.com/api/v1/fees/mpesa-webhook/",
            "AccountReference": f"INV-{invoice_id}",
            "TransactionDesc": "School Fees Payment"
        }

        headers = {"Authorization": f"Bearer {access_token}"}
        url = f"{MpesaService.BASE_URL}/mpesa/stkpush/v1/processrequest"
        
        response = requests.post(url, json=payload, headers=headers)
        return response.json()


    @staticmethod
    def handle_webhook(data):
        # Logic to process Safaricom callback
        # Verify transaction and update FeePayment status
        pass

class StripeService:
    @staticmethod
    def create_payment_intent(amount, currency='usd', student_id=None):
        # Placeholder for Stripe logic
        # import stripe
        # stripe.api_key = settings.STRIPE_SECRET_KEY
        print(f"Creating Stripe intent for {amount} {currency}")
        return {"client_secret": "mock_stripe_secret"}

class PaymentGatewayService:
    @staticmethod
    def process_online_payment(method, **kwargs):
        if method == 'MPESA':
            return MpesaService.initiate_stk_push(
                phone=kwargs.get('phone'),
                amount=kwargs.get('amount'),
                invoice_id=kwargs.get('invoice_id')
            )
        elif method == 'STRIPE':
            return StripeService.create_payment_intent(
                amount=kwargs.get('amount'),
                currency=kwargs.get('currency', 'usd')
            )
        return None
