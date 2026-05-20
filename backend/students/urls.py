from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PortalDashboardView, StudentViewSet
from .views_import import StudentImportTemplateView, StudentImportView, StudentImportStatusView

router = DefaultRouter()
router.register(r"", StudentViewSet, basename="student")

urlpatterns = [
    path("import/", StudentImportView.as_view(), name="student-import"),
    path(
        "import/status/<str:task_id>/",
        StudentImportStatusView.as_view(),
        name="student-import-status"
    ),
    path(
        "import/template/",
        StudentImportTemplateView.as_view(),
        name="student-import-template",
    ),
    path("portal-dashboard/", PortalDashboardView.as_view(), name="portal-dashboard"),
    path("", include(router.urls)),
]

