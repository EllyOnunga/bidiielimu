from django.contrib.auth import get_user_model
from rest_framework import serializers
from schools.utils import TenantSerializerMixin
from .models import Student

User = get_user_model()

class StudentSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    # Read-only display fields for the hierarchy
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    grade_name  = serializers.CharField(source='stream.grade_level.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'last_name',
            'date_of_birth', 'gender', 'photo',
            'stream', 'stream_name', 'grade_name',
            'parent_name', 'parent_phone', 'parent_email',
            'is_active', 'email', 'password'
        ]
        read_only_fields = ['id', 'school', 'stream_name', 'grade_name']

    def create(self, validated_data):
        email    = validated_data.pop('email', None)
        password = validated_data.pop('password', None)

        if not email or not password:
            raise serializers.ValidationError({"detail": "Email and password are required for new students."})

        request_user = self.context['request'].user
        school = request_user.school

        if not school:
            raise serializers.ValidationError(
                {"school": "User must be assigned to a school to add students."}
            )

        validated_data['school'] = school

        user = User.objects.create_user(
            email=email,
            password=password,
            role='STUDENT',
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            school=school,
        )

        student = Student.objects.create(user=user, **validated_data)
        return student

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        password = validated_data.pop('password', None)

        # Update the linked user if email/password/names changed
        if instance.user:
            user = instance.user
            if email:
                user.email = email
            if password:
                user.set_password(password)
            
            user.first_name = validated_data.get('first_name', user.first_name)
            user.last_name = validated_data.get('last_name', user.last_name)
            user.save()

        return super().update(instance, validated_data)
