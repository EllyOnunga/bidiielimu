import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import User, EmailVerificationToken
from schools.models import School

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def school():
    return School.objects.create(name="Test School")

@pytest.fixture
def user(school):
    return User.objects.create_user(
        email="test@example.com",
        password="testpassword123",
        school=school
    )

@pytest.mark.django_db
class TestAuthentication:
    def test_user_registration(self, api_client):
        url = reverse('register')
        data = {
            "email": "newuser@example.com",
            "password": "securepassword",
            "first_name": "John",
            "last_name": "Doe",
            "school_name": "New School"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email="newuser@example.com").exists()
        assert School.objects.filter(name="New School").exists()

    def test_user_login(self, api_client, user):
        url = reverse('token_obtain_pair')
        data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data

@pytest.mark.django_db
class TestEmailVerification:
    def test_email_verification_success(self, api_client, user):
        token = EmailVerificationToken.objects.create(user=user, token="valid-token-123")
        
        # Verify email is not verified initially
        assert not user.is_email_verified
        
        url = reverse('verify_email', kwargs={'token': "valid-token-123"})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # Reload user and check status
        user.refresh_from_db()
        assert user.is_email_verified
        
        # Check token is deleted
        assert not EmailVerificationToken.objects.filter(id=token.id).exists()

    def test_email_verification_invalid_token(self, api_client):
        url = reverse('verify_email', kwargs={'token': "invalid-token"})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
