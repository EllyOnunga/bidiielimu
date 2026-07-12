from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from .models import LeaveRequest, PayrollRecord, StaffProfile


class StaffProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    role_name = serializers.CharField(write_only=True)
    designation = serializers.CharField(
        write_only=True, required=False, allow_blank=True
    )
    department = serializers.CharField(
        required=False, allow_blank=True, default="General"
    )
    job_title = serializers.CharField(required=False, allow_blank=True, default="Staff")
    basic_salary = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, default=0.00
    )
    employee_id = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=StaffProfile.objects.all(),
                message="This employee ID is already in use. Please enter a unique ID.",
            )
        ],
        required=False,
    )

    def validate_employee_id(self, value):
        if value:
            value = value.strip().upper()
        return value

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
            "designation",
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

        designation = validated_data.pop("designation", None)
        if designation and validated_data.get("job_title", "Staff") == "Staff":
            validated_data["job_title"] = designation

        with transaction.atomic():
            try:
                role = Role.objects.get(name=role_name)
            except Role.DoesNotExist:
                if role_name == "BURSAR":
                    role = Role.objects.get(name="FINANCE")
                else:
                    role = Role.objects.get(name="ADMIN")  # fallback

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
    staff = serializers.PrimaryKeyRelatedField(read_only=True)

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
