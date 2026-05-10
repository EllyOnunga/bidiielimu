from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import AuditLog
from .serializers import AuditLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated] # Should ideally be IsAdminUser, but we use a custom role check later
    search_fields = ['user_name', 'action', 'model_name', 'object_repr', 'ip_address']

    def get_queryset(self):
        from django.db import connection
        if connection.schema_name == 'public':
            return AuditLog.objects.none()

        user = self.request.user
        if user.role_name and user.role_name in ['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL']:
            return AuditLog.objects.all()
        return AuditLog.objects.none()

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db import connection
        if connection.schema_name == 'public':
            return Response({
                "total_actions_24h": 0,
                "sensitive_changes": 0,
                "active_admins": 0
            })

        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Q
        
        last_24h = timezone.now() - timedelta(hours=24)
        qs = self.get_queryset()
        
        total_actions_24h = qs.filter(timestamp__gte=last_24h).count()
        sensitive_changes = qs.filter(Q(action='DELETE') | Q(action='UPDATE')).count()
        
        from accounts.models import User
        active_admins = User.objects.filter(role__name='ADMIN', is_active=True).count()
        
        return Response({
            "total_actions_24h": total_actions_24h,
            "sensitive_changes": sensitive_changes,
            "active_admins": active_admins
        })
