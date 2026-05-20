from rest_framework import serializers

from schools.utils import TenantSerializerMixin

from .models import Ticket


class TicketSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    tenant_name = serializers.CharField(source="tenant.name", read_only=True)

    class Meta:
        model = Ticket
        fields = [
            "id",
            "tenant",
            "tenant_name",
            "user",
            "user_name",
            "subject",
            "description",
            "status",
            "priority",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at", "tenant"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user:
            validated_data["user"] = request.user
        return super().create(validated_data)
