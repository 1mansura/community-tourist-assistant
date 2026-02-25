"""
Tests for ``/api/analytics/stats/`` (public) and ``/api/analytics/admin/`` (staff).

Stats aggregate approved assets, users, reviews, and categories.
Admin analytics require an authenticated moderator/admin and expose dashboard fields.
"""
import pytest

from apps.assets.models import Asset
from apps.moderation.models import ModerationAction
from apps.reviews.models import Review


@pytest.mark.django_db
class TestPlatformStatsAPI:
    """Public homepage-style aggregates; no authentication required."""

    def test_stats_is_public(self, api_client):
        response = api_client.get('/api/analytics/stats/')
        assert response.status_code == 200

    def test_stats_has_expected_sections(self, api_client):
        response = api_client.get('/api/analytics/stats/')
        data = response.json()
        assert set(data.keys()) == {'assets', 'users', 'reviews', 'categories'}

    def test_assets_total_counts_approved_only(self, api_client, asset, pending_asset):
        response = api_client.get('/api/analytics/stats/')
        assert response.status_code == 200
        data = response.json()
        assert data['assets']['total'] == 1

    def test_reviews_average_rating_is_computed(self, api_client, asset, user):
        Review.objects.create(
            asset=asset,
            user=user,
            rating=4,
            title='Great',
            content='Nice place',
        )
        response = api_client.get('/api/analytics/stats/')
        assert response.status_code == 200
        data = response.json()
        assert data['reviews']['total'] == 1
        assert float(data['reviews']['average_rating']) == 4.0


@pytest.mark.django_db
class TestAdminAnalyticsAPI:
    """Moderator/admin dashboard metrics: permissions, shape, and sample counters."""

    def test_admin_analytics_requires_auth(self, api_client):
        response = api_client.get('/api/analytics/admin/')
        assert response.status_code == 401

    def test_admin_analytics_forbids_regular_user(self, auth_client):
        response = auth_client.get('/api/analytics/admin/')
        assert response.status_code == 403

    def test_admin_analytics_allows_moderator(self, mod_client):
        response = mod_client.get('/api/analytics/admin/')
        assert response.status_code == 200

    def test_admin_analytics_has_expected_fields(self, mod_client):
        response = mod_client.get('/api/analytics/admin/')
        data = response.json()
        assert set(data.keys()) == {
            'pending_moderation',
            'daily_submissions',
            'top_contributors',
            'category_breakdown',
            'moderation_summary',
            'assets_by_status',
        }

    def test_moderation_summary_counts_actions(self, mod_client, moderator, asset):
        ModerationAction.objects.create(asset=asset, moderator=moderator, action='approve')
        ModerationAction.objects.create(asset=asset, moderator=moderator, action='reject')
        ModerationAction.objects.create(asset=asset, moderator=moderator, action='request_changes')

        response = mod_client.get('/api/analytics/admin/')
        assert response.status_code == 200
        data = response.json()
        assert data['moderation_summary']['approved'] >= 1
        assert data['moderation_summary']['rejected'] >= 1
        assert data['moderation_summary']['requested_changes'] >= 1

    def test_assets_by_status_includes_rejected_count(self, mod_client, category, user):
        Asset.objects.create(
            title='Rejected Asset',
            slug='rejected-asset',
            description='Rejected item',
            category=category,
            latitude=50.1111,
            longitude=-3.1111,
            status=Asset.Status.REJECTED,
            submitted_by=user,
        )

        response = mod_client.get('/api/analytics/admin/')
        assert response.status_code == 200
        data = response.json()
        assert data['assets_by_status']['rejected'] >= 1
