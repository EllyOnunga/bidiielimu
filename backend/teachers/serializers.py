from django.contrib.auth import get_user_model
from rest_framework import serializers
from schools.utils import TenantSerializerMixin
from .models import Teacher

User = get_user_model()

class TeacherSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, min_length=8, required=False)

    class Meta:
        model = Teacher
        fields = ['id', 'employee_id', 'first_name', 'last_name', 'name', 'phone_number', 'specialization', 'joining_date', 'is_active', 'email', 'password']
        read_only_fields = ['id', 'school', 'name']

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
             raise serializers.ValidationError({"detail": "Email and password are required for new teachers."})

        school = validated_data.get('school')
        if not school:
             raise serializers.ValidationError({"school": "User must be assigned to a school to add teachers."})

        user = User.objects.create_user(
            email=email,
            password=password,
            role='TEACHER',
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            phone_number=validated_data.get('phone_number'),
            school=school
        )

        teacher = Teacher.objects.create(user=user, **validated_data)
        return teacher

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        password = validated_data.pop('password', None)

        if instance.user:
            user = instance.user
            if email:
                user.email = email
            if password:
                user.set_password(password)
            
            user.first_name = validated_data.get('first_name', user.first_name)
            user.last_name = validated_data.get('last_name', user.last_name)
            user.phone_number = validated_data.get('phone_number', user.phone_number)
            user.save()

        return super().update(instance, validated_data)
