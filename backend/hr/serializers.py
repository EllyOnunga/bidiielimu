from rest_framework import serializers
from .models import StaffProfile, PayrollRecord, LeaveRequest

class StaffProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    role_name = serializers.ChoiceField(choices=['FINANCE', 'LIBRARIAN', 'ADMIN', 'HR'], write_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = StaffProfile
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role_name', 
            'employee_id', 'department', 'job_title', 'joining_date', 
            'basic_salary', 'status', 'full_name', 'user_email'
        ]

    def create(self, validated_data):
        from accounts.models import User, Role
        from django.db import transaction
        
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        role_name = validated_data.pop('role_name')
        
        with transaction.atomic():
            role = Role.objects.get(name=role_name)
            # Create user with a default password (employee_id)
            user = User.objects.create_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                password=validated_data.get('employee_id'),
                school=self.context['request'].user.school
            )
            staff_profile = StaffProfile.objects.create(user=user, **validated_data)
            return staff_profile

class PayrollRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRecord
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'
