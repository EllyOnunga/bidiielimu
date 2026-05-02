from rest_framework import serializers
from .models import StaffProfile, PayrollRecord, LeaveRequest

class StaffProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    class Meta:
        model = StaffProfile
        fields = '__all__'

class PayrollRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRecord
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'
