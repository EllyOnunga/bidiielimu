from rest_framework import serializers
from students.models import Student

from .models import DisciplineIncident


class DisciplineIncidentSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source="student.full_name")
    reported_by_name = serializers.ReadOnlyField(source="reported_by.get_full_name")

    class Meta:
        model = DisciplineIncident
        fields = [
            "id",
            "student",
            "student_name",
            "reported_by",
            "reported_by_name",
            "date",
            "category",
            "summary",
            "description",
            "action_taken",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "reported_by"]

    def create(self, validated_data):
        # Automatically set the reporter to the current user
        validated_data["reported_by"] = self.context["request"].user
        return super().create(validated_data)
