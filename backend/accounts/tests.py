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


@override_settings(SECURE_SSL_REDIRECT=False, ALLOWED_HOSTS=["*"])
class UserAPITest(APITestCase):
    databases = {"default", "read"}

    def setUp(self):
        # Reset schema to public for test isolation
        from django.db import connection

        connection.set_schema_to_public()

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

    def test_tenant_subdomain_resolution(self):
        """Test that the middleware resolves the tenant from the subdomain/hostname."""
        from schools.models import Domain, School

        # Create a test tenant
        tenant = School.objects.create(
            schema_name="test_tenant", name="Test Tenant", curriculum="CBC"
        )
        Domain.objects.create(domain="testtenant", tenant=tenant, is_primary=True)

        # Access via subdomain-based URL
        response = self.client.get("/health/", HTTP_HOST="testtenant")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["schema"], "tenant")

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

    def test_token_refresh_deleted_user(self):
        """
        Test that refreshing a token for a deleted user returns a 401 Unauthorized
        response instead of a 500 error.
        """
        from rest_framework_simplejwt.tokens import RefreshToken

        user = User.objects.create_user(
            email="refresh_test@example.com",
            password="password123",
            is_email_verified=True,
        )
        refresh = RefreshToken.for_user(user)
        refresh_token = str(refresh)

        # Delete the user via raw SQL to bypass Django's collector (which tries to
        # query tenant tables like student/teacher that do not exist in the public schema)
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM account_emailaddress WHERE user_id = %s", [user.id]
            )
            cursor.execute("DELETE FROM accounts_user WHERE id = %s", [user.id])

        # Try to refresh token
        data = {"refresh": refresh_token}
        response = self.client.post("/api/v1/accounts/token/refresh/", data)

        # It should return a 401 Unauthorized instead of raising a 500
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.json())
