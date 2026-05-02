from django.contrib.auth import get_user_model
from rest_framework import serializers
from schools.utils import TenantSerializerMixin
from .models import Teacher

User = get_user_model()

from .models import Teacher, StaffProfile, LeaveRequest

class TeacherSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = Teacher
        fields = [
            'id', 'employee_id', 'tsc_number', 'national_id', 'first_name', 
            'last_name', 'name', 'phone_number', 'designation', 'specialization', 
            'contract_type', 'basic_salary', 'joining_date', 'is_active', 
            'email', 'password'
        ]
        read_only_fields = ['id', 'name']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.user:
            data['email'] = instance.user.email
        return data

    def create(self, validated_data):
        email = validated_data.pop('email', None)
        password = validated_data.pop('password', None)
        
        if not email or not password:
             raise serializers.ValidationError({"detail": "Email and password are required."})

        # Logic for creating user and teacher
        user = User.objects.create_user(
            email=email, password=password, role='TEACHER',
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            phone_number=validated_data.get('phone_number')
        )
        return Teacher.objects.create(user=user, **validated_data)

class StaffProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = StaffProfile
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='user.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'

