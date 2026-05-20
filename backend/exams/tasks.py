from celery import shared_task
from django_tenants.utils import schema_context

from .services_ranking import RankingService


@shared_task
def compute_ranks_task(schema_name, exam_id):
    """Background task to compute ranks for an exam under a specific tenant."""
    with schema_context(schema_name):
        try:
            count = RankingService.compute_exam_ranks(exam_id)
            return {"status": "success", "students_ranked": count}
        except Exception as e:
            return {"status": "error", "message": str(e)}
