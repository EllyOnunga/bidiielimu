from celery import shared_task

from .services_ranking import RankingService


@shared_task
def compute_ranks_task(exam_id):
    """Background task to compute ranks for an exam."""
    try:
        count = RankingService.compute_exam_ranks(exam_id)
        return {"status": "success", "students_ranked": count}
    except Exception as e:
        return {"status": "error", "message": str(e)}
