from django.urls import path
from .views import (
    DashboardAnalyticsView, SubjectDistributionView, 
    TeacherPerformanceView, CorrelationAnalyticsView
)

urlpatterns = [
    path('dashboard/', DashboardAnalyticsView.as_view(), name='analytics-dashboard'),
    path('subject-dist/<int:subject_id>/<int:exam_id>/', SubjectDistributionView.as_view(), name='subject-dist'),
    path('teacher-eval/<int:teacher_id>/', TeacherPerformanceView.as_view(), name='teacher-eval'),
    path('correlation/', CorrelationAnalyticsView.as_view(), name='attendance-correlation'),
]
