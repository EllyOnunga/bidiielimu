from rest_framework import serializers
from schools.utils import TenantSerializerMixin
from .models import GradeLevel, Stream, Subject, SubjectAssignment, Classroom, ScheduleSlot


class StreamSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    teacher_name     = serializers.SerializerMethodField()
    student_count    = serializers.SerializerMethodField()

    class Meta:
        model  = Stream
        fields = [
            'id', 'grade_level', 'grade_level_name',
            'name', 'teacher', 'teacher_name', 'student_count',
        ]

    def get_teacher_name(self, obj):
        if obj.teacher:
            return f"{obj.teacher.first_name} {obj.teacher.last_name}"
        return None

    def get_student_count(self, obj):
        # Use annotated value if available to prevent N+1 queries
        if hasattr(obj, 'student_count'):
            return obj.student_count
        return obj.students.count()


class SubjectAssignmentSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    grade_name = serializers.CharField(source='stream.grade_level.name', read_only=True)

    class Meta:
        model = SubjectAssignment
        fields = ['id', 'teacher', 'teacher_name', 'subject', 'subject_name', 'stream', 'stream_name', 'grade_name']

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}"

class GradeLevelSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    streams       = StreamSerializer(many=True, read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model  = GradeLevel
        fields = ['id', 'name', 'student_count', 'streams']

    def get_student_count(self, obj):
        # Use annotated value if available to prevent N+1 queries
        if hasattr(obj, 'student_count'):
            return obj.student_count
        
        from students.models import Student
        return Student.objects.filter(stream__grade_level=obj).count()


class SubjectSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model  = Subject
        fields = ['id', 'name', 'code']


class ClassroomSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model  = Classroom
        fields = ['id', 'name', 'capacity']


class ScheduleSlotSerializer(TenantSerializerMixin, serializers.ModelSerializer):
    stream_name      = serializers.CharField(source='stream.name', read_only=True)
    grade_level_name = serializers.CharField(source='stream.grade_level.name', read_only=True)
    subject_name     = serializers.CharField(source='subject.name', read_only=True)
    teacher_name     = serializers.SerializerMethodField()
    classroom_name   = serializers.CharField(source='classroom.name', read_only=True)
    day_of_week_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model  = ScheduleSlot
        fields = [
            'id', 'stream', 'stream_name', 'grade_level_name',
            'subject', 'subject_name', 'teacher', 'teacher_name',
            'classroom', 'classroom_name',
            'day_of_week', 'day_of_week_name', 'start_time', 'end_time',
        ]

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}"
