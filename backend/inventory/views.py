from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import InventoryItem, ProcurementLog
from .serializers import InventoryItemSerializer, ProcurementLogSerializer

INVENTORY_ALLOWED_ROLES = ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL', 'LIBRARIAN']

class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role not in INVENTORY_ALLOWED_ROLES:
            raise PermissionDenied("You do not have permission to access inventory records.")
        return InventoryItem.objects.all()

class ProcurementLogViewSet(viewsets.ModelViewSet):
    serializer_class = ProcurementLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role not in INVENTORY_ALLOWED_ROLES:
            raise PermissionDenied("You do not have permission to access procurement logs.")
        return ProcurementLog.objects.all()
