from config.caching import cache_tenant_page
from config.tenant_security import (StrictTenantPermission,
                                    TenantAwareViewSetMixin)
from django.db import transaction
from django.db.models import Avg
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Exam, GradeThreshold, GradingSystem, Mark
from .serializers import (ExamSerializer, GradeThresholdSerializer,
                          GradingSystemSerializer, MarkSerializer)


class GradingSystemViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = GradingSystemSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        return GradingSystem.objects.all()

    def perform_create(self, serializer):
        serializer.save()


class GradeThresholdViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = GradeThresholdSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_queryset(self):
        return GradeThreshold.objects.all()


class ExamViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]
    search_fields = ["name", "term", "academic_year"]

    def get_queryset(self):
        return Exam.objects.all().order_by("-start_date", "id")

    def perform_create(self, serializer):
        # Auto-calculate academic year if not provided
        academic_year = self.request.data.get("academic_year")
        if not academic_year:
            from datetime import datetime

            academic_year = str(datetime.now().year)

        serializer.save(academic_year=academic_year)

    @action(detail=False, methods=["get"])
    @cache_tenant_page(600)  # Cache for 10 minutes
    def analytics(self, request):
        # Single optimized query to get exam analytics
        exam_analytics = (
            Exam.objects.annotate(avg_score=Avg("marks__score"))
            .order_by("-start_date")[:6]
            .values("name", "avg_score")
        )

        # Reverse to chronological order for the chart
        data = []
        for exam_data in reversed(list(exam_analytics)):
            data.append(
                {
                    "name": exam_data["name"],
                    "score": (
                        round(exam_data["avg_score"], 1)
                        if exam_data["avg_score"]
                        else 0
                    ),
                }
            )

        return Response(data)

    @action(detail=True, methods=["post"])
    def compute_ranks(self, request, pk=None):
        from .tasks import compute_ranks_task

        # Dispatch to Celery background task
        compute_ranks_task.delay(pk)
        return Response(
            {"detail": "Ranking computation started in background."},
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=True, methods=["get"])
    def export_mark_sheet(self, request, pk=None):
        from django.http import HttpResponse

        from .services_export import MarkSheetExportService

        csv_content = MarkSheetExportService.generate_mark_sheet_csv(pk)
        response = HttpResponse(csv_content, content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="mark_sheet_exam_{pk}.csv"'
        )
        return response


class MarkViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = MarkSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]
    search_fields = [
        "student__first_name",
        "student__last_name",
        "student__admission_number",
        "subject__name",
        "exam__name",
    ]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            from accounts.permissions import IsTeacher

            return [IsTeacher()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = (
            Mark.objects.all()
            .select_related("student", "student__user", "exam", "subject")
            .order_by("id")
        )
        if user.role_name == "STUDENT":
            qs = qs.filter(student__user=user)
        elif user.role_name == "PARENT":
            # Ensure parents only see marks for students they are linked to
            qs = qs.filter(student__guardians__email=user.email)
        return qs

    @action(detail=False, methods=["post"])
    def bulk_save(self, request):
        exam_id = request.data.get("exam")
        subject_id = request.data.get("subject")
        marks_data = request.data.get("marks", [])

        if not exam_id or not subject_id:
            return Response(
                {"detail": "Exam and Subject are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exam = Exam.objects.get(id=exam_id)
        from classes.models import Subject

        subject = Subject.objects.get(id=subject_id)

        saved_marks = []
        with transaction.atomic():
            for entry in marks_data:
                student_id = entry.get("student_id")
                score = entry.get("score")

                try:
                    score_val = float(score)
                    if score_val < 0 or score_val > 100:
                        raise ValueError(f"Invalid score {score}")
                except (TypeError, ValueError):
                    return Response(
                        {"detail": f"Invalid score format for student {student_id}."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                mark, created = Mark.objects.update_or_create(
                    exam=exam,
                    subject=subject,
                    student_id=student_id,
                    defaults={"score": score_val},
                )
                saved_marks.append(mark.id)

                # Simple audit log
                from django.contrib.admin.models import (ADDITION, CHANGE,
                                                         LogEntry)
                from django.contrib.contenttypes.models import ContentType

                LogEntry.objects.log_action(
                    user_id=request.user.id,
                    content_type_id=ContentType.objects.get_for_model(Mark).pk,
                    object_id=mark.id,
                    object_repr=str(mark),
                    action_flag=CHANGE if not created else ADDITION,
                    change_message=f"Bulk mark save - score: {score_val}",
                )

        return Response(
            {
                "detail": f"Successfully saved {len(saved_marks)} marks.",
                "saved_ids": saved_marks,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def subject_analytics(self, request):
        exam_id = request.query_params.get("exam")
        subject_id = request.query_params.get("subject")

        if not exam_id or not subject_id:
            return Response(
                {"detail": "Exam and Subject parameters are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Grade Distribution
        from django.db.models import Count

        # This assumes we have a way to map scores to grades. For simplicity,
        # we'll return raw counts in ranges.
        distribution = (
            Mark.objects.filter(exam_id=exam_id, subject_id=subject_id)
            .values("score")
            .annotate(count=Count("id"))
        )

        # 2. Historical Trend (Average score for this subject across recent exams)
        trends = (
            Mark.objects.filter(subject_id=subject_id)
            .values("exam__name", "exam__start_date")
            .annotate(avg=Avg("score"))
            .order_by("exam__start_date")[:6]
        )

        return Response({"distribution": distribution, "trends": trends})
