"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from config.views_health import (HealthCheckView, LivenessCheckView,
                                 MetricsView, ReadinessCheckView)
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import (SpectacularAPIView, SpectacularRedocView,
                                   SpectacularSwaggerView)
from graphene_django.views import GraphQLView
from schools.views_theme import TenantThemeView


def health_check(request):
    return JsonResponse({"status": "ok", "version": "1.0.0"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", HealthCheckView.as_view(), name="health_check"),
    path("ready/", ReadinessCheckView.as_view(), name="readiness_check"),
    path("live/", LivenessCheckView.as_view(), name="liveness_check"),
    path("metrics/", MetricsView.as_view(), name="metrics"),
    # GraphQL API
    path("graphql/", GraphQLView.as_view(graphiql=True)),
    path(
        "api/v1/ping/",
        lambda r: JsonResponse({"status": "ping-main"}),
        name="ping-main",
    ),
    path("api/v1/theme/", TenantThemeView.as_view(), name="theme"),
    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/students/", include("students.urls")),
    path("api/v1/teachers/", include("teachers.urls")),
    path("api/v1/classes/", include("classes.urls")),
    path("api/v1/exams/", include("exams.urls")),
    path("api/v1/attendance/", include("attendance.urls")),
    path("api/v1/fees/", include("fees.urls")),
    path("api/v1/audit/", include("audit.urls")),
    path("api/v1/schools/", include("schools.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/hr/", include("hr.urls")),
    path("api/v1/inventory/", include("inventory.urls")),
    path("api/v1/lms/", include("lms.urls")),
    path("api/v1/support/", include("support.urls")),
    # Auth endpoints
    path("api/v1/auth/registration/", include("dj_rest_auth.registration.urls")),
    path("api/v1/auth/social/", include("allauth.socialaccount.urls")),
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
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
