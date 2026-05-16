from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (LeaveRequestViewSet, PayrollRecordViewSet,
                    StaffProfileViewSet)

router = DefaultRouter()
router.register(r"staff", StaffProfileViewSet, basename="staff")
router.register(r"payroll", PayrollRecordViewSet, basename="payroll")
router.register(r"leave", LeaveRequestViewSet, basename="leave")

urlpatterns = [
    path("", include(router.urls)),
]
