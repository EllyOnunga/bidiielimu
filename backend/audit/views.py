from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.tenant_security import StrictTenantPermission, TenantAwareViewSetMixin

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(TenantAwareViewSetMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]
    search_fields = ["user_name", "action", "model_name", "object_repr", "ip_address"]

    def get_queryset(self):
        from django.db import connection

        if connection.schema_name == "public":
            return AuditLog.objects.none()

        user = self.request.user
        tenant = self.request.tenant

        if user.school and user.school != tenant:
            return AuditLog.objects.none()

        if user.role_name and user.role_name in ["ADMIN", "SUPER_ADMIN", "PRINCIPAL"]:
            qs = AuditLog.objects.all()
        else:
            qs = AuditLog.objects.none()

        # Date range filtering
        start = self.request.query_params.get("start_date")
        end = self.request.query_params.get("end_date")
        if start:
            qs = qs.filter(timestamp__date__gte=start)
        if end:
            qs = qs.filter(timestamp__date__lte=end)

        return qs

    @action(detail=False, methods=["get"])
    def stats(self, request):
        from django.db import connection

        if connection.schema_name == "public":
            return Response(
                {"total_actions_24h": 0, "sensitive_changes": 0, "active_admins": 0}
            )

        from datetime import timedelta

        from django.db.models import Q
        from django.utils import timezone

        last_24h = timezone.now() - timedelta(hours=24)
        qs = self.get_queryset()

        total_actions_24h = qs.filter(timestamp__gte=last_24h).count()
        sensitive_changes = qs.filter(Q(action="DELETE") | Q(action="UPDATE")).count()

        from accounts.models import User

        # Explicitly filter users by the current school to avoid cross-tenant counts
        active_admins = User.objects.filter(
            school=request.tenant, role__name="ADMIN", is_active=True
        ).count()

        return Response(
            {
                "total_actions_24h": total_actions_24h,
                "sensitive_changes": sensitive_changes,
                "active_admins": active_admins,
            }
        )

    @action(detail=False, methods=["get"])
    def export(self, request):
        """Export audit logs as CSV"""
        import csv

        from django.http import HttpResponse

        qs = self.get_queryset()[:5000]  # Limit for performance
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="audit_logs.csv"'

        writer = csv.writer(response)
        writer.writerow(["Timestamp", "User", "Action", "Model", "Object", "IP"])

        for log in qs:
            writer.writerow(
                [
                    log.timestamp,
                    log.user.email if log.user else "System",
                    log.action,
                    log.model_name,
                    log.object_repr,
                    log.ip_address or "",
                ]
            )
        return response
