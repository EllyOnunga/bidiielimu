from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.permissions import IsTeacher
from config.caching import cache_tenant_page
from config.tenant_security import StrictTenantPermission, TenantAwareViewSetMixin

from .models import DailyAttendance
from .serializers import DailyAttendanceSerializer


class DailyAttendanceViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = DailyAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsTeacher()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = DailyAttendance.objects.all().select_related(
            "student", "student__user", "marked_by"
        )
        if user.role_name == "STUDENT":
            qs = qs.filter(student__user=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(marked_by=self.request.user)

    @action(detail=False, methods=["get"])
    @cache_tenant_page(300)  # Cache for 5 minutes
    def stats(self, request):
        from django.db.models import Case, Count, IntegerField, When

        from students.models import Student

        today = timezone.now().date()

        # Single optimized query for attendance stats
        attendance_stats = DailyAttendance.objects.filter(date=today).aggregate(
            present=Count(
                Case(
                    When(status__in=["PRESENT", "LATE"], then=1),
                    output_field=IntegerField(),
                )
            ),
            absent=Count(
                Case(When(status="ABSENT", then=1), output_field=IntegerField())
            ),
            excused=Count(
                Case(When(status="EXCUSED", then=1), output_field=IntegerField())
            ),
            total_attendance=Count("id"),
        )

        # Get total students count
        total_students = Student.objects.filter(is_active=True).count()

        present = attendance_stats["present"] or 0
        absent = attendance_stats["absent"] or 0
        excused = attendance_stats["excused"] or 0

        avg = (
            f"{int((present / total_students) * 100)}%"
            if total_students > 0 and present > 0
            else "0%"
        )

        return Response(
            {
                "present": present,
                "absent": absent,
                "excused": excused,
                "total_students": total_students,
                "avg": avg,
                "date": today.strftime("%B %d, %Y"),
            }
        )

    @action(detail=False, methods=["get"])
    def student_stats(self, request):
        """
        Returns per-student attendance summary from the database.
        Query param: ?student_id=<id>
        Optional: ?days=30 (default 30-day window)
        """
        student_id = request.query_params.get("student_id")
        if not student_id:
            return Response(
                {"detail": "student_id query parameter is required."}, status=400
            )

        days = int(request.query_params.get("days", 30))
        since = timezone.now().date() - timezone.timedelta(days=days)

        qs = DailyAttendance.objects.filter(student_id=student_id, date__gte=since)

        total = qs.count()
        present = qs.filter(status="PRESENT").count()
        late = qs.filter(status="LATE").count()
        absent = qs.filter(status="ABSENT").count()
        excused = qs.filter(status="EXCUSED").count()
        present_total = present + late  # late still counts as attended

        rate = round((present_total / total * 100), 1) if total > 0 else 0

        return Response(
            {
                "student_id": student_id,
                "days_window": days,
                "total_records": total,
                "present": present,
                "late": late,
                "absent": absent,
                "excused": excused,
                "attendance_rate": rate,
                "since": since.strftime("%B %d, %Y"),
                "as_of": timezone.now().date().strftime("%B %d, %Y"),
            }
        )

    @action(detail=False, methods=["post"])
    def bulk_mark(self, request):
        date = request.data.get("date", timezone.now().date())
        records = request.data.get("records", [])  # List of {student_id, status}

        marked_by = request.user

        results = []
        for record in records:
            student_id = record.get("student_id")
            status_val = record.get("status", "PRESENT")

            attendance, created = DailyAttendance.objects.update_or_create(
                student_id=student_id,
                date=date,
                defaults={"status": status_val, "marked_by": marked_by},
            )
            results.append(attendance.id)

        return Response({"status": "success", "marked_count": len(results)})
