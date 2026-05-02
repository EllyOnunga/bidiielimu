from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GradeLevelViewSet, StreamViewSet, SubjectViewSet, 
    SubjectAssignmentViewSet, ClassroomViewSet, ScheduleSlotViewSet
)

from .views_timetable import TimetableAutoGenerateView, TimetableConflictView

router = DefaultRouter()
router.register(r'grades', GradeLevelViewSet, basename='gradelevel')
router.register(r'streams', StreamViewSet, basename='stream')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'subject-assignments', SubjectAssignmentViewSet, basename='subjectassignment')
router.register(r'classrooms', ClassroomViewSet, basename='classroom')
router.register(r'schedule-slots', ScheduleSlotViewSet, basename='scheduleslot')

urlpatterns = [
    path('timetable/generate/', TimetableAutoGenerateView.as_view(), name='timetable-generate'),
    path('timetable/check-conflict/', TimetableConflictView.as_view(), name='timetable-check-conflict'),
    path('', include(router.urls)),
]
