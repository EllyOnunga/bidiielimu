from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from .models import GradeLevel, Stream, Subject, SubjectAssignment, Classroom, ScheduleSlot
from .serializers import (
    GradeLevelSerializer, StreamSerializer, SubjectSerializer, 
    SubjectAssignmentSerializer, ClassroomSerializer, ScheduleSlotSerializer
)
from django.db.models import Count


class SubjectAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['teacher__user__first_name', 'teacher__user__last_name', 'subject__name', 'stream__name']

    def get_queryset(self):
        qs = SubjectAssignment.objects.filter(
            school=self.request.user.school
        ).select_related('teacher', 'subject', 'stream', 'stream__grade_level')
        
        teacher_id = self.request.query_params.get('teacher')
        if teacher_id and teacher_id != 'undefined':
            qs = qs.filter(teacher_id=teacher_id)
            
        return qs

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            raise ValidationError({"detail": "User must be assigned to a school."})
        serializer.save(school=school)

class GradeLevelViewSet(viewsets.ModelViewSet):
    serializer_class = GradeLevelSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name']

    def get_queryset(self):
        return GradeLevel.objects.filter(
            school=self.request.user.school
        ).prefetch_related('streams').annotate(
            student_count=Count('streams__students', distinct=True)
        )

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            raise ValidationError({"detail": "User must be assigned to a school to perform this action."})
        serializer.save(school=school)

class StreamViewSet(viewsets.ModelViewSet):
    serializer_class = StreamSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'grade_level__name', 'teacher__user__first_name', 'teacher__user__last_name']

    def get_queryset(self):
        qs = Stream.objects.filter(
            grade_level__school=self.request.user.school
        ).select_related('grade_level', 'teacher').annotate(
            student_count=Count('students', distinct=True)
        )

        grade_id = self.request.query_params.get('grade')
        if grade_id:
            qs = qs.filter(grade_level_id=grade_id)
        return qs

class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'code']

    def get_queryset(self):
        return Subject.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            raise ValidationError({"detail": "User must be assigned to a school to perform this action."})
        serializer.save(school=school)

class ClassroomViewSet(viewsets.ModelViewSet):
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name']

    def get_queryset(self):
        return Classroom.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            raise ValidationError({"detail": "User must be assigned to a school to perform this action."})
        serializer.save(school=school)

class ScheduleSlotViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleSlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ScheduleSlot.objects.filter(stream__grade_level__school=user.school).select_related(
            'stream', 'stream__grade_level', 'subject', 'teacher', 'classroom'
        )
        if user.role == 'STUDENT':
            # Students only see slots for their own stream
            qs = qs.filter(stream__students__user=user)
        return qs
