from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework.views import APIView
import csv
import io
from .models import Student
from .serializers import StudentSerializer
from accounts.permissions import IsTeacher
from .services_portal import PortalService

User = get_user_model()


class PortalDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = PortalService.get_parent_dashboard_data(request.user)
        return Response(data)


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['first_name', 'last_name', 'admission_number', 'user__email']

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.all()

        if user.role == 'STUDENT':
            qs = qs.filter(user=user)
        
        qs = qs.select_related('stream', 'stream__grade_level') \
               .prefetch_related('guardians', 'medical_record')

        stream_id = self.request.query_params.get('stream')
        if stream_id:
            qs = qs.filter(stream_id=stream_id)

        grade_id = self.request.query_params.get('grade')
        if grade_id:
            qs = qs.filter(stream__grade_level_id=grade_id)

        return qs

    @action(detail=False, methods=['get'])
    def my_children(self, request):
        if request.user.role != 'PARENT':
            return Response({"detail": "Only parents can view their children via this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        
        children = Student.objects.filter(
            guardians__email=request.user.email
        ).select_related('stream', 'stream__grade_level').distinct()
        
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)


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
        
        # Fetch Ranking info
        from exams.models import ExamRanking
        ranking = ExamRanking.objects.filter(student=student, exam=exam).first()
        
        # Determine if we should show positions (Only for non-CBC)
        show_positions = student.curriculum != 'CBC'

        summary = {
            "total_score": float(ranking.total_marks) if ranking else total_score,
            "mean_score": float(ranking.mean_score) if ranking else round(mean_score, 2),
            "total_points": total_points,
            "mean_grade": ranking.mean_grade if ranking else mean_grade_info['grade'],
            "overall_remarks": mean_grade_info['remarks']
        }

        if show_positions and ranking:
            summary.update({
                "class_position": ranking.class_position,
                "stream_position": ranking.stream_position,
                "total_in_class": ranking.total_students_in_class,
                "total_in_stream": ranking.total_students_in_stream,
            })

        return Response({
            "student": {
                "name": f"{student.first_name} {student.last_name}",
                "admission_number": student.admission_number,
                "stream": student.stream.name if student.stream else None,
                "grade_level": student.stream.grade_level.name if student.stream else None,
                "class_teacher": f"{student.stream.teacher.user.first_name} {student.stream.teacher.user.last_name}" if (student.stream and student.stream.teacher) else "Not Assigned",
                "email": student.user.email,
                "curriculum": student.curriculum,
            },
            "exam": {
                "id": exam.id,
                "name": exam.name,
                "term": exam.term,
                "academic_year": exam.academic_year,
            },
            "results": results,
            "summary": summary,
            "show_positions": show_positions
        })

