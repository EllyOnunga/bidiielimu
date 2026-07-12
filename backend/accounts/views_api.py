from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models_api import APIKey
from .serializers import APIKeySerializer


from config.tenant_security import StrictTenantPermission, TenantAwareViewSetMixin


class APIKeyViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing API keys
    """

    serializer_class = APIKeySerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        qs = APIKey.objects.filter(user=self.request.user)
        if not self.request.user.is_superuser:
            qs = qs.filter(school=self.request.user.school)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        api_key = serializer.save(
            user=self.request.user, school=self.request.user.school
        )
        # Rotate to generate the secret and persist hashed key
        new_secret = api_key.rotate_key()
        api_key.is_legacy = False
        api_key.save(update_fields=["key", "key_hash", "key_prefix", "is_legacy"])
        data = APIKeySerializer(api_key, context={"request": request}).data
        # Include the one-time secret in the response
        data["secret"] = new_secret
        headers = self.get_success_headers(data)
        return Response(data, status=201, headers=headers)

    @action(detail=True, methods=["post"])
    def regenerate(self, request, pk=None):
        """Regenerate an API key and return the secret once"""
        api_key = self.get_object()
        new_key = api_key.rotate_key()
        api_key.is_legacy = False
        api_key.save(update_fields=["key", "key_hash", "key_prefix", "is_legacy"])
        return Response(
            {
                "message": "API key regenerated successfully",
                "secret": new_key,
                "key_prefix": api_key.key_prefix,
            }
        )

    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        """Toggle API key active status"""
        api_key = self.get_object()
        api_key.is_active = not api_key.is_active
        api_key.save()
        return Response(
            {
                "message": (
                    "API key activated" if api_key.is_active else "API key deactivated"
                ),
                "is_active": api_key.is_active,
            }
        )
