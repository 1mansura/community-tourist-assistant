"""
Auth and account-state behaviour: register, login, suspended vs banned messaging, profile.

Overlaps slightly with ``test_users.py`` but adds ``AuditLog``-driven ban copy tests.
"""
import pytest
from rest_framework import status
from apps.moderation.models import AuditLog


@pytest.mark.django_db
class TestRegistration:
    """Tests for user registration."""
    
    def test_register_user(self, api_client):
        """Test successful user registration."""
        url = '/api/users/register/'
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
            'first_name': 'New',
            'last_name': 'User',
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'user' in response.data
        assert response.data['user']['email'] == 'newuser@example.com'
    
    def test_register_password_mismatch(self, api_client):
        """Test registration fails with mismatched passwords."""
        url = '/api/users/register/'
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password_confirm': 'DifferentPass456!',
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_duplicate_email(self, api_client, user):
        """Test registration fails with existing email."""
        url = '/api/users/register/'
        data = {
            'email': 'test@example.com',
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    """Tests for user authentication."""
    
    def test_login_success(self, api_client, user):
        """Test successful login returns tokens."""
        url = '/api/users/login/'
        data = {
            'email': 'test@example.com',
            'password': 'testpass123',
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_login_invalid_password(self, api_client, user):
        """Wrong password returns the same generic detail as unknown email (no enumeration)."""
        url = '/api/users/login/'
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword',
        }
        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.data.get('detail') == 'Invalid email or password.'

    def test_login_unknown_email_same_detail_as_wrong_password(self, api_client, user):
        """Unknown email must not imply the account does not exist."""
        url = '/api/users/login/'
        wrong_pw = api_client.post(
            url,
            {'email': user.email, 'password': 'not-the-real-password'},
        )
        unknown_email = api_client.post(
            url,
            {'email': 'nobody-at-all@example.com', 'password': 'any-password-123'},
        )
        assert wrong_pw.status_code == status.HTTP_401_UNAUTHORIZED
        assert unknown_email.status_code == status.HTTP_401_UNAUTHORIZED
        assert wrong_pw.data.get('detail') == unknown_email.data.get('detail') == 'Invalid email or password.'

    def test_login_suspended_account_message(self, api_client, user):
        """Inactive users get a clear suspended-account error."""
        user.is_active = False
        user.save(update_fields=['is_active'])

        response = api_client.post(
            '/api/users/login/',
            {'email': user.email, 'password': 'testpass123'},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'suspended' in str(response.data.get('detail', '')).lower()

    def test_login_banned_account_message(self, api_client, user):
        """Banned users get a clear banned-account error."""
        user.is_active = False
        user.save(update_fields=['is_active'])
        AuditLog.objects.create(
            user=user,
            action='user_ban',
            target_type='user',
            target_id=user.id,
            details={},
        )

        response = api_client.post(
            '/api/users/login/',
            {'email': user.email, 'password': 'testpass123'},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert 'banned' in str(response.data.get('detail', '')).lower()


@pytest.mark.django_db
class TestProfile:
    """Tests for user profile endpoints."""
    
    def test_get_profile_authenticated(self, auth_client, user):
        """Test getting profile when authenticated."""
        url = '/api/users/profile/'
        response = auth_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'test@example.com'
    
    def test_get_profile_unauthenticated(self, api_client):
        """Test profile requires authentication."""
        url = '/api/users/profile/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
