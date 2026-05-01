from rest_framework import serializers
from schools.utils import TenantSerializerMixin
from .models import GradingSystem, GradeThreshold, Exam, Mark

class GradeThresholdSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = GradeThreshold
        fields = ['id', 'grading_system', 'grade', 'min_score', 'max_score', 'points', 'remarks']

class GradingSystemSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    thresholds = GradeThresholdSerializer(many=True, read_only=True)
    
    class Meta:
        model = GradingSystem
        fields = ['id', 'name', 'thresholds']

class ExamSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    grading_system_name = serializers.CharField(source='grading_system.name', read_only=True)

    class Meta:
        model = Exam
        fields = ['id', 'name', 'term', 'academic_year', 'start_date', 'end_date', 'is_published', 'grading_system', 'grading_system_name']
        read_only_fields = ['id', 'academic_year']

class MarkSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = Mark
        fields = ['id', 'exam', 'student', 'student_name', 'subject', 'subject_name', 'score', 'teacher_remarks']

    def validate(self, data):
        request = self.context.get('request')
        if not request or not request.user:
            return data
            
        user = request.user
        if user.role == 'TEACHER':
            from classes.models import ScheduleSlot
            # Check if this teacher is assigned to this subject and this student's stream
            student = data.get('student')
            subject = data.get('subject')
            
            # Verify the teacher is assigned to this combination in the timetable
            is_assigned = ScheduleSlot.objects.filter(
                teacher__user=user,
                stream=student.stream,
                subject=subject
            ).exists()
            
            # Also allow if they are the Class Teacher for that stream
            is_class_teacher = student.stream.teacher.user == user if student.stream and student.stream.teacher else False
            
            if not (is_assigned or is_class_teacher):
                raise serializers.ValidationError(
                    "You are not assigned to teach this subject in this class."
                )
        return data

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
