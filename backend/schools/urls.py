from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SchoolViewSet, SubscriptionViewSet
from .views_billing import InitiateSaaSPaymentView, SubscriptionDetailView

router = DefaultRouter()
router.register(r"", SchoolViewSet, basename="school")
router.register(r"subscriptions", SubscriptionViewSet, basename="subscription")

urlpatterns = [
    path(
        "dashboard_stats/",
        SchoolViewSet.as_view({"get": "dashboard_stats"}),
        name="school-dashboard-stats",
    ),
    path(
        "super_admin_stats/",
        SchoolViewSet.as_view({"get": "super_admin_stats"}),
        name="school-super-admin-stats",
    ),
    path(
        "billing/subscription/",
        SubscriptionDetailView.as_view(),
        name="subscription_detail",
    ),
    path("billing/pay/", InitiateSaaSPaymentView.as_view(), name="subscription_pay"),
    path("", include(router.urls)),
]
