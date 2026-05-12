from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse

# Triggering reload to resolve 502 Bad Gateway
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from schools.views_theme import TenantThemeView


def health_check(request):
    return JsonResponse({"status": "ok", "version": "1.0.0", "schema": "tenant"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health_check"),
    path(
        "api/v1/ping/",
        lambda r: JsonResponse({"status": "ping-tenant"}),
        name="ping-tenant",
    ),
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/students/", include("students.urls")),
    path("api/v1/teachers/", include("teachers.urls")),
    path("api/v1/classes/", include("classes.urls")),
    path("api/v1/exams/", include("exams.urls")),
    path("api/v1/attendance/", include("attendance.urls")),
    path("api/v1/fees/", include("fees.urls")),
    path("api/v1/audit/", include("audit.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/lms/", include("lms.urls")),
    path("api/v1/inventory/", include("inventory.urls")),
    path("api/v1/analytics/", include("analytics.urls")),
    path("api/v1/reports/", include("reports.urls")),
    path("api/v1/hr/", include("hr.urls")),
    path("api/v1/schools/", include("schools.urls")),
    # Auth endpoints
    path("api/v1/auth/registration/", include("dj_rest_auth.registration.urls")),
    path("api/v1/auth/social/", include("allauth.socialaccount.urls")),
    path("api/v1/auth/2fa/", include("allauth_2fa.urls")),
    path("api/v1/auth/", include("dj_rest_auth.urls")),
    # Unauthenticated Theme Endpoint
    path("api/v1/theme/", TenantThemeView.as_view(), name="tenant-theme"),
    # API Documentation
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/v1/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"
    ),
    # Password Reset Confirm (Required by dj-rest-auth for reversing names)
    path(
        "reset-password/<uidb64>/<token>/",
        lambda r, **kwargs: JsonResponse({"status": "reset_link_valid"}),
        name="password_reset_confirm",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
