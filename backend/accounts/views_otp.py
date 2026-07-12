import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, views
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import SMSDevice, User
from .serializers import UserSerializer
from .services_otp import OTPService

logger = logging.getLogger(__name__)


class SMSOTPSetupView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        phone_number = request.data.get("phone_number")
        if not phone_number:
            return Response(
                {"error": "Phone number is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Send test OTP
        if OTPService.send_otp(request.user, phone_number):
            # Create or update unconfirmed device
            SMSDevice.objects.update_or_create(
                user=request.user,
                defaults={"phone_number": phone_number, "confirmed": False},
            )
            return Response({"message": "Verification code sent to your phone"})
        return Response(
            {"error": "Failed to send SMS"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class SMSOTPVerifySetupView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        otp = request.data.get("otp")
        if not otp:
            return Response(
                {"error": "OTP is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if OTPService.verify_otp(request.user, otp):
            device = SMSDevice.objects.filter(
                user=request.user, confirmed=False
            ).first()
            if device:
                device.confirmed = True
                device.save()
                return Response({"message": "SMS 2FA enabled successfully"})
            return Response(
                {"message": "OTP verified successfully"}
            )  # Case for general verification
        return Response(
            {"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST
        )


class OTPTriggerView(views.APIView):
    """
    Allows a user to trigger a resend of an OTP via a specific method (SMS or EMAIL).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_id = request.data.get("user_id")
        method = request.data.get("method", "SMS")  # Default to SMS

        if not user_id:
            return Response(
                {"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = get_object_or_404(User, id=user_id)

        if OTPService.send_otp(user, method=method):
            return Response({"message": f"Verification code sent via {method}"})
        return Response(
            {"error": f"Failed to send code via {method}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class OTPVerifyLoginView(views.APIView):
    """
    Final verification step to exchange an OTP for JWT tokens.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        user_id = request.data.get("user_id")
        otp = request.data.get("otp")

        if settings.DEBUG:
            logger.info(f"[DEBUG] OTP verify-login request: user_id={user_id}, otp={otp}")

        if not user_id or not otp:
            if settings.DEBUG:
                logger.warning(
                    f"[DEBUG] OTP verify-login failed: missing params - user_id={bool(user_id)}, otp={bool(otp)}"
                )
            return Response(
                {"error": "User ID and OTP are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_object_or_404(User, id=user_id)

        # Multi-tenant URL restriction
        tenant = getattr(request, "tenant", None)
        if tenant:
            if tenant.schema_name == "public":
                # Only SUPER_ADMIN allowed on main URL
                if not (user.is_superuser or user.role_name == "SUPER_ADMIN"):
                    if settings.DEBUG:
                        logger.warning(
                            f"[DEBUG] OTP verify-login failed: public schema but user is not SUPER_ADMIN - user_id={user.id}, is_superuser={user.is_superuser}, role={user.role_name}"
                        )
                    return Response(
                        {
                            "error": "Only Platform Super Admins can access the main platform dashboard. Please login via your school's specific URL."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                # Restricted to their own school URL (Super Admins can access any)
                if user.school != tenant and not user.is_superuser:
                    if settings.DEBUG:
                        logger.warning(
                            f"[DEBUG] OTP verify-login failed: school mismatch - user_id={user.id}, user_school={user.school}, tenant={tenant}"
                        )
                    return Response(
                        {
                            "error": "You do not have permission to access this school's dashboard. Please login via your own school's URL."
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        if OTPService.verify_otp(user, otp):
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            # Add custom claims
            refresh["school_id"] = user.school_id if user.school else None
            refresh["role"] = user.role.name if user.role else "ADMIN"

            response = Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": UserSerializer(user).data,
                }
            )

            # Issue HttpOnly JWT cookies for cookie-based refresh support
            from .views import set_jwt_cookies

            set_jwt_cookies(
                response,
                str(refresh.access_token),
                str(refresh),
            )
            return response

        if settings.DEBUG:
            logger.warning(
                f"[DEBUG] OTP verify-login failed: invalid or expired OTP - user_id={user.id}"
            )
        return Response(
            {"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST
        )
