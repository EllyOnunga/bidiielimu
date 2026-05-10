from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (NoticeViewSet, NotificationViewSet, PTMMeetingViewSet,
                    SchoolEventViewSet)

router = DefaultRouter()
router.register(r"", NotificationViewSet, basename="notification")
router.register(r"notices", NoticeViewSet)
router.register(r"events", SchoolEventViewSet)
router.register(r"ptm", PTMMeetingViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
