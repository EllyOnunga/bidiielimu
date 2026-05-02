from rest_framework import serializers
from .models import Notification, Notice, SchoolEvent, PTMMeeting

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class NoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notice
        fields = '__all__'

class SchoolEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolEvent
        fields = '__all__'

class PTMMeetingSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    guardian_name = serializers.CharField(source='guardian.first_name', read_only=True)

    class Meta:
        model = PTMMeeting
        fields = '__all__'
