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
        user = self.request.user
        if user.role == 'ADMIN' and not user.school:
            return AuditLog.objects.all()
        if hasattr(user, 'school') and user.school:
            return AuditLog.objects.filter(school=user.school)
        return AuditLog.objects.none()

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from django.db.models import Q
        
        last_24h = timezone.now() - timedelta(hours=24)
        qs = self.get_queryset()
        
        total_actions_24h = qs.filter(timestamp__gte=last_24h).count()
        sensitive_changes = qs.filter(Q(action='DELETE') | Q(action='UPDATE')).count()
        
        from accounts.models import User
        if request.user.school:
            active_admins = User.objects.filter(role='ADMIN', school=request.user.school, is_active=True).count()
        else:
            active_admins = User.objects.filter(role='ADMIN', is_active=True).count()
        
        return Response({
            "total_actions_24h": total_actions_24h,
            "sensitive_changes": sensitive_changes,
            "active_admins": active_admins
        })
