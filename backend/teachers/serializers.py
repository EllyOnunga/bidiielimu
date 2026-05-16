from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import LeaveRequest, StaffProfile, Teacher

User = get_user_model()


class TeacherSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="user.email", required=True)
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        required=True,
        help_text="Password must be at least 8 characters long, cannot be entirely numeric, and cannot be a commonly used password.",
    )

    role = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Teacher
        fields = [
            "id",
            "employee_id",
            "tsc_number",
            "national_id",
            "first_name",
            "last_name",
            "name",
            "full_name",
            "phone_number",
            "designation",
            "specialization",
            "contract_type",
            "basic_salary",
            "joining_date",
            "is_active",
            "email",
            "password",
            "role",
        ]
        read_only_fields = ["id", "name", "full_name"]

    def validate_email(self, value):
        if value:
            value = value.lower().strip()
            qs = User.objects.filter(email__iexact=value)
            if self.instance and self.instance.user:
                qs = qs.exclude(id=self.instance.user.id)
            if qs.exists():
                raise serializers.ValidationError(
                    "A user with this email already exists."
                )
        return value

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.user:
            data["email"] = instance.user.email
        return data

    def create(self, validated_data):
        # Extract user data from the source mapping
        user_data = validated_data.pop("user", {})
        email = user_data.get("email")
        password = validated_data.pop("password", None)
        role = validated_data.pop("role", "TEACHER")

        if not email or not password:
            raise serializers.ValidationError(
                {"detail": "Email and password are required."}
            )

        request = self.context.get("request")
        school = request.user.school if request else None

        from accounts.models import Role

        role_obj, _ = Role.objects.get_or_create(name=role)

        from django.db import IntegrityError

        try:
            user = User.objects.create_user(
                email=email,
                password=password,
                role=role_obj,
                first_name=validated_data.get("first_name"),
                last_name=validated_data.get("last_name"),
                phone_number=validated_data.get("phone_number"),
                school=school,
            )
        except IntegrityError:
            raise serializers.ValidationError(
                {"email": ["A user with this email already exists."]}
            )

        try:
            teacher = Teacher.objects.create(user=user, **validated_data)

            # Send Welcome Email
            from accounts.services import EmailService

            base_url = EmailService._get_frontend_url(user)
            login_url = f"{base_url}/login"

            EmailService.send_welcome_email(
                user, login_url=login_url, plain_password=password
            )

            return teacher
        except IntegrityError as e:
            raise serializers.ValidationError({"detail": str(e)})


class StaffProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = StaffProfile
        fields = "__all__"


class LeaveRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="user.get_full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = "__all__"
