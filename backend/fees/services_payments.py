import base64
import logging
from datetime import datetime

import requests
from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django_tenants.utils import schema_context

logger = logging.getLogger(__name__)


class MpesaService:
    CONSUMER_KEY = settings.MPESA_CONSUMER_KEY
    CONSUMER_SECRET = settings.MPESA_CONSUMER_SECRET
    SHORTCODE = settings.MPESA_SHORTCODE
    PASSKEY = settings.MPESA_PASSKEY
    BASE_URL = (
        "https://sandbox.safaricom.co.ke"
        if settings.DEBUG
        else "https://api.safaricom.co.ke"
    )

    @staticmethod
    def get_access_token():
        # Try to retrieve token from cache
        token = cache.get("mpesa_access_token")
        if token:
            return token

        url = f"{MpesaService.BASE_URL}/oauth/v1/generate?grant_type=client_credentials"
        try:
            response = requests.get(
                url,
                auth=(MpesaService.CONSUMER_KEY, MpesaService.CONSUMER_SECRET),
                timeout=10,
            )
            response.raise_for_status()
            access_token = response.json().get("access_token")
            if access_token:
                # Cache token for 55 minutes (3300 seconds)
                cache.set("mpesa_access_token", access_token, timeout=3300)
                return access_token
        except Exception as e:
            logger.error(f"Error fetching M-Pesa token: {e}")
        return None

    @staticmethod
    def initiate_stk_push(phone, amount, invoice_id=None, student_id=None):
        access_token = MpesaService.get_access_token()
        if not access_token:
            return {
                "ResponseCode": "1",
                "ResponseDescription": "Failed to authenticate with Safaricom.",
            }

        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(
            f"{MpesaService.SHORTCODE}{MpesaService.PASSKEY}{timestamp}".encode()
        ).decode()

        # Clean phone number to Safaricom standard (2547XXXXXXXX)
        cleaned_phone = phone.strip().replace("+", "")
        if cleaned_phone.startswith("0"):
            cleaned_phone = "254" + cleaned_phone[1:]
        elif cleaned_phone.startswith("7") or cleaned_phone.startswith("1"):
            cleaned_phone = "254" + cleaned_phone

        payload = {
            "BusinessShortCode": MpesaService.SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(amount),
            "PartyA": cleaned_phone,
            "PartyB": MpesaService.SHORTCODE,
            "PhoneNumber": cleaned_phone,
            "CallBackURL": settings.MPESA_CALLBACK_URL,
            "AccountReference": f"INV-{invoice_id or student_id or 'FEE'}",
            "TransactionDesc": "School Fees Payment",
        }

        headers = {"Authorization": f"Bearer {access_token}"}
        url = f"{MpesaService.BASE_URL}/mpesa/stkpush/v1/processrequest"

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            res_data = response.json()

            # If initiation succeeded, cache checkout context
            if res_data.get("ResponseCode") == "0":
                checkout_request_id = res_data.get("CheckoutRequestID")
                if checkout_request_id:
                    cache.set(
                        f"mpesa_stk_{checkout_request_id}",
                        {
                            "student_id": student_id,
                            "invoice_id": invoice_id,
                            "amount": amount,
                            "schema_name": connection.schema_name,
                        },
                        timeout=3600,
                    )
            return res_data
        except Exception as e:
            logger.error(f"Error initiating M-Pesa STK Push: {e}")
            return {"ResponseCode": "1", "ResponseDescription": str(e)}

    @staticmethod
    def handle_webhook(data):
        """
        Processes the M-Pesa Safaricom callback payload.
        Resolves schema name context, maps receipt data, creates FeePayment, and updates invoices.
        """
        logger.info(f"Received M-Pesa Callback Payload: {data}")
        body = data.get("Body", {})
        stk_callback = body.get("stkCallback", {})
        result_code = stk_callback.get("ResultCode")
        checkout_request_id = stk_callback.get("CheckoutRequestID")

        if not checkout_request_id:
            return False

        # Retrieve initiation context from Redis cache
        context = cache.get(f"mpesa_stk_{checkout_request_id}")
        if not context:
            logger.warning(
                f"No cached context found for checkout request ID: {checkout_request_id}"
            )
            return False

        schema_name = context.get("schema_name")
        if not schema_name:
            logger.error(
                f"No schema context stored for checkout request ID: {checkout_request_id}"
            )
            return False

        # Execute inside the tenant schema context
        with schema_context(schema_name):
            from students.models import Student

            from .models import FeePayment, Invoice

            if result_code != 0:
                logger.warning(
                    f"M-Pesa payment failed with ResultCode {result_code}: {stk_callback.get('ResultDesc')}"
                )
                return False

            # Extract Safaricom callback metadata
            metadata = stk_callback.get("CallbackMetadata", {}).get("Item", [])
            metadata_dict = {
                item.get("Name"): item.get("Value")
                for item in metadata
                if "Name" in item
            }

            mpesa_receipt = metadata_dict.get("MpesaReceiptNumber")
            amount = metadata_dict.get("Amount", context.get("amount"))
            phone_number = metadata_dict.get("PhoneNumber")

            if not mpesa_receipt:
                logger.error(
                    "No MpesaReceiptNumber found in Safaricom successful metadata."
                )
                return False

            student_id = context.get("student_id")
            invoice_id = context.get("invoice_id")

            # --- SaaS Subscription Hook ---
            if str(invoice_id).startswith("SAAS-"):
                # invoice_id format: SAAS-{school_id}-{plan}
                from schools.services_billing import SaaSBillingService

                parts = str(invoice_id).split("-")
                if len(parts) >= 3:
                    school_id = int(parts[1])
                    plan = parts[2]
                    return SaaSBillingService.process_saas_webhook(
                        school_id, plan, mpesa_receipt
                    )

            # --- Normal Student Fee Hook ---
            try:
                student = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                logger.error(
                    f"Student ID {student_id} not found under schema {schema_name}"
                )
                return False

            invoice = None
            if invoice_id:
                try:
                    invoice = Invoice.objects.get(id=invoice_id)
                except Invoice.DoesNotExist:
                    logger.warning(
                        f"Invoice ID {invoice_id} not found under schema {schema_name}"
                    )

            # Check if this transaction has already been recorded to prevent duplicates
            if FeePayment.objects.filter(transaction_id=mpesa_receipt).exists():
                logger.warning(
                    f"Transaction ID {mpesa_receipt} has already been processed."
                )
                return True

            # Record the FeePayment successfully
            payment = FeePayment.objects.create(
                student=student,
                invoice=invoice,
                amount=amount,
                payment_method="MPESA",
                transaction_id=mpesa_receipt,
                is_confirmed=True,
                notes=f"Confirmed via Safaricom M-Pesa callback for phone {phone_number}. CheckoutRequestID: {checkout_request_id}",
            )

            # If linked to an invoice, update the paid amount
            if invoice:
                invoice.paid_amount = float(invoice.paid_amount) + float(amount)
                invoice.save()

            logger.info(
                f"Successfully processed payment of {amount} for student {student} via M-Pesa receipt {mpesa_receipt}"
            )
            return True


class StripeService:
    @staticmethod
    def create_payment_intent(amount, currency="usd", student_id=None):
        # Placeholder for Stripe logic
        # import stripe
        # stripe.api_key = settings.STRIPE_SECRET_KEY
        print(f"Creating Stripe intent for {amount} {currency}")
        return {"client_secret": "mock_stripe_secret"}


class PaymentGatewayService:
    @staticmethod
    def process_online_payment(method, **kwargs):
        if method == "MPESA":
            return MpesaService.initiate_stk_push(
                phone=kwargs.get("phone"),
                amount=kwargs.get("amount"),
                invoice_id=kwargs.get("invoice_id"),
                student_id=kwargs.get("student_id"),
            )
        elif method == "STRIPE":
            return StripeService.create_payment_intent(
                amount=kwargs.get("amount"), currency=kwargs.get("currency", "usd")
            )
        return None
