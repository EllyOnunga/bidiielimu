from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import FeePaymentViewSet, FeeStructureViewSet

router = DefaultRouter()
router.register(r"structures", FeeStructureViewSet, basename="feestructure")
router.register(r"payments", FeePaymentViewSet, basename="feepayment")

urlpatterns = [
    path("", include(router.urls)),
]
