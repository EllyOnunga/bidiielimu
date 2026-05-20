from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.urls import include, path, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from schools.views_theme import TenantThemeView


def health_check(request):
    return JsonResponse({"status": "ok", "version": settings.VERSION, "schema": "public"})


urlpatterns = [
    path(
        "test-ping/",
        lambda r: JsonResponse({"status": "super-public"}),
        name="super-public",
    ),
    path("health/", health_check, name="health_check"),
    re_path(
        r"ping", lambda r: JsonResponse({
            "status": "ping-regex",
            "version": settings.VERSION,
            "environment": "development" if settings.DEBUG else "production"
        }), name="ping-regex"
    ),
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/schools/", include("schools.urls")),
    path("api/v1/blog/", include("blog.urls")),
    path("api/v1/theme/", TenantThemeView.as_view(), name="public-theme"),
    # These routes are now dynamically switched by Middleware if accessed on
    # public domain
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/analytics/", include("analytics.urls")),
    path("api/v1/students/", include("students.urls")),
    path("api/v1/teachers/", include("teachers.urls")),
    path("api/v1/classes/", include("classes.urls")),
    path("api/v1/exams/", include("exams.urls")),
    path("api/v1/attendance/", include("attendance.urls")),
    path("api/v1/fees/", include("fees.urls")),
    path("api/v1/audit/", include("audit.urls")),
    path("api/v1/lms/", include("lms.urls")),
    path("api/v1/inventory/", include("inventory.urls")),
    path("api/v1/reports/", include("reports.urls")),
    path("api/v1/hr/", include("hr.urls")),
    # Auth endpoints
    path("api/v1/auth/registration/", include("dj_rest_auth.registration.urls")),
    path("api/v1/auth/social/", include("allauth.socialaccount.urls")),
    path("api/v1/auth/2fa/", include("allauth_2fa.urls")),
    path("api/v1/auth/", include("dj_rest_auth.urls")),
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
    path("health/", lambda r: JsonResponse({"status": "ok"}), name="health"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
