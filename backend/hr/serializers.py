from rest_framework import serializers

from .models import LeaveRequest, PayrollRecord, StaffProfile


class StaffProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    role_name = serializers.CharField(write_only=True)
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = StaffProfile
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role_name",
            "employee_id",
            "department",
            "job_title",
            "joining_date",
            "basic_salary",
            "status",
            "full_name",
            "user_email",
        ]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["first_name"] = instance.user.first_name if instance.user else ""
        rep["last_name"] = instance.user.last_name if instance.user else ""
        rep["email"] = instance.user.email if instance.user else ""
        rep["role"] = (
            instance.user.role.name
            if (instance.user and instance.user.role)
            else "STAFF"
        )
        rep["is_active"] = instance.status == "ACTIVE"
        rep["phone_number"] = instance.user.phone_number if instance.user else ""
        return rep

    def create(self, validated_data):
        from django.db import transaction

        from accounts.models import Role, User

        email = validated_data.pop("email")
        first_name = validated_data.pop("first_name")
        last_name = validated_data.pop("last_name")
        role_name = validated_data.pop("role_name")

        with transaction.atomic():
            role = Role.objects.get(name=role_name)
            # Create user with a default password (employee_id)
            user = User.objects.create_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                password=validated_data.get("employee_id"),
                school=self.context["request"].user.school,
                is_email_verified=True,
            )
            staff_profile = StaffProfile.objects.create(user=user, **validated_data)
            return staff_profile


class PayrollRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRecord
        fields = "__all__"


class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = "__all__"

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.staff and instance.staff.user:
            rep["staff_name"] = instance.staff.user.get_full_name()
        else:
            rep["staff_name"] = "Staff Member"
        return rep
