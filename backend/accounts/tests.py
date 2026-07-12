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

    def test_refresh_with_http_only_cookie(self):
        """
        Ensure refresh can be performed using the HttpOnly refresh cookie.
        """
        from accounts.services_otp import OTPService
        from schools.models import Domain, School

        # Create a tenant school for the user (so they don't try to access public schema)
        school = School.objects.create(
            schema_name="test_cookie_school",
            name="Test Cookie School",
            curriculum="CBC",
        )
        Domain.objects.create(
            domain="testcookieschool.localhost",
            tenant=school,
            is_primary=True,
        )

        user = User.objects.create_user(
            email="cookieuser@example.com",
            password="password123",
            is_email_verified=True,
            school=school,
        )

        login_response = self.client.post(
            "/api/v1/accounts/login/",
            {"email": user.email, "password": "password123"},
            format="json",
            HTTP_HOST="testcookieschool.localhost",
        )

        if login_response.status_code == status.HTTP_200_OK:
            self.assertIn("jwt-refresh-token", login_response.cookies)
            self.assertTrue(login_response.cookies["jwt-refresh-token"]["httponly"])
        elif login_response.status_code == status.HTTP_400_BAD_REQUEST:
            body = login_response.json()
            if body.get("2fa_required"):
                otp = OTPService.generate_otp(user)
                verify_response = self.client.post(
                    "/api/v1/accounts/otp/verify-login/",
                    {"user_id": user.id, "otp": otp},
                    format="json",
                    HTTP_HOST="testcookieschool.localhost",
                )

                self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
                self.assertIn("jwt-refresh-token", verify_response.cookies)
                self.assertTrue(
                    verify_response.cookies["jwt-refresh-token"]["httponly"],
                )
            else:
                self.fail(
                    f"Unexpected login failure payload: {login_response.json()}"
                )
        else:
            self.fail(
                f"Unexpected login status code: {login_response.status_code} {login_response.content}"
            )

        refresh_response = self.client.post(
            "/api/v1/accounts/token/refresh/",
            {},
            format="json",
            HTTP_HOST="testcookieschool.localhost",
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.json())
        self.assertIn("jwt-refresh-token", refresh_response.cookies)


class APIKeyTest(APITestCase):
    databases = {"default", "read"}

    def setUp(self):
        # Reset schema to public for test isolation
        from django.db import connection
        connection.set_schema_to_public()

        # Create the public tenant if it doesn't exist
        from schools.models import Domain, School
        self.school, _ = School.objects.get_or_create(
            schema_name="public", name="Public Tenant", curriculum="CBC"
        )
        Domain.objects.get_or_create(
            domain="testserver", tenant=self.school, is_primary=True
        )

        self.user = User.objects.create_user(
            email="api_user@example.com", password="password123", school=self.school
        )

    def test_legacy_api_key_rotation_on_use(self):
        """Test that a legacy plaintext API key is migrated and rotated on first use."""
        from accounts.models_api import APIKey

        # Manually create a legacy API key with plaintext 'key' in DB
        legacy_key = APIKey.objects.create(
            name="Test Legacy Key",
            key="legacy-plaintext-key-123",
            user=self.user,
            school=self.school,
            is_legacy=True
        )

        # Authenticate using the legacy plaintext key
        response = self.client.get(
            "/api/v1/ping/",
            HTTP_X_API_KEY="legacy-plaintext-key-123"
        )

        # It should return a 401 response and state that the key was rotated
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Legacy API key detected", response.json()["error"])

        # The key in database should now be rotated and hashed
        legacy_key.refresh_from_db()
        self.assertNotEqual(legacy_key.key, "legacy-plaintext-key-123")
        self.assertIsNotNone(legacy_key.key_hash)
        self.assertTrue(legacy_key.is_legacy)

        # A second attempt with the old legacy key should return "Invalid API key" (also 401)
        response_second = self.client.get(
            "/api/v1/ping/",
            HTTP_X_API_KEY="legacy-plaintext-key-123"
        )
        self.assertEqual(response_second.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response_second.json()["error"], "Invalid API key")

    def test_modern_hashed_api_key_auth(self):
        """Test that a modern hashed API key authenticates successfully."""
        from accounts.models_api import APIKey

        # Create a modern API key (save() will automatically generate and hash it)
        api_key = APIKey.objects.create(
            name="Modern Key",
            user=self.user,
            school=self.school
        )

        # Get the one-time raw secret that was generated
        raw_key = api_key._plain_key

        # Authenticate using the raw key
        response = self.client.get(
            "/api/v1/ping/",
            HTTP_X_API_KEY=raw_key
        )

        # It should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_regenerate_api_key(self):
        """Test that regenerating a key updates it and clears the legacy flag."""
        from accounts.models_api import APIKey

        # Create a key and mark it as legacy
        api_key = APIKey.objects.create(
            name="Key to Regenerate",
            user=self.user,
            school=self.school,
            is_legacy=True
        )
        self.assertTrue(api_key.is_legacy)

        # Login user to use ViewSet action
        self.client.force_authenticate(user=self.user)

        # Call regenerate endpoint
        response = self.client.post(
            f"/api/v1/accounts/api-keys/{api_key.id}/regenerate/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that the legacy flag is cleared and a new secret is returned
        api_key.refresh_from_db()
        self.assertFalse(api_key.is_legacy)
        self.assertIn("secret", response.json())
