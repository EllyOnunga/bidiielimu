from config.tenant_security import (StrictTenantPermission,
                                    TenantAwareViewSetMixin)
from rest_framework import permissions, viewsets

from .models import Ticket
from .serializers import TicketSerializer


class TicketViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        user = self.request.user
        # System Superadmins can see all tickets, school admins only their tenant's
        if user.is_superuser:
            return Ticket.objects.all().select_related("tenant", "user")
        return Ticket.objects.all().select_related(
            "tenant", "user"
        )  # TenantAwareViewSetMixin handles tenant filtering

    def perform_create(self, serializer):
        # tenant is already handled by TenantAwareViewSetMixin if it's in the
        # payload or via user session
        serializer.save(user=self.request.user)
