from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffProfileViewSet, PayrollRecordViewSet, LeaveRequestViewSet

router = DefaultRouter()
router.register(r'staff', StaffProfileViewSet, basename='staff')
router.register(r'payroll', PayrollRecordViewSet, basename='payroll')
router.register(r'leave', LeaveRequestViewSet, basename='leave')

urlpatterns = [
    path('', include(router.urls)),
]
