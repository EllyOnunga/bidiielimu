import logging

from django.utils import timezone

from fees.services_payments import MpesaService

from .models import School, Subscription

logger = logging.getLogger(__name__)


class SaaSBillingService:
    PLAN_PRICES = {
        "FREE": 0,
        "STARTER": 3500,  # KES per month
        "PROFESSIONAL": 9500,
        "ENTERPRISE": 0,  # Custom billing handled offline
    }

    @staticmethod
    def initiate_subscription_payment(school: School, plan: str, phone: str):
        """
        Initiates an M-Pesa STK Push for a school's SaaS subscription renewal.
        """
        if plan not in SaaSBillingService.PLAN_PRICES:
            raise ValueError(f"Invalid plan: {plan}")

        amount = SaaSBillingService.PLAN_PRICES[plan]

        # We reuse the MpesaService but route it for SaaS Subscription using an invoice_id prefix
        # This allows the webhook to distinguish SaaS payments from Student Fee payments
        invoice_ref = f"SAAS-{school.id}-{plan}"

        logger.info(
            f"Initiating SaaS STK Push for {school.name} ({plan}) - {amount} KES"
        )

        response = MpesaService.initiate_stk_push(
            phone=phone, amount=amount, invoice_id=invoice_ref, student_id=None
        )

        return response

    @staticmethod
    def process_saas_webhook(school_id: int, plan: str, receipt_number: str):
        """
        Processes a successful Safaricom callback for a SaaS subscription.
        Upgrades the tenant's subscription immediately.
        """
        try:
            school = School.objects.get(id=school_id)
            subscription, created = Subscription.objects.get_or_create(
                school=school,
                defaults={
                    "plan": plan,
                    "expiry_date": timezone.now().date() + timezone.timedelta(days=30),
                },
            )

            # Upgrade or renew
            subscription.plan = plan
            subscription.status = "ACTIVE"
            subscription.mpesa_transaction_reference = receipt_number

            # Extend by 30 days
            if subscription.expiry_date < timezone.now().date():
                subscription.expiry_date = timezone.now().date() + timezone.timedelta(
                    days=30
                )
            else:
                subscription.expiry_date += timezone.timedelta(days=30)

            subscription.save()
            logger.info(
                f"Successfully renewed SaaS Subscription for {school.name}. Plan: {plan}. Ref: {receipt_number}"
            )
            return True
        except School.DoesNotExist:
            logger.error(f"SaaS Webhook failed. School ID {school_id} not found.")
            return False
