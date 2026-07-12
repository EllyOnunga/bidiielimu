from django.db.models import Count
from rest_framework import permissions, viewsets

from config.tenant_security import BaseTenantViewSet

from .models import (
    Classroom,
    GradeLevel,
    ScheduleSlot,
    Stream,
    Subject,
    SubjectAssignment,
)
from .serializers import (
    ClassroomSerializer,
    GradeLevelSerializer,
    ScheduleSlotSerializer,
    StreamSerializer,
    SubjectAssignmentSerializer,
    SubjectSerializer,
)


class SubjectAssignmentViewSet(BaseTenantViewSet):
    serializer_class = SubjectAssignmentSerializer
    search_fields = [
        "teacher__user__first_name",
        "teacher__user__last_name",
        "subject__name",
        "stream__name",
    ]

    def get_queryset(self):
        user = self.request.user
        qs = (
            SubjectAssignment.objects.all()
            .select_related("teacher", "subject", "stream", "stream__grade_level")
            .order_by("id")
        )

        # If user is a teacher, only show their assignments by default
        if hasattr(user, "role_name") and user.role_name == "TEACHER":
            qs = qs.filter(teacher__user=user)

        teacher_id = self.request.query_params.get("teacher")
        if teacher_id and teacher_id != "undefined":
            qs = qs.filter(teacher_id=teacher_id)

        return qs

    def perform_create(self, serializer):
        serializer.save()


class GradeLevelViewSet(BaseTenantViewSet):
    serializer_class = GradeLevelSerializer
    search_fields = ["name"]

    def get_queryset(self):
        return (
            GradeLevel.objects.all()
            .prefetch_related("streams")
            .annotate(student_count=Count("streams__students", distinct=True))
            .order_by("id")
        )

    def perform_create(self, serializer):
        serializer.save()


class StreamViewSet(BaseTenantViewSet):
    serializer_class = StreamSerializer
    search_fields = [
        "name",
        "grade_level__name",
        "teacher__user__first_name",
        "teacher__user__last_name",
    ]

    def get_queryset(self):
        qs = (
            Stream.objects.all()
            .select_related("grade_level", "teacher")
            .annotate(student_count=Count("students", distinct=True))
            .order_by("id")
        )

        grade_id = self.request.query_params.get("grade")
        if grade_id and grade_id.isdigit():
            qs = qs.filter(grade_level_id=grade_id)
        return qs


class SubjectViewSet(BaseTenantViewSet):
    serializer_class = SubjectSerializer
    search_fields = ["name", "code"]

    def get_queryset(self):
        return Subject.objects.all().order_by("id")

    def perform_create(self, serializer):
        serializer.save()


class ClassroomViewSet(BaseTenantViewSet):
    serializer_class = ClassroomSerializer
    search_fields = ["name"]

    def get_queryset(self):
        return Classroom.objects.all().order_by("id")

    def perform_create(self, serializer):
        serializer.save()


class ScheduleSlotViewSet(BaseTenantViewSet):
    serializer_class = ScheduleSlotSerializer

    def get_queryset(self):
        user = self.request.user
        qs = (
            ScheduleSlot.objects.all()
            .select_related(
                "stream", "stream__grade_level", "subject", "teacher", "classroom"
            )
            .order_by("day_of_week", "start_time")
        )
        if user.role_name == "STUDENT":
            # Students only see slots for their own stream
            qs = qs.filter(stream__students__user=user)

        stream_id = self.request.query_params.get("stream")
        if stream_id and stream_id.isdigit():
            qs = qs.filter(stream_id=stream_id)

        return qs
