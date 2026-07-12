import re

from rest_framework import exceptions, permissions, viewsets


def sanitize_input(value):
    """Basic input sanitization to prevent injection/XSS in tenant contexts."""
    if isinstance(value, str):
        return re.sub(r"[<>\"\';]", "", value.strip())
    return value


class StrictTenantPermission(permissions.BasePermission):
    """
    Global permission to ensure a user only accesses data within their assigned tenant.
    This acts as a second layer of defense after the middleware.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Super admins can access everything (for platform-wide management)
        if (
            request.user.is_superuser
            or getattr(request.user, "role_name", "") == "SUPER_ADMIN"
        ):
            return True

        tenant = getattr(request, "tenant", None)
        if not tenant:
            return False

        # If the user has a school assigned, it MUST match the current tenant ID
        user_school_id = getattr(request.user, "school_id", None)
        if user_school_id and user_school_id != tenant.id:
            raise exceptions.PermissionDenied(
                "Cross-tenant access detected. You are only authorized to access your own school's data."
            )

        return True


class TenantAwareViewSetMixin:
    """
    Mixin to automatically filter querysets by school_id for shared models
    and provide common tenant verification logic.
    """

    def get_queryset(self):
        queryset = super().get_queryset()
        tenant = getattr(self.request, "tenant", None)

        # If the model has a 'school' field, we explicitly filter it here
        # This protects shared models in the public schema
        if (
            hasattr(queryset.model, "school")
            and tenant
            and tenant.schema_name != "public"
        ):
            queryset = queryset.filter(school=tenant)

        return queryset


class BaseTenantViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    """
    Base viewset for tenant-aware models.
    """

    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]
