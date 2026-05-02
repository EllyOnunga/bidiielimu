from django.db import models
from django.conf import settings
from students.models import Student

class PredictiveRisk(models.Model):
    LEVEL_CHOICES = (
        ('LOW', 'Low Risk'),
        ('MEDIUM', 'Medium Risk'),
        ('HIGH', 'High Risk'),
        ('CRITICAL', 'Critical Risk'),
    )

    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='risk_profile')
    risk_level = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='LOW')
    confidence_score = models.FloatField(default=0.0) # 0.0 to 1.0
    reason_summary = models.JSONField(default=list) # List of factors (e.g. "Low attendance", "Math scores declining")
    last_updated = models.DateTimeField(auto_now=True)
    
    # Intervention tracking
    intervention_status = models.CharField(max_length=20, default='NONE') # NONE, PENDING, ACTIVE, COMPLETED
    intervention_notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.first_name} - {self.risk_level} ({self.confidence_score * 100}%)"
