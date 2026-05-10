from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models_api import APIKey
from .serializers import APIKeySerializer

class APIKeyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing API keys
    """
    serializer_class = APIKeySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return APIKey.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, school=self.request.user.school)

    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate an API key"""
        api_key = self.get_object()
        old_key = api_key.key
        api_key.save()  # This will generate a new key
        return Response({
            'message': 'API key regenerated successfully',
            'new_key': api_key.key,
            'old_key': old_key
        })

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle API key active status"""
        api_key = self.get_object()
        api_key.is_active = not api_key.is_active
        api_key.save()
        return Response({
            'message': f'API key {"activated" if api_key.is_active else "deactivated"}',
            'is_active': api_key.is_active
        })