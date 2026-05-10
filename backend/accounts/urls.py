from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, UserDetailView, MyTokenObtainPairView, VerifyEmailView, ResendVerificationView, GDPRExportView, GDPRDeleteView
from .views_social import GoogleLogin, MicrosoftLogin, GitHubLogin
from .views_api import APIKeyViewSet

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('microsoft/', MicrosoftLogin.as_view(), name='microsoft_login'),
    path('github/', GitHubLogin.as_view(), name='github_login'),

    # API Key Management
    path('api-keys/', APIKeyViewSet.as_view({'get': 'list', 'post': 'create'}), name='api_keys'),
    path('api-keys/<int:pk>/', APIKeyViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='api_key_detail'),
    
    # GDPR Endpoints
    path('gdpr/export/', GDPRExportView.as_view(), name='gdpr_export'),
    path('gdpr/delete/', GDPRDeleteView.as_view(), name='gdpr_delete'),
]
