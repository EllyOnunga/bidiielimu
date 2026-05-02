from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffProfileViewSet, PayrollRecordViewSet, LeaveRequestViewSet

router = DefaultRouter()
router.register(r'staff', StaffProfileViewSet)
router.register(r'payroll', PayrollRecordViewSet)
router.register(r'leave', LeaveRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
