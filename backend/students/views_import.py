from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.http import HttpResponse
from .services import StudentImportService

class StudentImportView(views.APIView):
    """
    Endpoint for bulk importing students via CSV.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        csv_file = request.FILES['file']
        if not csv_file.name.endswith('.csv'):
            return Response({"detail": "File must be a CSV."}, status=status.HTTP_400_BAD_REQUEST)

        results = StudentImportService.import_students_csv(csv_file)
        return Response(results, status=status.HTTP_200_OK)

class StudentImportTemplateView(views.APIView):
    """
    Returns a downloadable CSV template for student imports.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        template_content = StudentImportService.get_csv_template()
        response = HttpResponse(template_content, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="student_import_template.csv"'
        return response
