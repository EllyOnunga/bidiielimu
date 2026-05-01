from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchoolViewSet, SubscriptionViewSet

router = DefaultRouter()
router.register(r'', SchoolViewSet, basename='school')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]
