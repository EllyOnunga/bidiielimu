from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, views
from rest_framework.response import Response

from config.tenant_security import StrictTenantPermission

from .models import School, Subscription
from .services_billing import SaaSBillingService


class SubscriptionDetailView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get(self, request):
        tenant = getattr(request, "tenant", None)
        if not tenant or tenant.schema_name == "public":
            return Response(
                {"error": "No subscription found for public schema"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscription = getattr(tenant, "subscription", None)
        if not subscription:
            return Response(
                {"error": "Subscription not found"}, status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "plan": subscription.plan,
                "status": subscription.status,
                "start_date": subscription.start_date,
                "expiry_date": subscription.expiry_date,
                "is_locked": subscription.is_locked(),
                "grace_period_days": subscription.grace_period_days,
                "mpesa_transaction_reference": subscription.mpesa_transaction_reference,
            }
        )


class InitiateSaaSPaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def post(self, request):
        tenant = getattr(request, "tenant", None)
        if not tenant or tenant.schema_name == "public":
            return Response(
                {"error": "Cannot pay for public schema"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only allow Admins to upgrade subscription
        if (
            getattr(request.user, "role_name", "") != "ADMIN"
            and not request.user.is_superuser
        ):
            return Response(
                {"error": "Only school administrators can renew subscriptions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        phone = request.data.get("phone")
        plan = request.data.get("plan")

        if not phone or not plan:
            return Response(
                {"error": "Phone number and Plan are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if plan not in SaaSBillingService.PLAN_PRICES:
            return Response(
                {
                    "error": f"Invalid plan. Must be one of {list(SaaSBillingService.PLAN_PRICES.keys())}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            response = SaaSBillingService.initiate_subscription_payment(
                tenant, plan, phone
            )

            # If Daraja keys are missing in dev environment, MpesaService returns a mock response string
            if isinstance(response, str) and "mock" in response.lower():
                return Response({"detail": response}, status=status.HTTP_200_OK)

            return Response(
                {
                    "detail": "STK Push sent successfully. Check your phone.",
                    "checkout_request_id": response.get("CheckoutRequestID"),
                }
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
