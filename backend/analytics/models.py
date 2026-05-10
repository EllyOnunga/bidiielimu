from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class AnalyticsReport(models.Model):
    """
    Stored analytics reports with caching
    """

    REPORT_TYPES = (
        ("STUDENT_PERFORMANCE", "Student Performance Analysis"),
        ("ATTENDANCE_TRENDS", "Attendance Trends"),
        ("FINANCIAL_ANALYTICS", "Financial Analytics"),
        ("TEACHER_EFFICIENCY", "Teacher Efficiency Metrics"),
        ("SCHOOL_OVERVIEW", "School Overview Dashboard"),
    )

    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="analytics_reports"
    )
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    report_period = models.CharField(
        max_length=20, default="monthly"
    )  # daily, weekly, monthly, quarterly, yearly
    start_date = models.DateField()
    end_date = models.DateField()
    data = models.JSONField()  # Store computed analytics data
    insights = models.JSONField(null=True, blank=True)  # AI-generated insights
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # Cache expiry

    class Meta:
        unique_together = (
            "school",
            "report_type",
            "report_period",
            "start_date",
            "end_date",
        )
        indexes = [
            models.Index(fields=["school", "report_type", "created_at"]),
            models.Index(fields=["expires_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Set expiry based on report type
            if self.report_period == "daily":
                self.expires_at = timezone.now() + timedelta(hours=24)
            elif self.report_period == "weekly":
                self.expires_at = timezone.now() + timedelta(days=7)
            elif self.report_period == "monthly":
                self.expires_at = timezone.now() + timedelta(days=30)
            else:
                self.expires_at = timezone.now() + timedelta(days=90)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


class PredictiveModel(models.Model):
    """
    Machine learning models for predictive analytics
    """

    MODEL_TYPES = (
        ("GRADE_PREDICTION", "Grade Prediction"),
        ("ATTENDANCE_RISK", "Attendance Risk Assessment"),
        ("DROPOUT_RISK", "Dropout Risk Prediction"),
        ("PERFORMANCE_TRENDS", "Performance Trend Analysis"),
    )

    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="predictive_models"
    )
    model_type = models.CharField(max_length=30, choices=MODEL_TYPES)
    model_data = models.JSONField()  # Store model parameters/weights
    accuracy_score = models.DecimalField(max_digits=5, decimal_places=4, null=True)
    training_date = models.DateTimeField()
    last_used = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("school", "model_type")
        indexes = [
            models.Index(fields=["school", "model_type", "is_active"]),
        ]

    def __str__(self):
        return f"{self.school.name} - {self.get_model_type_display()}"


class DataInsight(models.Model):
    """
    AI-generated insights from analytics data
    """

    INSIGHT_TYPES = (
        ("TREND", "Trend Analysis"),
        ("ALERT", "Performance Alert"),
        ("RECOMMENDATION", "Improvement Recommendation"),
        ("PREDICTION", "Predictive Insight"),
    )

    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="data_insights"
    )
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    data_source = models.CharField(
        max_length=100
    )  # Which data this insight is based on
    confidence_score = models.DecimalField(
        max_digits=3, decimal_places=2, null=True
    )  # 0.00 to 1.00
    actionable = models.BooleanField(default=False)
    action_items = models.JSONField(null=True, blank=True)  # Suggested actions
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["school", "insight_type", "created_at"]),
            models.Index(fields=["actionable", "created_at"]),
        ]

    def __str__(self):
        return f"{self.school.name} - {self.title}"


class MetricSnapshot(models.Model):
    """
    Daily snapshots of key metrics for trend analysis
    """

    school = models.ForeignKey(
        "schools.School", on_delete=models.CASCADE, related_name="metric_snapshots"
    )
    date = models.DateField()
    metric_name = models.CharField(max_length=100)
    metric_value = models.DecimalField(max_digits=15, decimal_places=2)
    metadata = models.JSONField(null=True, blank=True)  # Additional context
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("school", "date", "metric_name")
        indexes = [
            models.Index(fields=["school", "metric_name", "date"]),
            models.Index(fields=["date", "metric_name"]),
        ]

    def __str__(self):
        return f"{self.school.name} - {self.metric_name} - {self.date}"


class PredictiveRisk(models.Model):
    """
    Individual student risk assessments generated by predictive models
    """

    RISK_LEVELS = (
        ("LOW", "Low Risk"),
        ("MEDIUM", "Medium Risk"),
        ("HIGH", "High Risk"),
        ("CRITICAL", "Critical Risk"),
    )

    student = models.ForeignKey(
        "students.Student", on_delete=models.CASCADE, related_name="predictive_risks"
    )
    risk_level = models.CharField(max_length=10, choices=RISK_LEVELS, default="LOW")
    confidence_score = models.DecimalField(
        max_digits=3, decimal_places=2
    )  # 0.00 to 1.00
    factors = models.JSONField(help_text="Key factors contributing to this risk level.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-confidence_score"]
        indexes = [
            models.Index(fields=["risk_level", "confidence_score"]),
        ]

    def __str__(self):
        return f"{self.student} - {self.risk_level} ({self.confidence_score})"
