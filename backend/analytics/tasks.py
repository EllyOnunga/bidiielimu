import logging

from celery import shared_task
from django_tenants.utils import tenant_context

from schools.models import School
from students.models import Student

from .ml_engine import EarlyWarningEngine

logger = logging.getLogger(__name__)


@shared_task
def run_nightly_risk_assessment():
    """
    Background task to run AI inference on all active students across all tenants.
    Typically scheduled to run at 2:00 AM.
    """
    # Only iterate through actual school tenants (exclude public)
    schools = School.objects.filter(status="ACTIVE").exclude(schema_name="public")
    total_processed = 0

    logger.info(f"Starting nightly risk assessment for {schools.count()} active schools...")

    for school in schools:
        with tenant_context(school):
            try:
                students = Student.objects.filter(status="ACTIVE")
                school_count = 0
                
                logger.info(f"Processing {students.count()} students for school: {school.name}")

                for student in students:
                    try:
                        EarlyWarningEngine.run_prediction_for_student(student)
                        school_count += 1
                    except Exception as e:
                        logger.error(f"Failed to assess risk for student {student.id} in {school.name}: {str(e)}")
                
                total_processed += school_count
                logger.info(f"Completed risk assessment for {school.name}. Processed {school_count} students.")
            except Exception as e:
                logger.error(f"Error processing school {school.name}: {str(e)}")

    logger.info(f"Nightly risk assessment complete. Total students processed across all tenants: {total_processed}")
    return total_processed
