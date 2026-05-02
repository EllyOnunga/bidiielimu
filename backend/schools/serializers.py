from rest_framework import serializers
from .models import School, Subscription, SchoolSetting

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'status', 'start_date', 'expiry_date']
        read_only_fields = ['id', 'start_date']

class SchoolSettingSerializer(serializers.ModelSerializer):

    class Meta:
        model = SchoolSetting
        fields = [
            'id', 'current_term', 'academic_year', 'currency', 
            'tax_percentage', 'enable_email_notifications', 
            'enable_sms_notifications', 'principal_name', 'school_motto', 'accent_color'
        ]


class SchoolSerializer(serializers.ModelSerializer):
    subscription = SubscriptionSerializer(read_only=True)
    settings = SchoolSettingSerializer(read_only=True)
    student_count = serializers.IntegerField(read_only=True)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    domain_url = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'schema_name', 'domain_url', 'address', 'contact_email', 'contact_phone', 
            'logo', 'created_at', 'updated_at', 'subscription', 'settings',
            'student_count', 'total_revenue'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

