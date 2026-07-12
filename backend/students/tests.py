from datetime import date

from django.contrib.auth import get_user_model
from django.core import mail
from django.db import connection
from django.test import TestCase

from accounts.models import Role
from schools.models import School
from students.models import Guardian, Student

User = get_user_model()


class GuardianSignalTest(TestCase):
    def setUp(self):
        # Switch to public to create/get the tenant school
        connection.set_schema_to_public()

        # Check if the school already exists in public
        self.school = School.objects.filter(schema_name="st_monica_academy").first()
        if not self.school:
            self.school = School.objects.create(
                name="St. Monica Academy", schema_name="st_monica_academy"
            )

        # Switch connection to the tenant
        connection.set_tenant(self.school)

        # Ensure PARENT and STUDENT roles exist
        self.parent_role, _ = Role.objects.get_or_create(
            name="PARENT", defaults={"description": "Parent"}
        )
        self.student_role, _ = Role.objects.get_or_create(
            name="STUDENT", defaults={"description": "Student"}
        )

        # Create a base student
        self.student = Student.objects.create(
            admission_number="ADM-001",
            first_name="John",
            last_name="Doe",
            gender="M",
            date_of_birth=date(2015, 5, 20),
            enrollment_date=date(2024, 1, 10),
            curriculum="CBC",
            status="ACTIVE",
        )

    def test_guardian_creation_auto_creates_user(self):
        # Clear outbox
        mail.outbox = []

        # Create a new guardian with a valid email
        guardian = Guardian.objects.create(
            student=self.student,
            first_name="Jane",
            last_name="Doe",
            relationship="MOTHER",
            phone_number="+254700000000",
            email="jane.doe@example.com",
        )

        # Verify a User was created with correct role and school
        user = User.objects.filter(email="jane.doe@example.com").first()
        self.assertIsNotNone(user)
        self.assertEqual(user.role, self.parent_role)
        self.assertEqual(user.school, self.school)
        self.assertEqual(user.first_name, "Jane")
        self.assertEqual(user.last_name, "Doe")
        self.assertTrue(user.is_email_verified)

        # Verify the Guardian profile is linked to the User
        guardian.refresh_from_db()
        self.assertEqual(guardian.user, user)

        # Verify a welcome email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Welcome to GilaniOS", mail.outbox[0].subject)
        self.assertIn("jane.doe@example.com", mail.outbox[0].to)

    def test_guardian_creation_with_existing_user(self):
        # Create a user beforehand
        existing_user = User.objects.create_user(
            email="jane.doe@example.com",
            password="somepassword123",
            role=self.parent_role,
            school=self.school,
        )

        # Clear outbox so we can verify if welcome email is skipped (since user already existed)
        mail.outbox = []

        # Create guardian
        guardian = Guardian.objects.create(
            student=self.student,
            first_name="Jane",
            last_name="Doe",
            relationship="MOTHER",
            phone_number="+254700000000",
            email="jane.doe@example.com",
        )

        # Verify no duplicate user was created
        user_count = User.objects.filter(email="jane.doe@example.com").count()
        self.assertEqual(user_count, 1)

        # Verify the Guardian profile is linked to the existing user
        guardian.refresh_from_db()
        self.assertEqual(guardian.user, existing_user)

        # Verify welcome email was not sent again
        self.assertEqual(len(mail.outbox), 0)
