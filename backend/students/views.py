from config.tenant_security import (StrictTenantPermission,
                                    TenantAwareViewSetMixin)
from django.contrib.auth import get_user_model
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Student
from .serializers import StudentSerializer
from .services_portal import PortalService

User = get_user_model()


class PortalDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = PortalService.get_parent_dashboard_data(request.user)
        return Response(data)


class StudentViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated, StrictTenantPermission]
    search_fields = ["first_name", "last_name", "admission_number", "user__email"]

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.all()

        if user.role_name == "STUDENT":
            qs = qs.filter(user=user)

        qs = qs.select_related("stream", "stream__grade_level").prefetch_related(
            "guardians", "medical_record"
        )

        stream_id = self.request.query_params.get("stream")
        if stream_id:
            qs = qs.filter(stream_id=stream_id)

        grade_id = self.request.query_params.get("grade")
        if grade_id:
            qs = qs.filter(stream__grade_level_id=grade_id)

        return qs

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            import traceback

            print(f"[CRITICAL ERROR] StudentViewSet create: {str(e)}")
            traceback.print_exc()
            raise e

    @action(detail=False, methods=["get"])
    def my_children(self, request):
        if request.user.role_name != "PARENT":
            return Response(
                {"detail": "Only parents can view their children via this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        children = (
            Student.objects.filter(guardians__email=request.user.email)
            .select_related("stream", "stream__grade_level")
            .distinct()
        )

        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def report_card(self, request, pk=None):
        student = self.get_object()
        exam_id = request.query_params.get("exam_id")

        from exams.models import Exam, GradingSystem, Mark

        # Get the latest exam if none provided
        if exam_id:
            try:
                exam = Exam.objects.get(id=exam_id)
            except Exam.DoesNotExist:
                return Response(
                    {"detail": "Exam not found."}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            exam = Exam.objects.order_by("-start_date").first()
            if not exam:
                return Response(
                    {"detail": "No exams found for this school."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Get all marks for this student and exam
        marks = Mark.objects.filter(student=student, exam=exam).select_related(
            "subject"
        )

        # Use the exam's specific grading system
        grading_system = exam.grading_system or GradingSystem.objects.first()
        thresholds = grading_system.thresholds.all() if grading_system else []

        results = []
        total_score = 0
        total_points = 0

        def get_grade_info(score):
            if not thresholds:
                return {"grade": "-", "points": 0, "remarks": ""}

            # Round score to nearest integer for threshold comparison
            # or handle it as a float range.
            # We'll use the threshold ranges as inclusive of the rounded score.
            rounded_score = round(float(score))

            for t in thresholds:
                if t.min_score <= rounded_score <= t.max_score:
                    return {"grade": t.grade, "points": t.points, "remarks": t.remarks}

            # Fallback for scores slightly out of bounds
            if thresholds:
                sorted_t = sorted(thresholds, key=lambda x: x.min_score)
                if rounded_score < sorted_t[0].min_score:
                    return {
                        "grade": sorted_t[0].grade,
                        "points": sorted_t[0].points,
                        "remarks": sorted_t[0].remarks,
                    }
                if rounded_score > sorted_t[-1].max_score:
                    return {
                        "grade": sorted_t[-1].grade,
                        "points": sorted_t[-1].points,
                        "remarks": sorted_t[-1].remarks,
                    }

            return {"grade": "-", "points": 0, "remarks": ""}

        for mark in marks:
            score = float(mark.score)
            total_score += score
            grade_info = get_grade_info(score)
            total_points += grade_info["points"]

            results.append(
                {
                    "subject_id": mark.subject.id,
                    "subject_name": mark.subject.name,
                    "score": score,
                    "grade": grade_info["grade"],
                    "points": grade_info["points"],
                    "remarks": grade_info["remarks"] or mark.teacher_remarks,
                }
            )

        mean_score = total_score / len(results) if results else 0
        mean_grade_info = get_grade_info(mean_score)

        # Fetch Ranking info
        from exams.models import ExamRanking

        ranking = ExamRanking.objects.filter(student=student, exam=exam).first()

        # Determine if we should show positions (Only for non-CBC)
        show_positions = student.curriculum != "CBC"

        summary = {
            "total_score": float(ranking.total_marks) if ranking else total_score,
            "mean_score": (
                float(ranking.mean_score) if ranking else round(mean_score, 2)
            ),
            "total_points": total_points,
            "mean_grade": ranking.mean_grade if ranking else mean_grade_info["grade"],
            "overall_remarks": mean_grade_info["remarks"],
        }

        if show_positions and ranking:
            summary.update(
                {
                    "class_position": ranking.class_position,
                    "stream_position": ranking.stream_position,
                    "total_in_class": ranking.total_students_in_class,
                    "total_in_stream": ranking.total_students_in_stream,
                }
            )

        # 3. Attendance Statistics
        from attendance.models import DailyAttendance

        attendance_records = DailyAttendance.objects.filter(student=student)
        present_count = attendance_records.filter(status="PRESENT").count()
        absent_count = attendance_records.filter(status="ABSENT").count()
        total_days = present_count + absent_count
        attendance_summary = {
            "present_days": present_count,
            "absent_days": absent_count,
            "total_days": total_days,
            "percentage": (
                round((present_count / total_days * 100), 1) if total_days > 0 else 100
            ),
        }

        # 4. Teacher/Principal Remarks from StudentReport
        from reports.models import StudentReport

        report_meta = StudentReport.objects.filter(student=student, exam=exam).first()

        remarks = {
            "teacher": (
                report_meta.teacher_comment
                if report_meta
                else "No teacher comment provided."
            ),
            "principal": (
                report_meta.principal_comment
                if report_meta
                else "No principal comment provided."
            ),
            "is_official": report_meta.status == "PUBLISHED" if report_meta else False,
        }

        return Response(
            {
                "student": {
                    "name": f"{student.first_name} {student.last_name}",
                    "admission_number": student.admission_number,
                    "stream": student.stream.name if student.stream else None,
                    "grade_level": (
                        student.stream.grade_level.name if student.stream else None
                    ),
                    "class_teacher": (
                        student.stream.teacher.full_name
                        if (student.stream and student.stream.teacher)
                        else "Not Assigned"
                    ),
                    "email": student.user.email,
                    "photo": student.photo.url if student.photo else None,
                    "curriculum": student.curriculum,
                    "guardians": [
                        {
                            "first_name": g.first_name,
                            "last_name": g.last_name,
                            "phone_number": g.phone_number,
                        }
                        for g in student.guardians.all()
                    ],
                },
                "exam": {
                    "id": exam.id,
                    "name": exam.name,
                    "term": exam.term,
                    "academic_year": exam.academic_year,
                },
                "results": results,
                "summary": summary,
                "attendance": attendance_summary,
                "remarks": remarks,
                "show_positions": show_positions,
            }
        )
