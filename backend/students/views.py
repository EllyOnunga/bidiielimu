from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import transaction
import csv
import io
from .models import Student
from .serializers import StudentSerializer
from accounts.permissions import IsTeacher

User = get_user_model()


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated] # Changed from IsTeacher to allow Students
    search_fields = ['first_name', 'last_name', 'admission_number', 'parent_name', 'user__email']

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.filter(school=user.school)

        if user.role == 'STUDENT':
            # Students only see themselves
            qs = qs.filter(user=user)
        
        qs = qs.select_related('stream', 'stream__grade_level')

        # Filter by stream  e.g. ?stream=3
        stream_id = self.request.query_params.get('stream')
        if stream_id:
            qs = qs.filter(stream_id=stream_id)

        # Filter by grade level  e.g. ?grade=2
        grade_id = self.request.query_params.get('grade')
        if grade_id:
            qs = qs.filter(stream__grade_level_id=grade_id)

        return qs

    @action(detail=False, methods=['get'])
    def my_children(self, request):
        if request.user.role != 'PARENT':
            return Response({"detail": "Only parents can view their children via this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        
        children = Student.objects.filter(
            school=request.user.school,
            parent_email=request.user.email
        ).select_related('stream', 'stream__grade_level')
        
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        if 'file' not in request.FILES:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        if not file.name.endswith('.csv'):
            return Response({"detail": "Only CSV files are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        school = request.user.school
        if not school:
            return Response({"detail": "User not assigned to a school."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            content = file.read().decode('utf-8')
            lines = content.splitlines()
            
            # If the file is large (> 20 students), offload to background task
            if len(lines) > 21: # Header + 20 data rows
                from .tasks import process_bulk_upload
                process_bulk_upload.delay(content, school.id, request.user.id)
                return Response({
                    "detail": "Large file detected. The import has been started in the background. You will be notified when complete."
                }, status=status.HTTP_202_ACCEPTED)

            # Synchronous processing for small files
            reader = csv.DictReader(io.StringIO(content))
            created_count = 0
            errors = []
            
            with transaction.atomic():
                for row_idx, row in enumerate(reader, start=2):
                    try:
                        first_name = row.get('first_name', '').strip()
                        last_name = row.get('last_name', '').strip()
                        adm_no = row.get('admission_number', '').strip()
                        gender = row.get('gender', '').strip().upper()
                        dob = row.get('date_of_birth', '').strip()
                        stream_id = row.get('stream_id', '').strip()
                        parent_name = row.get('parent_name', '').strip()
                        parent_phone = row.get('parent_phone', '').strip()

                        email = row.get('email', '').strip()
                        
                        if not all([email, first_name, last_name, adm_no, dob, parent_name]):
                            errors.append(f"Row {row_idx}: Missing required fields (email, names, admission, DOB, and parent name).")
                            continue
                        user = User.objects.create_user(
                            email=email,
                            password=f"student@{adm_no}",
                            role='STUDENT',
                            first_name=first_name,
                            last_name=last_name,
                            school=school
                        )

                        Student.objects.create(
                            user=user, school=school, admission_number=adm_no,
                            first_name=first_name, last_name=last_name,
                            date_of_birth=dob, gender=gender if gender in ['M', 'F', 'O'] else 'O',
                            stream_id=stream_id if stream_id else None,
                            parent_name=parent_name, parent_phone=parent_phone
                        )
                        created_count += 1
                    except Exception as e:
                        errors.append(f"Row {row_idx}: {str(e)}")

            return Response({
                "detail": f"Successfully imported {created_count} students.",
                "errors": errors if errors else None
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Error processing file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def report_card(self, request, pk=None):
        student = self.get_object()
        exam_id = request.query_params.get('exam_id')
        
        from exams.models import Exam, Mark, GradingSystem
        
        # Get the latest exam if none provided
        if exam_id:
            try:
                exam = Exam.objects.get(id=exam_id, school=student.school)
            except Exam.DoesNotExist:
                return Response({"detail": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            exam = Exam.objects.filter(school=student.school).order_by('-start_date').first()
            if not exam:
                return Response({"detail": "No exams found for this school."}, status=status.HTTP_404_NOT_FOUND)

        # Get all marks for this student and exam
        marks = Mark.objects.filter(student=student, exam=exam).select_related('subject')
        
        # Attempt to find the default grading system for the school
        # If the school doesn't have one, we will just return raw scores
        grading_system = GradingSystem.objects.filter(school=student.school).first()
        thresholds = grading_system.thresholds.all() if grading_system else []
        
        results = []
        total_score = 0
        total_points = 0
        
        def get_grade_info(score):
            if not thresholds:
                return {"grade": "-", "points": 0, "remarks": ""}
            for t in thresholds:
                if t.min_score <= score <= t.max_score:
                    return {"grade": t.grade, "points": t.points, "remarks": t.remarks}
            return {"grade": "-", "points": 0, "remarks": ""}

        for mark in marks:
            score = float(mark.score)
            total_score += score
            grade_info = get_grade_info(score)
            total_points += grade_info['points']
            
            results.append({
                "subject_id": mark.subject.id,
                "subject_name": mark.subject.name,
                "score": score,
                "grade": grade_info['grade'],
                "points": grade_info['points'],
                "remarks": grade_info['remarks'] or mark.teacher_remarks
            })
            
        mean_score = total_score / len(results) if results else 0
        mean_grade_info = get_grade_info(mean_score)
        
        return Response({
            "student": {
                "name": f"{student.first_name} {student.last_name}",
                "admission_number": student.admission_number,
                "stream": student.stream.name if student.stream else None,
                "grade_level": student.stream.grade_level.name if student.stream else None,
                "class_teacher": f"{student.stream.teacher.user.first_name} {student.stream.teacher.user.last_name}" if (student.stream and student.stream.teacher) else "Not Assigned",
                "email": student.user.email,
                "parent_name": student.parent_name,
                "parent_phone": student.parent_phone,
            },
            "exam": {
                "id": exam.id,
                "name": exam.name,
                "term": exam.term,
                "academic_year": exam.academic_year,
            },
            "results": results,
            "summary": {
                "total_score": total_score,
                "mean_score": round(mean_score, 2),
                "total_points": total_points,
                "mean_grade": mean_grade_info['grade'],
                "overall_remarks": mean_grade_info['remarks']
            }
        })
