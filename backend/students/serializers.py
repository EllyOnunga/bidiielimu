from django.contrib.auth import get_user_model
from rest_framework import serializers
from schools.utils import TenantSerializerMixin
from .models import Student, Guardian, MedicalRecord, StudentTransfer

User = get_user_model()

class GuardianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guardian
        fields = ['id', 'first_name', 'last_name', 'relationship', 'phone_number', 'email', 'occupation', 'is_emergency_contact']

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'blood_group', 'allergies', 'chronic_conditions', 'medications', 'emergency_notes']

class StudentTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentTransfer
        fields = ['id', 'transfer_type', 'school_name', 'reason', 'date', 'transfer_letter']

class StudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    # Read-only display fields
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    grade_name  = serializers.CharField(source='stream.grade_level.name', read_only=True)

    # Nested detail fields
    guardians = GuardianSerializer(many=True, required=False)
    medical_record = MedicalRecordSerializer(required=False)
    transfers = StudentTransferSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'last_name',
            'date_of_birth', 'gender', 'photo', 'enrollment_date',
            'stream', 'stream_name', 'grade_name',
            'curriculum', 'status', 'index_number', 'upi_number',
            'is_active', 'email', 'password',
            'guardians', 'medical_record', 'transfers'
        ]
        read_only_fields = ['id', 'stream_name', 'grade_name']

    def create(self, validated_data):
        email    = validated_data.pop('email', None)
        password = validated_data.pop('password', None)
        guardians_data = validated_data.pop('guardians', [])
        medical_data = validated_data.pop('medical_record', None)

        if email and password:
            user = User.objects.create_user(
                email=email,
                password=password,
                role='STUDENT',
                first_name=validated_data.get('first_name'),
                last_name=validated_data.get('last_name'),
            )
            validated_data['user'] = user

        student = Student.objects.create(**validated_data)

        # Create nested records
        for guardian_data in guardians_data:
            Guardian.objects.create(student=student, **guardian_data)
        
        if medical_data:
            MedicalRecord.objects.create(student=student, **medical_data)

        return student

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        password = validated_data.pop('password', None)
        guardians_data = validated_data.pop('guardians', None)
        medical_data = validated_data.pop('medical_record', None)

        # Update user
        if instance.user:
            user = instance.user
            if email: user.email = email
            if password: user.set_password(password)
            user.first_name = validated_data.get('first_name', user.first_name)
            user.last_name = validated_data.get('last_name', user.last_name)
            user.save()

        # Update nested records (simplified: replace all for guardians)
        if guardians_data is not None:
            instance.guardians.all().delete()
            for g_data in guardians_data:
                Guardian.objects.create(student=instance, **g_data)

        if medical_data:
            if hasattr(instance, 'medical_record'):
                for attr, value in medical_data.items():
                    setattr(instance.medical_record, attr, value)
                instance.medical_record.save()
            else:
                MedicalRecord.objects.create(student=instance, **medical_data)

        return super().update(instance, validated_data)

