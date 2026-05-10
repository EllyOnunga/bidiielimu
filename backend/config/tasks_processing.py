import csv
import io
import json
import logging
from datetime import timedelta
from typing import Any, Dict, List

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_bulk_email(
    self,
    subject: str,
    template_name: str,
    context: Dict[str, Any],
    recipients: List[str],
):
    """
    Send bulk emails asynchronously
    """
    try:
        html_content = render_to_string(template_name, context)

        # Send emails in batches to avoid overwhelming the SMTP server
        batch_size = 50
        for i in range(0, len(recipients), batch_size):
            batch = recipients[i : i + batch_size]
            send_mail(
                subject=subject,
                message="",  # Plain text version could be added
                html_message=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=batch,
                fail_silently=False,
            )

        logger.info(f"Sent bulk email to {len(recipients)} recipients")
        return {"status": "success", "sent_count": len(recipients)}

    except Exception as e:
        logger.error(f"Bulk email failed: {e}")
        self.retry(countdown=60 * (2**self.request.retries))
        return {"status": "failed", "error": str(e)}


@shared_task(bind=True)
def generate_student_report(
    self, student_ids: List[int], report_type: str = "academic"
):
    """
    Generate comprehensive student reports
    """
    try:
        from attendance.models import DailyAttendance
        from exams.models import Mark
        from students.models import Student

        reports = []

        for student_id in student_ids:
            student = Student.objects.select_related("user", "stream__grade_level").get(
                id=student_id
            )

            if report_type == "academic":
                # Academic performance report
                marks = Mark.objects.filter(student=student).select_related(
                    "exam", "subject"
                )
                attendance = DailyAttendance.objects.filter(
                    student=student, date__gte=timezone.now() - timedelta(days=30)
                )

                report_data = {
                    "student_name": f"{student.first_name} {student.last_name}",
                    "admission_number": student.admission_number,
                    "class": f"{student.stream.grade_level.name} {student.stream.name}",
                    "marks": [
                        {
                            "subject": mark.subject.name,
                            "exam": mark.exam.name,
                            "score": mark.score,
                            "date": mark.exam.end_date,
                        }
                        for mark in marks
                    ],
                    "attendance_rate": calculate_attendance_rate(attendance),
                    "generated_at": timezone.now(),
                }

            reports.append(report_data)

        # Store report data or generate PDF
        return {"status": "success", "report_count": len(reports), "data": reports}

    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        self.retry(countdown=300)
        return {"status": "failed", "error": str(e)}


@shared_task(bind=True)
def bulk_import_students(self, csv_data: str, school_id: int):
    """
    Bulk import students from CSV data
    """
    try:
        from accounts.models import User
        from classes.models import Stream
        from students.models import Student

        csv_reader = csv.DictReader(io.StringIO(csv_data))
        imported_count = 0
        errors = []

        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Create user account
                user = User.objects.create_user(
                    email=row["email"],
                    password="temp_password_123",  # Should be changed by user
                    first_name=row["first_name"],
                    last_name=row["last_name"],
                )

                # Create student profile
                stream = Stream.objects.get(
                    grade_level__school_id=school_id,
                    grade_level__name=row["grade_level"],
                    name=row["stream"],
                )

                Student.objects.create(
                    user=user,
                    admission_number=row["admission_number"],
                    stream=stream,
                    date_of_birth=row.get("date_of_birth"),
                    gender=row.get("gender"),
                )

                imported_count += 1

            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")

        return {"status": "success", "imported_count": imported_count, "errors": errors}

    except Exception as e:
        logger.error(f"Bulk import failed: {e}")
        return {"status": "failed", "error": str(e)}


