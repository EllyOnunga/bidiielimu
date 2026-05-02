from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentReportViewSet

router = DefaultRouter()
router.register(r'student-reports', StudentReportViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
