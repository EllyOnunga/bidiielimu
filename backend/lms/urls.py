from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, LessonNoteViewSet, QuizViewSet, ResourceViewSet

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'notes', LessonNoteViewSet, basename='lessonnote')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'resources', ResourceViewSet, basename='resource')

urlpatterns = [
    path('', include(router.urls)),
]
