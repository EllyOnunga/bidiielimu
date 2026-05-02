from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg
from .models import GradingSystem, GradeThreshold, Exam, Mark
from .serializers import (
    GradingSystemSerializer, GradeThresholdSerializer, 
    ExamSerializer, MarkSerializer
)

class GradingSystemViewSet(viewsets.ModelViewSet):
    serializer_class = GradingSystemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GradingSystem.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

class GradeThresholdViewSet(viewsets.ModelViewSet):
    serializer_class = GradeThresholdSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GradeThreshold.objects.filter(grading_system__school=self.request.user.school)

class ExamViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'term', 'academic_year']

    def get_queryset(self):
        return Exam.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "User must be assigned to a school to schedule exams."})
        
        # Auto-calculate academic year if not provided
        academic_year = self.request.data.get('academic_year')
        if not academic_year:
            from datetime import datetime
            academic_year = str(datetime.now().year)
            
        serializer.save(school=school, academic_year=academic_year)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        school = request.user.school
        
        # Get up to 6 most recent exams, order chronologically for the graph
        recent_exams = list(Exam.objects.filter(school=school).order_by('-start_date')[:6])
        recent_exams.reverse()
        
        data = []
        for exam in recent_exams:
            avg_score = Mark.objects.filter(exam=exam).aggregate(avg=Avg('score'))['avg']
            # Default to 0 if no marks exist
            data.append({
                "name": exam.name,
                "score": round(avg_score, 1) if avg_score else 0
            })
            
        return Response(data)

class MarkViewSet(viewsets.ModelViewSet):
    serializer_class = MarkSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['student__first_name', 'student__last_name', 'student__admission_number', 'subject__name', 'exam__name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            from accounts.permissions import IsTeacher
            return [IsTeacher()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        qs = Mark.objects.filter(exam__school=user.school).select_related('student', 'student__user', 'exam', 'subject')
        if user.role == 'STUDENT':
            qs = qs.filter(student__user=user)
        elif user.role == 'PARENT':
            # Ensure parents only see marks for students they are linked to
            qs = qs.filter(student__guardians__email=user.email)
        return qs

    @action(detail=False, methods=['post'])
    def bulk_save(self, request):
        exam_id = request.data.get('exam')
        subject_id = request.data.get('subject')
        marks_data = request.data.get('marks', []) # List of {student_id, score}

        if not exam_id or not subject_id:
            return Response({"detail": "Exam and Subject are required."}, status=status.HTTP_400_BAD_REQUEST)

        exam = Exam.objects.get(id=exam_id, school=request.user.school)
        from classes.models import Subject
        subject = Subject.objects.get(id=subject_id, school=request.user.school)

        saved_marks = []
        for entry in marks_data:
            student_id = entry.get('student_id')
            score = entry.get('score')
            
            mark, created = Mark.objects.update_or_create(
                exam=exam,
                subject=subject,
                student_id=student_id,
                defaults={'score': score}
            )
            saved_marks.append(mark.id)

    @action(detail=True, methods=['post'])
    def compute_ranks(self, request, pk=None):
        from .services_ranking import RankingService
        try:
            count = RankingService.compute_exam_ranks(pk)
            return Response({"detail": f"Successfully computed ranks for {count} students."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def export_mark_sheet(self, request, pk=None):
        from .services_export import MarkSheetExportService
        from django.http import HttpResponse
        
        csv_content = MarkSheetExportService.generate_mark_sheet_csv(pk)
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="mark_sheet_exam_{pk}.csv"'
        return response

    @action(detail=False, methods=['get'])
    def subject_analytics(self, request):
        exam_id = request.query_params.get('exam')
        subject_id = request.query_params.get('subject')
        
        if not exam_id or not subject_id:
            return Response({"detail": "Exam and Subject parameters are required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Grade Distribution
        from django.db.models import Count
        # This assumes we have a way to map scores to grades. For simplicity, we'll return raw counts in ranges.
        distribution = Mark.objects.filter(exam_id=exam_id, subject_id=subject_id).values('score').annotate(count=Count('id'))
        
        # 2. Historical Trend (Average score for this subject across recent exams)
        trends = Mark.objects.filter(subject_id=subject_id, exam__school=request.user.school).values('exam__name', 'exam__start_date').annotate(avg=Avg('score')).order_by('exam__start_date')[:6]

        return Response({
            "distribution": distribution,
            "trends": trends
        })
