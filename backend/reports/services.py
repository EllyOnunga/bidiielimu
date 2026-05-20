from attendance.models import DailyAttendance
from exams.models import ExamRanking, GradeThreshold, Mark
from students.models import Student

from .models import StudentReport


class ReportCardService:
    @staticmethod
    def get_report_card_data(student_id, exam_id):
        student = Student.objects.select_related("current_class", "stream").get(
            id=student_id
        )

        # 1. Get Marks with Grades
        marks_qs = Mark.objects.filter(
            student_id=student_id, exam_id=exam_id
        ).select_related("subject")

        # Get grading system for this exam to calculate grades if not present
        exam = marks_qs.first().exam if marks_qs.exists() else None
        thresholds = []
        if exam and exam.grading_system:
            thresholds = list(
                GradeThreshold.objects.filter(
                    grading_system=exam.grading_system
                ).order_by("-min_score")
            )

        def get_grade(score):
            for t in thresholds:
                if score >= t.min_score:
                    return t.grade, t.remarks
            return "E", "Poor"

        subjects_data = []
        for mark in marks_qs:
            grade, remarks = get_grade(mark.score)
            subjects_data.append(
                {
                    "subject": mark.subject.name,
                    "score": float(mark.score),
                    "grade": grade,
                    "remarks": remarks,
                    "teacher": (
                        mark.subject.teacher.full_name
                        if hasattr(mark.subject, "teacher") and mark.subject.teacher
                        else "N/A"
                    ),
                }
            )

        # 2. Get Ranking Info
        ranking = ExamRanking.objects.filter(
            student_id=student_id, exam_id=exam_id
        ).first()
        if not ranking:
            try:
                from exams.services_ranking import RankingService

                RankingService.compute_exam_ranks(exam_id)
                ranking = ExamRanking.objects.filter(
                    student_id=student_id, exam_id=exam_id
                ).first()
            except Exception:
                pass

        ranking_data = {
            "total_marks": float(ranking.total_marks) if ranking else 0,
            "mean_score": float(ranking.mean_score) if ranking else 0,
            "mean_grade": ranking.mean_grade if ranking else "N/A",
            "class_position": ranking.class_position if ranking else None,
            "stream_position": ranking.stream_position if ranking else None,
            "total_students": ranking.total_students_in_class if ranking else 0,
        }

        # 3. Get Attendance Summary
        # We assume the exam period covers the term
        attendance_records = DailyAttendance.objects.filter(student_id=student_id)
        present_days = attendance_records.filter(status="PRESENT").count()
        total_days = attendance_records.count()
        attendance_data = {
            "present": present_days,
            "total": total_days,
            "percentage": (present_days / total_days * 100) if total_days > 0 else 100,
        }

        # 4. Get Remarks
        report = StudentReport.objects.filter(
            student_id=student_id, exam_id=exam_id
        ).first()
        remarks_data = {
            "teacher_comment": (
                report.teacher_comment if report else "No teacher comment provided."
            ),
            "principal_comment": (
                report.principal_comment if report else "No principal comment provided."
            ),
            "status": report.status if report else "DRAFT",
        }

        return {
            "student": {
                "name": student.full_name,
                "admission_number": student.admission_number,
                "class": f"{
                    student.current_class.name} {
                    student.stream.name if student.stream else ''}",
                "photo": student.photo.url if student.photo else None,
            },
            "exam": {
                "name": exam.name if exam else "Term Assessment",
                "term": exam.term if exam else "1",
                "year": exam.academic_year if exam else "2026",
            },
            "subjects": subjects_data,
            "ranking": ranking_data,
            "attendance": attendance_data,
            "remarks": remarks_data,
        }
