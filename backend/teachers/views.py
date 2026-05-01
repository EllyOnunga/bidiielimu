from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.contrib.auth import get_user_model
import csv
import io

from .models import Teacher
from .serializers import TeacherSerializer
from accounts.permissions import IsSchoolAdmin

User = get_user_model()

class TeacherViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return Teacher.objects.filter(school=self.request.user.school).select_related('user')

    search_fields = ['first_name', 'last_name', 'employee_id', 'specialization', 'user__email']
    ordering_fields = ['created_at', 'first_name', 'last_name', 'joining_date']

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "User must be assigned to a school to add teachers."})
        serializer.save(school=school)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        if 'file' not in request.FILES:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        school = request.user.school
        
        try:
            content = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(content))
            created_count = 0
            errors = []
            
            with transaction.atomic():
                for row_idx, row in enumerate(reader, start=2):
                    try:
                        email = row.get('email', '').strip()
                        first_name = row.get('first_name', '').strip()
                        last_name = row.get('last_name', '').strip()
                        emp_id = row.get('employee_id', '').strip()
                        specialization = row.get('specialization', '').strip()
                        phone = row.get('phone_number', '').strip()
                        joining_date = row.get('joining_date', '').strip()
                        class_id = row.get('class_id', '').strip()
                        subject_ids_str = row.get('subject_ids', '').strip()

                        if not all([email, first_name, last_name, emp_id]):
                            errors.append(f"Row {row_idx}: Missing required fields (email, names, or employee ID).")
                            continue

                        user = User.objects.create_user(
                            email=email,
                            password=f"teacher@{emp_id}",
                            role='TEACHER',
                            first_name=first_name,
                            last_name=last_name,
                            phone_number=phone,
                            school=school
                        )

                        teacher = Teacher.objects.create(
                            user=user, 
                            school=school,
                            employee_id=emp_id,
                            first_name=first_name,
                            last_name=last_name,
                            specialization=specialization,
                            phone_number=phone,
                            joining_date=joining_date if joining_date else None
                        )

                        # Assign as class teacher if class_id provided
                        if class_id:
                            from classes.models import Stream
                            try:
                                stream = Stream.objects.get(id=class_id, grade_level__school=school)
                                stream.teacher = teacher
                                stream.save()
                            except Stream.DoesNotExist:
                                errors.append(f"Row {row_idx}: Class ID {class_id} not found.")

                        # Assign subjects if subject_ids provided
                        if subject_ids_str and class_id:
                            from classes.models import Subject, SubjectAssignment, Stream
                            stream = Stream.objects.get(id=class_id)
                            subject_ids = [s.strip() for s in subject_ids_str.split(',') if s.strip()]
                            for sub_id in subject_ids:
                                try:
                                    subject = Subject.objects.get(id=sub_id, school=school)
                                    SubjectAssignment.objects.update_or_create(
                                        stream=stream,
                                        subject=subject,
                                        defaults={'school': school, 'teacher': teacher}
                                    )
                                except Subject.DoesNotExist:
                                    errors.append(f"Row {row_idx}: Subject ID {sub_id} not found.")

                        created_count += 1
                    except Exception as e:
                        errors.append(f"Row {row_idx}: {str(e)}")

            return Response({
                "detail": f"Successfully imported {created_count} teachers.",
                "errors": errors if errors else None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Error processing file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