@shared_task(bind=True)
def process_fee_payments(self, payments_data: List[Dict[str, Any]]):
    """
    Process bulk fee payments
    """
    try:
        from accounts.models import User
        from fees.models import FeePayment, Invoice
        from students.models import Student

        processed_count = 0
        errors = []

        for payment_data in payments_data:
            try:
                student = Student.objects.get(
                    admission_number=payment_data["admission_number"]
                )
                received_by = User.objects.get(id=payment_data["received_by"])

                # Create invoice if not exists
                invoice, created = Invoice.objects.get_or_create(
                    student=student,
                    total_amount=payment_data["amount"],
                    defaults={
                        "status": "PAID" if payment_data["amount"] > 0 else "UNPAID",
                        "due_date": timezone.now() + timedelta(days=30),
                    },
                )

                # Create payment
                FeePayment.objects.create(
                    invoice=invoice,
                    student=student,
                    amount=payment_data["amount"],
                    payment_method=payment_data["payment_method"],
                    transaction_id=payment_data.get("transaction_id"),
                    received_by=received_by,
                    notes=payment_data.get("notes"),
                )

                processed_count += 1

            except Exception as e:
                errors.append(f"Payment {payment_data}: {str(e)}")

        return {
            "status": "success",
            "processed_count": processed_count,
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Fee payment processing failed: {e}")
        return {"status": "failed", "error": str(e)}


@shared_task(bind=True)
def cleanup_expired_data(self):
    """
    Clean up expired sessions, tokens, and temporary data
    """
    try:
        from django.contrib.sessions.models import Session

        from accounts.models import EmailVerificationToken

        # Clean up expired email verification tokens
        expired_tokens = EmailVerificationToken.objects.filter(
            expires_at__lt=timezone.now()
        )
        expired_count = expired_tokens.delete()[0]

        # Clean up expired sessions
        expired_sessions = Session.objects.filter(expire_date__lt=timezone.now())
        session_count = expired_sessions.delete()[0]

        # Clean up old audit logs (keep last 6 months)
        from audit.models import AuditLog

        six_months_ago = timezone.now() - timedelta(days=180)
        old_audit_logs = AuditLog.objects.filter(timestamp__lt=six_months_ago)
        audit_count = old_audit_logs.delete()[0]

        logger.info(
            f"Cleaned up {expired_count} tokens, {session_count} sessions, {audit_count} audit logs"
        )

        return {
            "status": "success",
            "tokens_cleaned": expired_count,
            "sessions_cleaned": session_count,
            "audit_logs_cleaned": audit_count,
        }

    except Exception as e:
        logger.error(f"Data cleanup failed: {e}")
        return {"status": "failed", "error": str(e)}


@shared_task(bind=True)
def generate_analytics_report(self, school_id: int, report_period: str = "monthly"):
    """
    Generate comprehensive analytics reports
    """
    try:
        from django.db.models import Avg, Count, Sum

        from attendance.models import DailyAttendance
        from exams.models import Mark
        from fees.models import FeePayment
        from students.models import Student
        from teachers.models import Teacher

        # Calculate date range
        if report_period == "monthly":
            start_date = timezone.now().replace(day=1)
        elif report_period == "quarterly":
            current_month = timezone.now().month
            start_month = ((current_month - 1) // 3) * 3 + 1
            start_date = timezone.now().replace(month=start_month, day=1)
        else:  # yearly
            start_date = timezone.now().replace(month=1, day=1)

        # Student analytics
        student_stats = Student.objects.filter(created_at__gte=start_date).aggregate(
            total_students=Count("id"),
            active_students=Count("id", filter={"is_active": True}),
        )

        # Teacher analytics
        teacher_stats = Teacher.objects.filter(joining_date__gte=start_date).aggregate(
            total_teachers=Count("id"),
            active_teachers=Count("id", filter={"is_active": True}),
        )

        # Academic performance
        academic_stats = Mark.objects.filter(
            exam__start_date__gte=start_date
        ).aggregate(
            avg_score=Avg("score"),
            total_exams=Count("exam", distinct=True),
            total_marks=Count("id"),
        )

        # Attendance analytics
        attendance_stats = DailyAttendance.objects.filter(
            date__gte=start_date
        ).aggregate(
            total_days=Count("date", distinct=True),
            present_count=Count("id", filter={"status": "PRESENT"}),
            absent_count=Count("id", filter={"status": "ABSENT"}),
        )

        # Financial analytics
        financial_stats = FeePayment.objects.filter(
            payment_date__gte=start_date
        ).aggregate(
            total_revenue=Sum("amount"),
            payment_count=Count("id"),
        )

        report_data = {
            "period": report_period,
            "start_date": start_date,
            "generated_at": timezone.now(),
            "student_stats": student_stats,
            "teacher_stats": teacher_stats,
            "academic_stats": academic_stats,
            "attendance_stats": attendance_stats,
            "financial_stats": financial_stats,
        }

        # Store report or send notification
        return {"status": "success", "report_data": report_data}

    except Exception as e:
        logger.error(f"Analytics report generation failed: {e}")
        return {"status": "failed", "error": str(e)}


def calculate_attendance_rate(attendance_records):
    """Helper function to calculate attendance rate"""
    if not attendance_records:
        return 0

    present_count = sum(
        1 for record in attendance_records if record.status in ["PRESENT", "LATE"]
    )
    return (present_count / len(attendance_records)) * 100
