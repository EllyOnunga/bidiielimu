from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer, MyTokenObtainPairSerializer
from .models import EmailVerificationToken
from django.shortcuts import get_object_or_404
from django.utils import timezone
from students.models import Student
from teachers.models import Teacher

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, token):
        verification_token = get_object_or_404(EmailVerificationToken, token=token)
        user = verification_token.user
        
        if user.is_email_verified:
            return Response({"detail": "Email is already verified."}, status=status.HTTP_400_BAD_REQUEST)
            
        user.is_email_verified = True
        user.save()
        verification_token.delete()
        
        return Response({"detail": "Email successfully verified."}, status=status.HTTP_200_OK)

class GDPRExportView(generics.GenericAPIView):
    """
    Exports all personal data associated with the authenticated user in JSON format.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        data = {
            "profile": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "phone_number": user.phone_number,
                "date_joined": user.date_joined,
            }
        }
        
        # Pull associated data based on role
        if user.role == 'STUDENT':
            student = Student.objects.filter(user=user).first()
            if student:
                data["student_record"] = {
                    "admission_number": student.admission_number,
                    "date_of_birth": student.date_of_birth,
                    "gender": student.gender,
                    "enrollment_date": student.enrollment_date,
                    "parent_name": student.parent_name,
                    "parent_phone": student.parent_phone,
                    "parent_email": student.parent_email,
                }
                data["attendance"] = list(student.attendance.values('date', 'status', 'remarks'))
                data["marks"] = list(student.marks.values('exam__name', 'subject__name', 'score'))

        elif user.role in ['TEACHER', 'HOD', 'PRINCIPAL']:
            teacher = Teacher.objects.filter(user=user).first()
            if teacher:
                data["teacher_record"] = {
                    "employee_id": teacher.employee_id,
                    "specialization": teacher.specialization,
                    "joining_date": teacher.joining_date,
                }

        return Response(data, status=status.HTTP_200_OK)

class GDPRDeleteView(generics.GenericAPIView):
    """
    Performs a soft delete of the user's account and anonymizes PII.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        
        # Soft delete / anonymize
        user.is_active = False
        user.first_name = "Deleted"
        user.last_name = "User"
        user.email = f"deleted_{user.id}_{timezone.now().timestamp()}@anonymized.local"
        user.phone_number = None
        user.save()
        
        # If student or teacher, soft delete the profile
        if hasattr(user, 'student_profile'):
            student = user.student_profile
            student.delete() # Trigger SoftDeleteModel.delete()
        if hasattr(user, 'teacher_profile'):
            teacher = user.teacher_profile
            teacher.delete()

        return Response({"detail": "Account successfully deleted and anonymized."}, status=status.HTTP_204_NO_CONTENT)
