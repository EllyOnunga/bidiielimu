from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NoticeViewSet, SchoolEventViewSet, PTMMeetingViewSet

router = DefaultRouter()
router.register(r'list', NotificationViewSet)
router.register(r'notices', NoticeViewSet)
router.register(r'events', SchoolEventViewSet)
router.register(r'ptm', PTMMeetingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
