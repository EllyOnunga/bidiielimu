from celery import shared_task
from django_tenants.utils import schema_context
from .models import StudentReport
from .services_ai import AIReportService

@shared_task
def generate_ai_draft_async(schema_name, report_id):
    with schema_context(schema_name):
        try:
            draft = AIReportService.generate_narrative_draft(report_id)
            report = StudentReport.objects.get(id=report_id)
            report.ai_generated_narrative = draft
            report.save()
            return f"Successfully generated draft for report {report_id}"
        except Exception as e:
            return f"Error generating draft for report {report_id}: {str(e)}"
