"""
Shared pytest fixtures for the API test suite.

Uses ``pytest-django`` (see ``DJANGO_SETTINGS_MODULE=config.settings.test``).
Fixtures build isolated users, JWT-authenticated clients, and minimal ``Category`` /
``Asset`` rows so tests do not depend on demo seed data.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.assets.models import Category, Asset


User = get_user_model()


@pytest.fixture
def api_client():
    """Return an unauthenticated API client."""
    return APIClient()


@pytest.fixture
def user(db):
    """Create a regular user."""
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        role='user'
    )


@pytest.fixture
def contributor(db):
    """Create a contributor user."""
    return User.objects.create_user(
        username='contributor',
        email='contributor@example.com',
        password='testpass123',
        role='contributor'
    )


@pytest.fixture
def moderator(db):
    """Create a moderator user."""
    return User.objects.create_user(
        username='moderator',
        email='mod@example.com',
        password='testpass123',
        role='moderator'
    )


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return User.objects.create_user(
        username='admin',
        email='admin@example.com',
        password='testpass123',
        role='admin',
        is_staff=True
    )


@pytest.fixture
def auth_client(user):
    """Return an authenticated API client (separate instance)."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.fixture
def mod_client(moderator):
    """Return a moderator-authenticated API client (separate instance)."""
    client = APIClient()
    refresh = RefreshToken.for_user(moderator)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.fixture
def contributor_client(contributor):
    """Authenticated as contributor (not owner of default `asset` fixture)."""
    client = APIClient()
    refresh = RefreshToken.for_user(contributor)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


@pytest.fixture
def category(db):
    """Create a test category."""
    return Category.objects.create(
        name='Test Category',
        slug='test-category',
        description='A test category',
        display_order=1
    )


@pytest.fixture
def asset(db, category, user):
    """Create a test asset."""
    return Asset.objects.create(
        title='Test Asset',
        slug='test-asset',
        description='A test asset for testing',
        category=category,
        latitude=50.2660,
        longitude=-5.0527,
        status=Asset.Status.APPROVED,
        submitted_by=user
    )


@pytest.fixture
def pending_asset(db, category, user):
    """Create a pending asset."""
    return Asset.objects.create(
        title='Pending Asset',
        slug='pending-asset',
        description='An asset awaiting moderation',
        category=category,
        latitude=50.1234,
        longitude=-5.1234,
        status=Asset.Status.PENDING,
        submitted_by=user
    )
