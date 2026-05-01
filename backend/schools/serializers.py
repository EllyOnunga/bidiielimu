from rest_framework import serializers
from .models import School, Subscription, SchoolSetting

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'status', 'start_date', 'expiry_date']
        read_only_fields = ['id', 'start_date']

class SchoolSettingSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_address = serializers.CharField(source='school.address', read_only=True)
    school_email = serializers.EmailField(source='school.contact_email', read_only=True)
    school_phone = serializers.CharField(source='school.contact_phone', read_only=True)
    school_logo = serializers.ImageField(source='school.logo', read_only=True)

    class Meta:
        model = SchoolSetting
        fields = [
            'id', 'school_name', 'school_address', 'school_email', 'school_phone', 'school_logo',
            'current_term', 'academic_year', 'currency', 
            'tax_percentage', 'enable_email_notifications', 
            'enable_sms_notifications', 'principal_name', 'school_motto', 'accent_color'
        ]


class SchoolSerializer(serializers.ModelSerializer):
    subscription = SubscriptionSerializer(read_only=True)
    settings = SchoolSettingSerializer(read_only=True)
    student_count = serializers.IntegerField(read_only=True)
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = School
        fields = [
            'id', 'name', 'address', 'contact_email', 'contact_phone', 
            'logo', 'created_at', 'updated_at', 'subscription', 'settings',
            'student_count', 'total_revenue'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

