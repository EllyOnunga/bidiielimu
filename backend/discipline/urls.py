from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DisciplineIncidentViewSet

router = DefaultRouter()
router.register(r"incidents", DisciplineIncidentViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
