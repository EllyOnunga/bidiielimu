from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, ProcurementLogViewSet

router = DefaultRouter()
router.register(r'items', InventoryItemViewSet)
router.register(r'procurement', ProcurementLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
