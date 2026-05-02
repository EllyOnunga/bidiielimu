from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, PortalDashboardView
from .views_import import StudentImportView, StudentImportTemplateView

router = DefaultRouter()
router.register(r'', StudentViewSet, basename='student')

urlpatterns = [
    path('import/', StudentImportView.as_view(), name='student-import'),
    path('import/template/', StudentImportTemplateView.as_view(), name='student-import-template'),
    path('portal-dashboard/', PortalDashboardView.as_view(), name='portal-dashboard'),
    path('', include(router.urls)),
]
