from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (AssignmentViewSet, LessonNoteViewSet, QuizViewSet,
                    ResourceViewSet, SubmissionViewSet)

router = DefaultRouter()
router.register(r"assignments", AssignmentViewSet, basename="assignment")
router.register(r"student-submissions", SubmissionViewSet, basename="submission")
router.register(r"notes", LessonNoteViewSet, basename="lessonnote")
router.register(r"quizzes", QuizViewSet, basename="quiz")
router.register(r"resources", ResourceViewSet, basename="resource")

urlpatterns = [
    path("", include(router.urls)),
]
