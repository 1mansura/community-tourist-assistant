"""
Review API: listing filters, validation (one review per user per place), helpful votes,
and asset rating aggregates after delete.

Gamification (points + ``first_review`` badge) is covered in ``TestReviewsGamification``.
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.assets.models import Asset
from apps.reviews.models import Review
from apps.users.models import UserBadge


@pytest.mark.django_db
class TestReviewsGamification:
    """Review creation should update incentives and badges."""

    def test_create_review_awards_points_and_first_review_badge(self, auth_client, asset, user):
        initial_points = user.points

        response = auth_client.post(
            '/api/reviews/',
            {
                'asset': asset.id,
                'rating': 5,
                'title': 'Great place',
                'content': 'Would visit again.',
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['points_awarded'] == 20
        assert 'first_review' in response.data['badges_awarded']
        user.refresh_from_db()
        assert user.points == initial_points + 20  # 10 review points + 10 first_review badge points
        assert UserBadge.objects.filter(user=user, badge_key='first_review').exists()


@pytest.mark.django_db
class TestReviewsAPI:
    """List, filter, validation, helpful votes, and asset rating updates after mutations."""

    def test_list_reviews_filter_by_asset_slug(self, api_client, auth_client, asset, user):
        auth_client.post(
            '/api/reviews/',
            {
                'asset': asset.id,
                'rating': 4,
                'title': 'Nice',
                'content': 'Good visit.',
            },
        )
        response = api_client.get(f'/api/reviews/?asset={asset.slug}')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['asset_slug'] == asset.slug

    def test_list_reviews_mine_only_when_authenticated(self, auth_client, asset, user, category):
        second = Asset.objects.create(
            title='Second Place',
            slug='second-place-reviews',
            description='d',
            category=category,
            latitude=50.1,
            longitude=-5.1,
            status=Asset.Status.APPROVED,
            submitted_by=user,
        )
        auth_client.post(
            '/api/reviews/',
            {'asset': asset.id, 'rating': 5, 'title': 'A', 'content': 'one'},
        )
        auth_client.post(
            '/api/reviews/',
            {'asset': second.id, 'rating': 3, 'title': 'B', 'content': 'two'},
        )
        r = auth_client.get('/api/reviews/?mine=1')
        assert r.status_code == status.HTTP_200_OK
        assert r.data['count'] == 2
        for row in r.data['results']:
            assert row['username'] == user.username

    def test_cannot_review_pending_asset(self, auth_client, pending_asset):
        response = auth_client.post(
            '/api/reviews/',
            {
                'asset': pending_asset.id,
                'rating': 5,
                'title': 'x',
                'content': 'y',
            },
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_review_same_asset_twice(self, auth_client, asset):
        payload = {'asset': asset.id, 'rating': 5, 'title': 'x', 'content': 'y'}
        assert auth_client.post('/api/reviews/', payload).status_code == status.HTTP_201_CREATED
        r2 = auth_client.post('/api/reviews/', payload)
        assert r2.status_code == status.HTTP_400_BAD_REQUEST

    def test_helpful_vote_and_unvote(self, auth_client, mod_client, asset, user):
        auth_client.post(
            '/api/reviews/',
            {'asset': asset.id, 'rating': 5, 'title': 'R', 'content': 'body'},
        )
        review = Review.objects.get(asset=asset, user=user)
        url = f'/api/reviews/{review.id}/helpful/'
        r1 = mod_client.post(url)
        assert r1.status_code == status.HTTP_200_OK
        assert r1.data['status'] == 'voted'
        review.refresh_from_db()
        assert review.helpful_count == 1
        r2 = mod_client.post(url)
        assert r2.status_code == status.HTTP_200_OK
        assert r2.data['status'] == 'unvoted'
        review.refresh_from_db()
        assert review.helpful_count == 0

    def test_helpful_rejects_own_review(self, auth_client, asset, user):
        auth_client.post(
            '/api/reviews/',
            {'asset': asset.id, 'rating': 4, 'title': 'S', 'content': 'z'},
        )
        review = Review.objects.get(asset=asset, user=user)
        r = auth_client.post(f'/api/reviews/{review.id}/helpful/')
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_delete_review_recalculates_asset_stats(self, auth_client, api_client, asset, user):
        auth_client.post(
            '/api/reviews/',
            {'asset': asset.id, 'rating': 5, 'title': 'a', 'content': 'b'},
        )
        review = Review.objects.get(asset=asset, user=user)
        asset.refresh_from_db()
        assert asset.review_count == 1
        assert float(asset.average_rating) == 5.0
        auth_client.delete(f'/api/reviews/{review.id}/')
        asset.refresh_from_db()
        assert asset.review_count == 0
        assert float(asset.average_rating) == 0.0

    def test_unauthenticated_mine_param_ignored_lists_all(self, api_client, asset, user):
        client_u = APIClient()
        refresh = RefreshToken.for_user(user)
        client_u.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        client_u.post(
            '/api/reviews/',
            {'asset': asset.id, 'rating': 3, 'title': 't', 'content': 'c'},
        )
        r = api_client.get('/api/reviews/?mine=1')
        assert r.status_code == status.HTTP_200_OK
        assert r.data['count'] >= 1
