from rest_framework import serializers
from schools.utils import TenantSerializerMixin
from .models import DailyAttendance

class DailyAttendanceSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.get_full_name', read_only=True)

    class Meta:
        model = DailyAttendance
        fields = ['id', 'student', 'student_name', 'date', 'status', 'remarks', 'marked_by', 'marked_by_name', 'created_at']
        read_only_fields = ['marked_by', 'created_at']

    def validate(self, data):
        request = self.context.get('request')
        if not request or not request.user:
            return data
            
        user = request.user
        if user.role == 'TEACHER':
            from classes.models import ScheduleSlot
            student = data.get('student')
            
            # Allow if they are the Class Teacher
            is_class_teacher = student.stream.teacher.user == user if student.stream and student.stream.teacher else False
            
            # Or if they teach any subject to this stream
            teaches_stream = ScheduleSlot.objects.filter(
                teacher__user=user,
                stream=student.stream
            ).exists()
            
            if not (is_class_teacher or teaches_stream):
                raise serializers.ValidationError(
                    "You are not authorized to mark attendance for this class/student."
                )
        return data
