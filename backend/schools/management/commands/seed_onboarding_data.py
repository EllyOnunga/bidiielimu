from classes.models import GradeLevel, Subject
from django.core.management.base import BaseCommand
from schools.models import SchoolSetting


class Command(BaseCommand):
    help = "Seeds a new tenant with essential onboarding data"

    def handle(self, *args, **options):
        # 1. Ensure School Settings exist
        SchoolSetting.objects.get_or_create()

        # 2. Create Default Grade Levels
        grades = [
            "Grade 1",
            "Grade 2",
            "Grade 3",
            "Grade 4",
            "Grade 5",
            "Grade 6",
            "Grade 7",
            "Grade 8",
            "Grade 9",
        ]
        for g_name in grades:
            GradeLevel.objects.get_or_create(name=g_name)

        # 3. Create Default Subjects
        subjects = [
            "Mathematics",
            "Science",
            "English",
            "Social Studies",
            "Creative Arts",
        ]
        for s_name in subjects:
            Subject.objects.get_or_create(name=s_name)

        self.stdout.write(self.style.SUCCESS("Onboarding data seeded successfully!"))
