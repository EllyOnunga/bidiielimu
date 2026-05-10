from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (ExamViewSet, GradeThresholdViewSet, GradingSystemViewSet,
                    MarkViewSet)

router = DefaultRouter()
router.register(r"grading-systems", GradingSystemViewSet, basename="gradingsystem")
router.register(r"grade-thresholds", GradeThresholdViewSet, basename="gradethreshold")
router.register(r"exams", ExamViewSet, basename="exam")
router.register(r"marks", MarkViewSet, basename="mark")

urlpatterns = [
    path("", include(router.urls)),
]
