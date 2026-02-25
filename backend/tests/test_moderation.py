"""
Moderation API: queue, approve/reject/request-changes, user safety actions,
content reports, and admin-only audit log.

Uses real ``Asset`` / ``User`` rows from fixtures; no mocked permission backends.
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.assets.models import Asset
from apps.users.models import UserBadge


@pytest.mark.django_db
class TestModerationQueue:
    """Tests for moderation queue endpoints."""
    
    def test_queue_requires_moderator(self, auth_client, pending_asset):
        """Test that regular users cannot access moderation queue."""
        url = '/api/moderation/queue/'
        response = auth_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_queue_accessible_to_moderator(self, mod_client, pending_asset):
        """Test that moderators can access the queue."""
        url = '/api/moderation/queue/'
        response = mod_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == 'Pending Asset'
    
    def test_queue_shows_only_pending(self, mod_client, asset, pending_asset):
        """Test that queue only shows pending assets."""
        url = '/api/moderation/queue/'
        response = mod_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        titles = [a['title'] for a in response.data['results']]
        assert 'Pending Asset' in titles
        assert 'Test Asset' not in titles


@pytest.mark.django_db
class TestModerationDecision:
    """Tests for moderation decision endpoint."""
    
    def test_approve_asset(self, mod_client, pending_asset, user):
        """Test approving a pending asset."""
        initial_points = user.points
        
        url = f'/api/moderation/assets/{pending_asset.id}/decide/'
        data = {'action': 'approve', 'reason': 'Good submission'}
        response = mod_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['new_status'] == 'approved'
        
        pending_asset.refresh_from_db()
        assert pending_asset.status == Asset.Status.APPROVED
        
        user.refresh_from_db()
        assert user.points > initial_points
        assert UserBadge.objects.filter(user=user, badge_key='first_submission').exists()
    
    def test_reject_asset(self, mod_client, pending_asset):
        """Test rejecting a pending asset."""
        url = f'/api/moderation/assets/{pending_asset.id}/decide/'
        data = {'action': 'reject', 'reason': 'Duplicate entry'}
        response = mod_client.post(url, data)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['new_status'] == 'rejected'
        
        pending_asset.refresh_from_db()
        assert pending_asset.status == Asset.Status.REJECTED
    
    def test_decide_requires_moderator(self, auth_client, pending_asset):
        """Test that regular users cannot make moderation decisions."""
        url = f'/api/moderation/assets/{pending_asset.id}/decide/'
        data = {'action': 'approve'}
        response = auth_client.post(url, data)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_decide_invalid_action(self, mod_client, pending_asset):
        """Test that invalid actions are rejected."""
        url = f'/api/moderation/assets/{pending_asset.id}/decide/'
        data = {'action': 'invalid'}
        response = mod_client.post(url, data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_request_changes_keeps_asset_pending(self, mod_client, pending_asset):
        """Request changes should keep the asset in pending state."""
        url = f'/api/moderation/assets/{pending_asset.id}/decide/'
        data = {'action': 'request_changes', 'reason': 'Please add opening hours'}
        response = mod_client.post(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['new_status'] == 'pending'

        pending_asset.refresh_from_db()
        assert pending_asset.status == Asset.Status.PENDING


@pytest.mark.django_db
class TestModerationHistory:
    """Tests for moderation history endpoint."""

    def test_history_accessible_to_moderator(self, mod_client, pending_asset):
        """History should be visible to moderators."""
        decide_url = f'/api/moderation/assets/{pending_asset.id}/decide/'
        mod_client.post(decide_url, {'action': 'approve', 'reason': 'Looks good'})

        response = mod_client.get('/api/moderation/history/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1
        first = response.data['results'][0]
        assert first['asset'] == pending_asset.id
        assert first['asset_title'] == pending_asset.title
        assert first['action'] == 'approve'

    def test_history_requires_moderator(self, auth_client):
        """Regular users should not see moderation history."""
        response = auth_client.get('/api/moderation/history/')
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestModerationUserActions:
    """Tests for user suspend/ban/reactivate actions."""

    def test_list_users_for_moderation(self, mod_client, contributor):
        response = mod_client.get('/api/moderation/users/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] >= 1

    def test_suspend_user(self, mod_client, contributor):
        response = mod_client.post(
            f'/api/moderation/users/{contributor.id}/status/',
            {'action': 'suspend', 'reason': 'Abusive language'},
        )
        assert response.status_code == status.HTTP_200_OK
        contributor.refresh_from_db()
        assert contributor.is_active is False

    def test_reactivate_user(self, mod_client, contributor):
        contributor.is_active = False
        contributor.save(update_fields=['is_active'])
        response = mod_client.post(
            f'/api/moderation/users/{contributor.id}/status/',
            {'action': 'reactivate', 'reason': 'Appeal accepted'},
        )
        assert response.status_code == status.HTTP_200_OK
        contributor.refresh_from_db()
        assert contributor.is_active is True

    def test_moderator_cannot_manage_admin(self, mod_client, admin_user):
        response = mod_client.post(
            f'/api/moderation/users/{admin_user.id}/status/',
            {'action': 'ban', 'reason': 'Not allowed'},
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_manage_moderator(self, admin_user, moderator):
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken

        client = APIClient()
        refresh = RefreshToken.for_user(admin_user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        response = client.post(
            f'/api/moderation/users/{moderator.id}/status/',
            {'action': 'suspend', 'reason': 'Policy violation'},
        )
        assert response.status_code == status.HTTP_200_OK
        moderator.refresh_from_db()
        assert moderator.is_active is False


@pytest.mark.django_db
class TestModerationReports:
    """Tests for report submission, moderation visibility, and resolution."""

    def test_create_report_authenticated(self, auth_client, asset):
        response = auth_client.post(
            '/api/moderation/reports/',
            {
                'asset': asset.id,
                'report_type': 'inaccurate',
                'description': 'Opening hours are outdated.',
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['asset'] == asset.id
        assert response.data['report_type'] == 'inaccurate'
        assert response.data['description'] == 'Opening hours are outdated.'

    def test_reports_visible_to_reporter_and_moderator(self, auth_client, mod_client, asset):
        create_response = auth_client.post(
            '/api/moderation/reports/',
            {
                'asset': asset.id,
                'report_type': 'other',
                'description': 'Needs review.',
            },
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        reporter_list = auth_client.get('/api/moderation/reports/')
        assert reporter_list.status_code == status.HTTP_200_OK
        report_id = reporter_list.data['results'][0]['id']
        reporter_ids = [item['id'] for item in reporter_list.data['results']]
        assert report_id in reporter_ids

        moderator_list = mod_client.get('/api/moderation/reports/')
        assert moderator_list.status_code == status.HTTP_200_OK
        moderator_ids = [item['id'] for item in moderator_list.data['results']]
        assert report_id in moderator_ids

    def test_moderator_can_resolve_report(self, auth_client, mod_client, asset):
        assert auth_client.post(
            '/api/moderation/reports/',
            {
                'asset': asset.id,
                'report_type': 'spam',
                'description': 'Looks like spam content.',
            },
        ).status_code == status.HTTP_201_CREATED
        reporter_list = auth_client.get('/api/moderation/reports/')
        report_id = reporter_list.data['results'][0]['id']

        resolve_response = mod_client.post(
            f'/api/moderation/reports/{report_id}/resolve/',
            {'resolution': 'resolved', 'notes': 'Checked and actioned.'},
        )
        assert resolve_response.status_code == status.HTTP_200_OK
        assert resolve_response.data['status'] == 'success'

    def test_resolve_report_rejects_invalid_resolution(self, auth_client, mod_client, asset):
        assert auth_client.post(
            '/api/moderation/reports/',
            {
                'asset': asset.id,
                'report_type': 'closed',
                'description': 'Place appears closed.',
            },
        ).status_code == status.HTTP_201_CREATED
        reporter_list = auth_client.get('/api/moderation/reports/')
        report_id = reporter_list.data['results'][0]['id']

        resolve_response = mod_client.post(
            f'/api/moderation/reports/{report_id}/resolve/',
            {'resolution': 'invalid_status'},
        )
        assert resolve_response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestModerationAudit:
    """Tests for admin-only audit log endpoint."""

    def test_audit_requires_admin(self, mod_client):
        response = mod_client.get('/api/moderation/audit/')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_view_audit(self, admin_user):
        client = APIClient()
        refresh = RefreshToken.for_user(admin_user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        response = client.get('/api/moderation/audit/')
        assert response.status_code == status.HTTP_200_OK
