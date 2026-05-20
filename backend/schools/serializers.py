from rest_framework import serializers

from .models import School, SchoolSetting, Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["id", "plan", "status", "start_date", "expiry_date"]
        read_only_fields = ["id", "start_date"]


class SchoolSettingSerializer(serializers.ModelSerializer):

    class Meta:
        model = SchoolSetting
        fields = [
            "id",
            "current_term",
            "academic_year",
            "currency",
            "tax_percentage",
            "enable_email_notifications",
            "enable_sms_notifications",
            "principal_name",
            "school_motto",
            "accent_color",
        ]


class SchoolSerializer(serializers.ModelSerializer):
    subscription = SubscriptionSerializer(read_only=True)
    settings = SchoolSettingSerializer(read_only=True)
    student_count = serializers.SerializerMethodField()
    total_revenue = serializers.SerializerMethodField()

    def get_student_count(self, obj):
        from django_tenants.utils import tenant_context

        from students.models import Student

        if obj.schema_name == "public":
            return 0
        try:
            with tenant_context(obj):
                return Student.objects.count()
        except Exception:
            return 0

    def get_total_revenue(self, obj):
        from django.db.models import Sum
        from django_tenants.utils import tenant_context

        from fees.models import FeePayment

        if obj.schema_name == "public":
            return 0.00
        try:
            with tenant_context(obj):
                total = FeePayment.objects.aggregate(total=Sum("amount"))["total"]
                return float(total) if total else 0.00
        except Exception:
            return 0.00

    domain_url = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = School
        fields = [
            "id",
            "name",
            "schema_name",
            "domain_url",
            "address",
            "contact_email",
            "contact_phone",
            "logo",
            "created_at",
            "updated_at",
            "subscription",
            "settings",
            "student_count",
            "total_revenue",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
