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
            draft = AIReportService.generate_narrative_draft(pk)
            return Response({"draft": draft})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        comment = request.data.get('teacher_comment')
        if not comment:
            return Response({"detail": "Teacher comment is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        report = AIReportService.approve_comment(pk, request.user, comment)
        return Response(StudentReportSerializer(report).data)
