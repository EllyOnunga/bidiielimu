import logging
from datetime import timedelta
from typing import Any, Dict, List

import numpy as np
from django.db.models import Count, Q
from django.utils import timezone
from sklearn.linear_model import LinearRegression

logger = logging.getLogger(__name__)


class AdvancedAnalyticsService:
    """
    Advanced analytics with predictive modeling and AI insights
    """

    @staticmethod
    def predict_student_performance(
        student_id: int, subject_id: int, school_id: int
    ) -> Dict[str, Any]:
        """
        Predict student performance in a subject using historical data
        """
        from exams.models import Mark

        # Get student's historical performance
        marks = (
            Mark.objects.filter(
                student_id=student_id, subject_id=subject_id, exam__school_id=school_id
            )
            .order_by("exam__start_date")
            .values_list("score", flat=True)
        )

        if len(marks) < 3:
            return {
                "prediction": None,
                "confidence": 0,
                "reason": "Insufficient historical data",
            }

        # Simple linear regression for trend prediction
        X = np.array(range(len(marks))).reshape(-1, 1)
        y = np.array(marks)

        if len(X) > 1:
            model = LinearRegression()
            model.fit(X, y)

            # Predict next score
            next_score = model.predict([[len(marks)]])[0]
            next_score = max(0, min(100, next_score))  # Clamp to 0-100

            # Calculate trend
            trend = "improving" if model.coef_[0] > 0 else "declining"

            return {
                "prediction": round(float(next_score), 1),
                "confidence": 0.7,  # Simplified confidence score
                "trend": trend,
                "historical_scores": list(marks),
            }

        return {
            "prediction": None,
            "confidence": 0,
            "reason": "Unable to calculate trend",
        }

    @staticmethod
    def analyze_attendance_risks(school_id: int) -> List[Dict[str, Any]]:
        """
        Identify students at risk of poor attendance
        """

        from students.models import Student

        # Get attendance data for the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)

        students_with_attendance = (
            Student.objects.filter(school_id=school_id, is_active=True)
            .annotate(
                total_days=Count(
                    "daily_attendance",
                    filter=Q(daily_attendance__date__gte=thirty_days_ago),
                ),
                present_days=Count(
                    "daily_attendance",
                    filter=Q(
                        daily_attendance__date__gte=thirty_days_ago,
                        daily_attendance__status__in=["PRESENT", "LATE"],
                    ),
                ),
            )
            .filter(total_days__gt=0)
        )

        risks = []
        for student in students_with_attendance:
            attendance_rate = (student.present_days / student.total_days) * 100

            if attendance_rate < 75:
                risk_level = "high" if attendance_rate < 60 else "medium"
                risks.append(
                    {
                        "student_id": student.id,
                        "student_name": f"{student.first_name} {student.last_name}",
                        "attendance_rate": round(attendance_rate, 1),
                        "total_days": student.total_days,
                        "present_days": student.present_days,
                        "risk_level": risk_level,
                        "recommendation": (
                            "Schedule parent meeting"
                            if risk_level == "high"
                            else "Send reminder notice"
                        ),
                    }
                )

        return sorted(risks, key=lambda x: x["attendance_rate"])

    @staticmethod
    def generate_performance_insights(school_id: int) -> List[Dict[str, Any]]:
        """
        Generate AI-powered insights from performance data
        """
        from django.db.models import Avg, StdDev
        from exams.models import Mark

        insights = []

        # Subject performance analysis
        subject_performance = (
            Mark.objects.filter(
                exam__school_id=school_id,
                exam__start_date__gte=timezone.now() - timedelta(days=180),
            )
            .values("subject__name")
            .annotate(
                avg_score=Avg("score"),
                std_dev=StdDev("score"),
                exam_count=Count("exam", distinct=True),
            )
            .filter(exam_count__gte=3)
        )

        for subject_data in subject_performance:
            if subject_data["std_dev"] and subject_data["std_dev"] > 15:
                insights.append(
                    {
                        "type": "subject_performance",
                        "title": f"High Performance Variance in {
                            subject_data['subject__name']}",
                        "description": f"Students show significant performance differences in {
                            subject_data['subject__name']} (SD: {
                            subject_data['std_dev']:.1f}). Consider additional support or curriculum review.",
                        "severity": "medium",
                        "data": subject_data,
                    }
                )

        # Class performance trends
        class_performance = (
            Mark.objects.filter(exam__school_id=school_id)
            .values("student__stream__name")
            .annotate(
                avg_score=Avg("score"), student_count=Count("student", distinct=True)
            )
            .order_by("-avg_score")
        )

        if class_performance:
            top_class = class_performance.first()
            bottom_class = class_performance.last()

            if (
                top_class
                and bottom_class
                and top_class["avg_score"] - bottom_class["avg_score"] > 20
            ):
                insights.append(
                    {
                        "type": "class_comparison",
                        "title": "Significant Performance Gap Between Classes",
                        "description": f"{
                            top_class['stream__name']} leads with {
                            top_class['avg_score']:.1f} avg score, while {
                            bottom_class['stream__name']} trails at {
                            bottom_class['avg_score']:.1f}. Consider resource redistribution.",
                        "severity": "high",
                        "data": {"top_class": top_class, "bottom_class": bottom_class},
                    }
                )

        # Teacher effectiveness insights
        teacher_performance = (
            Mark.objects.filter(exam__school_id=school_id)
            .values("teacher_remarks")
            .annotate(count=Count("id"))
            .exclude(teacher_remarks__isnull=True)
            .exclude(teacher_remarks="")
        )

        if teacher_performance:
            total_marks = sum(tp["count"] for tp in teacher_performance)
            remarks_percentage = (
                total_marks / Mark.objects.filter(exam__school_id=school_id).count()
            ) * 100

            if remarks_percentage < 20:
                insights.append(
                    {
                        "type": "teacher_feedback",
                        "title": "Low Teacher Feedback Rate",
                        "description": f"Only {
                            remarks_percentage:.1f}% of marks have teacher comments. Encourage more detailed feedback for student improvement.",
                        "severity": "low",
                        "data": {"remarks_percentage": remarks_percentage},
                    }
                )

        return insights

    @staticmethod
    def forecast_enrollment_trends(
        school_id: int, months_ahead: int = 6
    ) -> Dict[str, Any]:
        """
        Forecast enrollment trends using time series analysis
        """
        from students.models import Student

        # Get enrollment data by month for the last 12 months
        enrollment_data = []
        for i in range(12, 0, -1):
            start_date = timezone.now() - timedelta(days=30 * i)
            end_date = timezone.now() - timedelta(days=30 * (i - 1))

            count = Student.objects.filter(
                school_id=school_id,
                enrollment_date__gte=start_date,
                enrollment_date__lt=end_date,
            ).count()

            enrollment_data.append(count)

        if len(enrollment_data) < 6:
            return {
                "forecast": None,
                "reason": "Insufficient historical data for forecasting",
            }

        # Simple linear regression for trend
        X = np.array(range(len(enrollment_data))).reshape(-1, 1)
        y = np.array(enrollment_data)

        model = LinearRegression()
        model.fit(X, y)

        # Forecast future months
        future_X = np.array(
            range(len(enrollment_data), len(enrollment_data) + months_ahead)
        ).reshape(-1, 1)
        forecast = model.predict(future_X)

        # Calculate trend
        slope = model.coef_[0]
        trend = (
            "increasing" if slope > 0.5 else "stable" if slope > -0.5 else "decreasing"
        )

        return {
            "historical_data": enrollment_data,
            "forecast": [max(0, int(f)) for f in forecast],
            "trend": trend,
            "confidence": 0.6,  # Simplified confidence
            "slope": float(slope),
        }

    @staticmethod
    def detect_anomalies(school_id: int) -> List[Dict[str, Any]]:
        """
        Detect statistical anomalies in school data
        """
        from attendance.models import DailyAttendance
        from exams.models import Mark

        anomalies = []

        # Check for unusual grade distributions
        recent_marks = Mark.objects.filter(
            exam__school_id=school_id,
            exam__start_date__gte=timezone.now() - timedelta(days=30),
        ).values_list("score", flat=True)

        if recent_marks:
            scores = list(recent_marks)
            mean_score = np.mean(scores)
            std_score = np.std(scores)

            # Flag if standard deviation is unusually high or low
            if std_score < 5:  # Too consistent
                anomalies.append(
                    {
                        "type": "grade_consistency",
                        "title": "Unusually Consistent Grades",
                        "description": "Grade distribution shows very low variance. May indicate grading issues.",
                        "severity": "medium",
                        "data": {"mean": mean_score, "std": std_score},
                    }
                )
            elif std_score > 25:  # Too varied
                anomalies.append(
                    {
                        "type": "grade_variance",
                        "title": "High Grade Variance Detected",
                        "description": "Extreme differences in student performance. Review assessment methods.",
                        "severity": "high",
                        "data": {"mean": mean_score, "std": std_score},
                    }
                )

        # Check for attendance anomalies
        today = timezone.now().date()
        yesterday_attendance = DailyAttendance.objects.filter(
            student__school_id=school_id, date=today - timedelta(days=1)
        )

        if yesterday_attendance:
            absent_rate = (
                yesterday_attendance.filter(status="ABSENT").count()
                / yesterday_attendance.count()
            ) * 100

            if absent_rate > 30:
                anomalies.append(
                    {
                        "type": "high_absenteeism",
                        "title": "High Absenteeism Alert",
                        "description": f"{
                            absent_rate:.1f}% of students were absent yesterday. Investigate possible issues.",
                        "severity": "high",
                        "data": {"absent_rate": absent_rate},
                    }
                )

        return anomalies
