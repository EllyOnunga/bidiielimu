from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import StudentReport
from .serializers import StudentReportSerializer
from .services_ai import AIReportService

class StudentReportViewSet(viewsets.ModelViewSet):
    queryset = StudentReport.objects.all()
    serializer_class = StudentReportSerializer

    @action(detail=True, methods=['post'])
    def generate_ai_draft(self, request, pk=None):
        try:
            from .tasks import generate_ai_draft_async
            from django.db import connection
            # Trigger celery task
            generate_ai_draft_async.delay(connection.schema_name, pk)
            return Response({"detail": "AI narrative generation started in the background. It will be available shortly."})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        comment = request.data.get('teacher_comment')
        if not comment:
            return Response({"detail": "Teacher comment is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        report = AIReportService.approve_comment(pk, request.user, comment)
        return Response(StudentReportSerializer(report).data)

    @action(detail=False, methods=['get'])
    def card(self, request):
        student_id = request.query_params.get('student')
        exam_id = request.query_params.get('exam')
        if not all([student_id, exam_id]):
            return Response({"detail": "student and exam IDs are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        from .services import ReportCardService
        data = ReportCardService.get_report_card_data(student_id, exam_id)
        return Response(data)
