from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, ProcurementLogViewSet, BookIssueViewSet

router = DefaultRouter()
router.register(r'items', InventoryItemViewSet, basename='inventoryitem')
router.register(r'procurement', ProcurementLogViewSet, basename='procurementlog')
router.register(r'book-issues', BookIssueViewSet, basename='bookissue')

urlpatterns = [
    path('', include(router.urls)),
]
