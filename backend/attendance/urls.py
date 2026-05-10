from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DailyAttendanceViewSet

router = DefaultRouter()
router.register(r"daily", DailyAttendanceViewSet, basename="dailyattendance")

urlpatterns = [
    path("", include(router.urls)),
]
