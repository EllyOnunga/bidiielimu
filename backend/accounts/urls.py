from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, UserDetailView, MyTokenObtainPairView, VerifyEmailView, GDPRExportView, GDPRDeleteView
from .views_social import GoogleLogin

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserDetailView.as_view(), name='user_detail'),
    path('verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('google/', GoogleLogin.as_view(), name='google_login'),
    
    # GDPR Endpoints
    path('gdpr/export/', GDPRExportView.as_view(), name='gdpr_export'),
    path('gdpr/delete/', GDPRDeleteView.as_view(), name='gdpr_delete'),
]
