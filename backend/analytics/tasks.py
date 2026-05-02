from celery import shared_task
from students.models import Student
from .ml_engine import EarlyWarningEngine
import logging

logger = logging.getLogger(__name__)

@shared_task
def run_nightly_risk_assessment():
    """
    Background task to run AI inference on all active students.
    Typically scheduled to run at 2:00 AM.
    """
    students = Student.objects.filter(status='ACTIVE')
    count = 0
    
    logger.info(f"Starting nightly risk assessment for {students.count()} students...")
    
    for student in students:
        try:
            EarlyWarningEngine.run_prediction_for_student(student)
            count += 1
        except Exception as e:
            logger.error(f"Failed to assess risk for student {student.id}: {str(e)}")
            
    logger.info(f"Nightly risk assessment complete. Processed {count} students.")
    return count
