from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .services_performance import PerformanceAnalyticsService
from .models import PredictiveRisk
from .serializers import PredictiveRiskSerializer
from .services_correlation import CorrelationService

class DashboardAnalyticsView(APIView):
    def get(self, request):
        kpis = PerformanceAnalyticsService.get_school_kpis()
        trends = PerformanceAnalyticsService.get_cohort_trends(grade_level_id=1)
        
        at_risk = PredictiveRisk.objects.filter(risk_level__in=['HIGH', 'CRITICAL']).order_by('-confidence_score')[:5]
        
        return Response({
            "kpis": kpis,
            "trends": trends,
            "at_risk": PredictiveRiskSerializer(at_risk, many=True).data
        })

class SubjectDistributionView(APIView):
    def get(self, request, subject_id, exam_id):
        distribution = PerformanceAnalyticsService.get_subject_performance_distribution(subject_id, exam_id)
        return Response({
            "subject_id": subject_id,
            "exam_id": exam_id,
            "distribution": distribution
        })

class TeacherPerformanceView(APIView):
    def get(self, request, teacher_id):
        metrics = PerformanceAnalyticsService.get_teacher_effectiveness(teacher_id)
        return Response(metrics)

class CorrelationAnalyticsView(APIView):
    def get(self, request):
        data_points = CorrelationService.get_attendance_performance_data()
        correlation = CorrelationService.calculate_correlation_coefficient(data_points)
        subject_correlations = CorrelationService.get_subject_specific_correlations()
        
        # Determine insight based on correlation
        insight = "No clear correlation detected yet."
        if correlation > 0.7:
            insight = "Strong positive correlation: Attendance is the primary driver of performance."
        elif correlation > 0.4:
            insight = "Moderate correlation: Attendance significantly impacts results."
            
        return Response({
            "data": data_points,
            "correlation": correlation,
            "subject_correlations": subject_correlations,
            "insight": insight
        })

