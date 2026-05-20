import logging

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class SubscriptionEnforcementMiddleware(MiddlewareMixin):
    """
    Middleware that intercepts requests to check if the tenant's subscription
    is active or within the grace period.
    If locked, restricts access to everything except billing APIs.
    """

    # Endpoints that must remain accessible even if subscription is locked
    ALLOWED_PATHS = [
        "/api/v1/accounts/login/",
        "/api/v1/accounts/token/refresh/",
        "/api/v1/accounts/otp/",
        "/api/v1/schools/billing/",  # Allowing access to billing routes
        "/admin/",
    ]

    def process_request(self, request):
        tenant = getattr(request, "tenant", None)

        # Do not block the public schema (main platform landing page / SaaS admin)
        if not tenant or tenant.schema_name == "public":
            return None

        # Check if the path is whitelisted for locked tenants
        for allowed_path in self.ALLOWED_PATHS:
            if request.path.startswith(allowed_path):
                return None

        # If it's a tenant schema, check their subscription
        if hasattr(tenant, "subscription"):
            subscription = tenant.subscription

            # 1. Hard Lock Check (Grace Period Expiry)
            if subscription.is_locked():
                logger.warning(
                    f"Tenant {tenant.schema_name} accessed locked subscription state."
                )
                return JsonResponse(
                    {
                        "error": "Payment Required",
                        "code": "SUBSCRIPTION_LOCKED",
                        "message": "Your school's subscription has expired and the grace period has ended. Please renew to restore access.",
                    },
                    status=402,
                )

            # 2. Plan-based Feature Restrictions
            if subscription.plan in ["FREE", "STARTER"]:
                # Premium routes that FREE/STARTER cannot access
                restricted_paths = [
                    "/api/v1/hr/",
                    "/api/v1/inventory/",
                    "/api/v1/analytics/",
                    "/api/v1/reports/",
                    "/api/v1/fees/",
                    "/api/v1/discipline/",
                    "/api/v1/lms/",
                    "/api/v1/audit/",
                ]
                for r_path in restricted_paths:
                    if request.path.startswith(r_path):
                        return JsonResponse(
                            {
                                "error": "Upgrade Required",
                                "code": "PREMIUM_FEATURE",
                                "message": "This feature is only available on the Professional plan. Please upgrade your subscription to access it.",
                            },
                            status=403,
                        )

        return None
