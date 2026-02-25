"""
User-facing auth endpoints under ``/api/users/`` (parallel coverage to ``test_auth.py``
for JWT + profile flows used by the SPA).

Keeps registration/login/profile and leaderboard privacy rules explicit.
"""
import pytest
from rest_framework import status

from django.contrib.auth import get_user_model


User = get_user_model()


@pytest.mark.django_db
class TestUserRegistration:
    """Tests for user registration."""
    
    def test_register_valid_user(self, api_client):
        """Test successful user registration."""
        url = '/api/users/register/'
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'strongpass123',
            'password_confirm': 'strongpass123',
            'first_name': 'New',
            'last_name': 'User',
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert User.objects.filter(email='newuser@example.com').exists()
    
    def test_register_password_mismatch(self, api_client):
        """Test registration fails with mismatched passwords."""
        url = '/api/users/register/'
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'strongpass123',
            'password_confirm': 'differentpass',
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'password_confirm' in response.data
    
    def test_register_duplicate_email(self, api_client, user):
        """Test registration fails with existing email."""
        url = '/api/users/register/'
        data = {
            'email': user.email,
            'username': 'different',
            'password': 'strongpass123',
            'password_confirm': 'strongpass123',
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUserAuth:
    """Tests for authentication endpoints."""
    
    def test_login_valid_credentials(self, api_client, user):
        """Test successful login."""
        url = '/api/users/login/'
        data = {
            'email': user.email,
            'password': 'testpass123',
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_login_invalid_credentials(self, api_client, user):
        """Wrong password yields generic credential message (consistent with unknown email)."""
        url = '/api/users/login/'
        data = {
            'email': user.email,
            'password': 'wrongpassword',
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data.get('detail') == 'Invalid email or password.'

    def test_profile_authenticated(self, auth_client, user):
        """Test retrieving profile when authenticated."""
        url = '/api/users/profile/'
        response = auth_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == user.email
        assert response.data['username'] == user.username
    
    def test_profile_unauthenticated(self, api_client):
        """Test profile requires authentication."""
        url = '/api/users/profile/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestLeaderboard:
    """Tests for leaderboard endpoint."""
    
    def test_leaderboard_public(self, api_client, user, contributor):
        """Test leaderboard is publicly accessible."""
        user.points = 100
        user.save()
        contributor.points = 200
        contributor.save()
        
        url = '/api/users/leaderboard/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2
        assert response.data['results'][0]['points'] == 200
    
    def test_leaderboard_excludes_email(self, api_client, user):
        """Test that leaderboard does not expose user emails."""
        user.points = 100
        user.save()
        
        url = '/api/users/leaderboard/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'email' not in response.data['results'][0]

    def test_leaderboard_excludes_admin_and_moderator_roles(self, api_client, user):
        """Leaderboard should show contributors/users, not moderation staff roles."""
        moderator = User.objects.create_user(
            username='mod',
            email='mod2@example.com',
            password='testpass123',
            role='moderator',
        )
        admin = User.objects.create_user(
            username='admin',
            email='admin2@example.com',
            password='testpass123',
            role='admin',
        )
        user.points = 120
        user.save()
        moderator.points = 999
        moderator.save()
        admin.points = 998
        admin.save()

        response = api_client.get('/api/users/leaderboard/')

        assert response.status_code == status.HTTP_200_OK
        roles = {entry['role'] for entry in response.data['results']}
        assert 'admin' not in roles
        assert 'moderator' not in roles
