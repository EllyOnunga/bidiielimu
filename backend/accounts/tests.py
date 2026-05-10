from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

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


class UserAPITest(APITestCase):
    def test_register_user(self):
        data = {
            "email": "newuser@example.com",
            "password": "password123",
            "first_name": "John",
            "last_name": "Doe",
            "school_name": "Test School",
        }
        response = self.client.post("/api/v1/auth/registration/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
