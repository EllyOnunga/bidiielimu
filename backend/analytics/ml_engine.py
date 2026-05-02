import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from .models import PredictiveRisk
from exams.models import Mark
from attendance.models import DailyAttendance
from django.db.models import Avg

class EarlyWarningEngine:
    @staticmethod
    def run_prediction_for_student(student):
        # 1. Feature Extraction
        avg_score = Mark.objects.filter(student=student).aggregate(Avg('score'))['score__avg'] or 0
        attendance_rate = EarlyWarningEngine.get_attendance_rate(student)
        
        # 2. Mock ML Inference (Simulating a trained model)
        # In production, we would load a pickled model here
        risk_score = 0.0
        reasons = []
        
        if avg_score < 40:
            risk_score += 0.6
            reasons.append("Critically low academic performance")
        elif avg_score < 55:
            risk_score += 0.3
            reasons.append("Declining exam scores")

        if attendance_rate < 75:
            risk_score += 0.4
            reasons.append("Chronic absenteeism detected")
        elif attendance_rate < 85:
            risk_score += 0.2
            reasons.append("Attendance below school standard")

        # 3. Determine Level
        risk_score = min(1.0, risk_score)
        level = 'LOW'
        if risk_score > 0.8: level = 'CRITICAL'
        elif risk_score > 0.5: level = 'HIGH'
        elif risk_score > 0.3: level = 'MEDIUM'

        # 4. Save/Update Profile
        risk, _ = PredictiveRisk.objects.get_or_create(student=student)
        risk.risk_level = level
        risk.confidence_score = risk_score
        risk.reason_summary = reasons
        risk.save()
        
        return risk

    @staticmethod
    def get_attendance_rate(student):
        total = DailyAttendance.objects.filter(student=student).count()
        if total == 0: return 100
        present = DailyAttendance.objects.filter(student=student, status='PRESENT').count()
        return (present / total) * 100

    @staticmethod
    def train_model():
        # This would be a background task to refine model parameters 
        # based on final end-of-year outcomes.
        pass
