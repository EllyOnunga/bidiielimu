from dj_rest_auth.serializers import PasswordResetSerializer
from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from schools.models import School

from .models import Role, User
from .models_api import APIKey
from .services import EmailService


class APIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = APIKey
        fields = [
            "id",
            "name",
            "key",
            "key_type",
            "is_active",
            "expires_at",
            "last_used_at",
            "created_at",
        ]
        read_only_fields = ["key", "last_used_at", "created_at"]


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name", "permissions", "description"]


class SchoolBasicSerializer(serializers.ModelSerializer):
    domain = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = ["id", "name", "schema_name", "domain"]

    def get_domain(self, obj):
        domain = obj.domains.filter(is_primary=True).first()
        return (
            domain.domain
            if domain
            else f"{obj.schema_name.replace('_', '-')}.localhost"
        )


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["id", "name", "address", "contact_email", "contact_phone", "logo"]


class UserSerializer(serializers.ModelSerializer):
    school_details = SchoolSerializer(source="school", read_only=True)
    role_details = RoleSerializer(source="role", read_only=True)
    role = serializers.SlugRelatedField(slug_field="name", queryset=Role.objects.all())

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_details",
            "school",
            "school_details",
            "phone_number",
            "is_email_verified",
            "profile_picture_url",
            "github_username",
            "bio",
            "job_title",
        ]
        read_only_fields = ["id", "is_email_verified"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text="Password must be at least 8 characters long, cannot be entirely numeric, and cannot be a commonly used password.",
    )
    school_name = serializers.CharField(write_only=True)
    curriculum = serializers.ChoiceField(
        choices=School.CURRICULUM_CHOICES, write_only=True, default="CBC"
    )
    school_details = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "school_name",
            "curriculum",
            "school_details",
        ]

    def create(self, validated_data):
        from django.utils.text import slugify

        school_name = validated_data.pop("school_name")
        curriculum = validated_data.pop("curriculum", "CBC")
        schema_name = slugify(school_name).replace("-", "_")
        from django.db import IntegrityError

        try:
            school = School.objects.create(
                name=school_name, schema_name=schema_name, curriculum=curriculum
            )
        except IntegrityError:
            raise serializers.ValidationError(
                {
                    "school_name": [
                        "A school with this name already exists. Please choose a unique name."
                    ]
                }
            )

        # Create domain for the school using DASHES (standard for URLs)
        domain_name = slugify(school_name).replace("_", "-")
        from schools.models import Domain

        try:
            Domain.objects.create(
                domain=f"{domain_name}.{settings.TENANT_DOMAIN_SUFFIX}",
                tenant=school,
                is_primary=True,
            )
        except IntegrityError:
            school.delete()
            raise serializers.ValidationError(
                {
                    "school_name": [
                        "A domain for this school name already exists. Please choose a unique name."
                    ]
                }
            )

        try:
            user = User.objects.create_user(
                email=validated_data["email"],
                password=validated_data["password"],
                first_name=validated_data.get("first_name", ""),
                last_name=validated_data.get("last_name", ""),
                school=school,
                role=Role.objects.get(name="ADMIN"),
                is_email_verified=False,  # Explicitly set to False
            )
        except IntegrityError:
            # Rollback school and domain creation since this is a global issue
            school.delete()
            raise serializers.ValidationError(
                {"email": ["A user with this email already exists."]}
            )
        user.refresh_from_db()

        # Send verification email
        EmailService.send_verification_email(user)

        return user

    def get_school_details(self, obj):
        if hasattr(obj, "school") and obj.school:
            return SchoolBasicSerializer(obj.school).data
        return None


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Check if email is verified
        if not self.user.is_email_verified:
            raise serializers.ValidationError(
                {
                    "detail": "Please verify your email address before logging in.",
                    "email_verified": False,
                }
            )

        # Multi-tenant URL restriction
        request = self.context.get("request")
        if request:
            tenant = getattr(request, "tenant", None)
            if tenant:
                if tenant.schema_name == "public":
                    # Only SUPER_ADMIN allowed on main URL
                    if not (
                        self.user.is_superuser or self.user.role_name == "SUPER_ADMIN"
                    ):
                        raise serializers.ValidationError(
                            {
                                "detail": "Only Platform Super Admins can access the main platform dashboard. Please login via your school's specific URL."
                            }
                        )
                else:
                    # Restricted to their own school URL (Super Admins can access any)
                    if self.user.school != tenant and not self.user.is_superuser:
                        raise serializers.ValidationError(
                            {
                                "detail": "You do not have permission to access this school's dashboard. Please login via your own school's URL."
                            }
                        )

        # Add custom claims to token
        refresh = self.get_token(self.user)
        refresh["school_id"] = self.user.school_id if self.user.school else None
        refresh["role"] = self.user.role_name
        refresh["permissions"] = self.user.role.permissions if self.user.role else {}

        data["refresh"] = str(refresh)
        data["access"] = str(refresh.access_token)
        data["user"] = UserSerializer(self.user).data
        return data


class CustomPasswordResetSerializer(PasswordResetSerializer):
    def get_email_options(self):
        request = self.context.get("request")
        frontend_url = settings.FRONTEND_URL

        # If we're on a tenant subdomain, ensure the link points back to that same subdomain
        if request:
            host = request.get_host()
            if "localhost" in host:
                # Handle local subdomains (e.g., school.localhost:5173)
                # If the current request is to the backend (e.g. localhost:8000),
                # we might want to preserve the subdomain if it was passed.
                # However, usually FRONTEND_URL is enough for basic setup.
                pass

        return {
            "email_template_name": "registration/password_reset_email.html",
            "extra_email_context": {
                "frontend_url": frontend_url,
            },
        }
