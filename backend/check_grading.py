import os

import django
from django_tenants.utils import schema_context
from exams.models import Exam, GradingSystem
from schools.models import School

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


def check_grading():
    for school in School.objects.all():
        print(f"\n--- Tenant: {school.schema_name} ({school.domain_url}) ---")
        with schema_context(school.schema_name):
            systems = GradingSystem.objects.all()
            if not systems:
                print("  No grading systems found.")
                continue

            for gs in systems:
                print(f"  System: {gs.name}")
                thresholds = gs.thresholds.all()
                if not thresholds:
                    print("    No thresholds found.")
                for t in thresholds:
                    print(
                        f"    Grade {t.grade}: {t.min_score}-{t.max_score} ({t.points} pts)"
                    )

            exams = Exam.objects.all()
            if not exams:
                print("  No exams found.")
            for exam in exams:
                print(f"  Exam: {exam.name}, Grading System: {exam.grading_system}")


if __name__ == "__main__":
    check_grading()
