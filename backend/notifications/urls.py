from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    NoticeViewSet,
    NotificationViewSet,
    PTMMeetingViewSet,
    SchoolEventViewSet,
)

router = DefaultRouter()
router.register(r"notices", NoticeViewSet, basename="notice")
router.register(r"events", SchoolEventViewSet, basename="schoolevent")
router.register(r"ptm", PTMMeetingViewSet, basename="ptmmeeting")
router.register(r"", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
]
