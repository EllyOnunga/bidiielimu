from django.utils import timezone
from rest_framework import serializers

from .models_api import APIKey


class APIKeySerializer(serializers.ModelSerializer):
    secret = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = APIKey
        fields = [
            "id",
            "name",
            "key_prefix",
            "secret",
            "key_type",
            "is_active",
            "expires_at",
            "last_used_at",
            "created_at",
            "rate_limit_requests",
            "rate_limit_burst",
        ]
        read_only_fields = ["id", "key_prefix", "secret", "last_used_at", "created_at"]

    def get_secret(self, obj):
        return getattr(obj, "_plain_key", None)

    def validate_expires_at(self, value):
        if value and value <= timezone.now():
            raise serializers.ValidationError("Expiration date must be in the future")
        return value
