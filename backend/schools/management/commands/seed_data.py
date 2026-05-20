import random
import string
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Role, User
from classes.models import GradeLevel, Stream, Subject
from fees.models import FeePayment, FeeStructure
from schools.models import School, SchoolSetting
from students.models import Student
from teachers.models import Teacher


class Command(BaseCommand):
    help = "Seeds the database with test data"

    def generate_tx_id(self):
        return "".join(random.choices(string.ascii_uppercase + string.digits, k=10))

    def handle(self, *args, **options):
        self.stdout.write(
            f"Seeding data for schema: {
                School.objects.first().schema_name if School.objects.exists() else 'unknown'}"
        )

        # 1. Create Grade Levels and Streams
        grades_data = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"]
        for g_name in grades_data:
            grade, _ = GradeLevel.objects.get_or_create(name=g_name)
            for s_name in ["A", "B"]:
                Stream.objects.get_or_create(name=s_name, grade_level=grade)

        streams = list(Stream.objects.all())
        grade_levels = list(GradeLevel.objects.all())

        # 2. Create Subjects
        subjects = ["Mathematics", "Science", "English", "History", "Art"]
        for s_name in subjects:
            Subject.objects.get_or_create(name=s_name)

        # 3. Create Teachers
        first_names = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer"]
        last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia"]

        teacher_role, _ = Role.objects.get_or_create(name="TEACHER")

        for i in range(5):
            email = f"teacher{i}_{random.randint(100, 999)}@example.com"
            if not User.objects.filter(email=email).exists():
                user = User.objects.create_user(
                    email=email,
                    password="password123",
                    first_name=random.choice(first_names),
                    last_name=random.choice(last_names),
                    role=teacher_role,
                )
                Teacher.objects.create(
                    user=user,
                    employee_id=f"TCH{1000 + i}{random.randint(10, 99)}",
                    joining_date=timezone.now()
                    - timedelta(days=random.randint(100, 500)),
                )

        # 4. Create Students
        for i in range(20):
            fname = random.choice(first_names)
            lname = random.choice(last_names)
            admission_number = f"ADM{3000 + i}"
            if not Student.objects.filter(admission_number=admission_number).exists():
                Student.objects.create(
                    first_name=fname,
                    last_name=lname,
                    admission_number=admission_number,
                    gender=random.choice(["M", "F"]),
                    date_of_birth=timezone.now()
                    - timedelta(days=random.randint(2000, 4000)),
                    enrollment_date=timezone.now(),
                    stream=random.choice(streams),
                    is_active=True,
                )

        # 5. Create Fee Structures and Payments
        if grade_levels:
            students = Student.objects.all()
            for gl in grade_levels:
                fs, _ = FeeStructure.objects.get_or_create(
                    grade_level=gl,
                    term="Term 1",
                    academic_year="2026",
                    defaults={"amount": 25000},
                )

            for i in range(30):
                student = random.choice(students)
                FeePayment.objects.create(
                    student=student,
                    amount=random.randint(5000, 15000),
                    payment_method="CASH",
                    transaction_id=self.generate_tx_id(),
                    payment_date=timezone.now().date()
                    - timedelta(days=random.randint(0, 120)),
                )

        # 6. Ensure School Settings exist
        settings_obj, created = SchoolSetting.objects.get_or_create()
        if created:
            settings_obj.accent_color = "#3b82f6"
            settings_obj.save()

        self.stdout.write(self.style.SUCCESS("Seeding completed successfully!"))
