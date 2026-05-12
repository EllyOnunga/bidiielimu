from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Role

User = get_user_model()


class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            email="test@example.com", password="password123"
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.check_password("password123"))

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email="admin@example.com", password="password123"
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)


@override_settings(SECURE_SSL_REDIRECT=False)
class UserAPITest(APITestCase):
    def setUp(self):
        # Create required roles for registration
        Role.objects.get_or_create(name="ADMIN")

        # Create the public tenant if it doesn't exist (required for django-tenants)
        from schools.models import Domain, School

        if not School.objects.filter(schema_name="public").exists():
            public_school = School.objects.create(
                schema_name="public", name="Public Tenant", curriculum="CBC"
            )
            Domain.objects.create(
                domain="testserver", tenant=public_school, is_primary=True
            )

    def test_register_user(self):
        data = {
            "email": "newuser@example.com",
            "password": "password123",
            "first_name": "John",
            "last_name": "Doe",
            "school_name": "Test School",
        }
        # Use the correct registration URL from accounts/urls.py
        response = self.client.post("/api/v1/accounts/register/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
