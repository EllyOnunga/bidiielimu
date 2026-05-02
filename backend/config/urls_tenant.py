from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from schools.views_theme import TenantThemeView

def health_check(request):
    return JsonResponse({"status": "ok", "version": "1.0.0", "schema": "tenant"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health_check'),
    
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/students/', include('students.urls')),
    path('api/v1/teachers/', include('teachers.urls')),
    path('api/v1/classes/', include('classes.urls')),
    path('api/v1/exams/', include('exams.urls')),
    path('api/v1/attendance/', include('attendance.urls')),
    path('api/v1/fees/', include('fees.urls')),
    path('api/v1/audit/', include('audit.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/lms/', include('lms.urls')),
    path('api/v1/inventory/', include('inventory.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/reports/', include('reports.urls')),
    
    # Auth endpoints
    path('api/v1/auth/', include('dj_rest_auth.urls')),
    path('api/v1/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/v1/auth/social/', include('allauth.socialaccount.urls')),
    path('api/v1/auth/2fa/', include('allauth_2fa.urls')),
    
    # Unauthenticated Theme Endpoint
    path('api/v1/theme/', TenantThemeView.as_view(), name='tenant-theme'),
    
    # API Documentation
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
