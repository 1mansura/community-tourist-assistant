"""
API tests for places (assets): categories, CRUD, media serving, nearby search,
my submissions, and multipart image upload/delete.

Uses ``conftest`` fixtures; media tests rely on local filesystem storage
(``config.settings.test``), not MinIO.
"""
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from apps.assets.models import Asset, AssetImage


def _tiny_gif(name: str = 'upload.gif') -> SimpleUploadedFile:
    """Minimal valid GIF bytes for ``ImageField`` / multipart uploads in tests."""
    return SimpleUploadedFile(
        name,
        (
            b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00'
            b'\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00'
            b'\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
        ),
        content_type='image/gif',
    )


@pytest.mark.django_db
class TestCategoryAPI:
    """Tests for category endpoints."""
    
    def test_list_categories(self, api_client, category):
        """Test listing categories."""
        url = '/api/assets/categories/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['name'] == 'Test Category'
    
    def test_retrieve_category(self, api_client, category):
        """Test retrieving a single category."""
        url = f'/api/assets/categories/{category.slug}/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Test Category'


@pytest.mark.django_db
class TestAssetAPI:
    """Tests for asset endpoints."""
    
    def test_list_assets_unauthenticated(self, api_client, asset):
        """Test that assets can be listed without authentication."""
        url = '/api/assets/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        assert response.data['results'][0]['title'] == 'Test Asset'
    
    def test_list_assets_excludes_pending(self, api_client, asset, pending_asset):
        """Test that pending assets are not shown in public listing."""
        url = '/api/assets/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
        titles = [a['title'] for a in response.data['results']]
        assert 'Test Asset' in titles
        assert 'Pending Asset' not in titles
    
    def test_retrieve_asset(self, api_client, asset):
        """Test retrieving asset details."""
        url = f'/api/assets/{asset.slug}/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Test Asset'
        assert 'category' in response.data
        assert float(response.data['latitude']) == pytest.approx(50.2660, rel=1e-4)

    def test_retrieve_pending_asset_hidden_from_public(self, api_client, pending_asset):
        """Pending assets should not be retrievable by unauthenticated users."""
        response = api_client.get(f'/api/assets/{pending_asset.slug}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_retrieve_pending_asset_visible_to_submitter(self, auth_client, pending_asset):
        """Submitter should be able to retrieve own pending asset."""
        response = auth_client.get(f'/api/assets/{pending_asset.slug}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['slug'] == pending_asset.slug
    
    def test_retrieve_increments_view_count(self, api_client, asset):
        """Test that retrieving an asset increments view count."""
        initial_views = asset.view_count
        url = f'/api/assets/{asset.slug}/'
        
        api_client.get(url)
        asset.refresh_from_db()
        
        assert asset.view_count == initial_views + 1
    
    def test_create_asset_unauthenticated(self, api_client, category):
        """Test that creating an asset requires authentication."""
        url = '/api/assets/'
        data = {
            'title': 'New Asset',
            'description': 'A new test asset',
            'category': category.id,
            'latitude': 50.1234,
            'longitude': -5.1234,
        }
        response = api_client.post(url, data)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_asset_authenticated(self, auth_client, category):
        """Test creating an asset when authenticated."""
        url = '/api/assets/'
        data = {
            'title': 'New Asset',
            'description': 'A new test asset',
            'category': category.id,
            'latitude': 50.1234,
            'longitude': -5.1234,
        }
        response = auth_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        assert Asset.objects.filter(title='New Asset').exists()
        
        new_asset = Asset.objects.get(title='New Asset')
        assert new_asset.status == Asset.Status.PENDING
    
    def test_search_assets(self, api_client, asset):
        """Test searching assets."""
        url = '/api/assets/?search=Test'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
    
    def test_filter_by_category(self, api_client, asset, category):
        """Test filtering assets by category."""
        url = f'/api/assets/?category={category.slug}'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
    
    def test_featured_endpoint(self, api_client, asset):
        """Test featured assets endpoint."""
        asset.featured = True
        asset.save()
        
        url = '/api/assets/featured/'
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_featured_endpoint_includes_relative_primary_image(self, api_client, asset, user):
        """Featured/list payload should expose a relative media path for primary image."""
        asset.featured = True
        asset.save()
        image = SimpleUploadedFile(
            'test.gif',
            (
                b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00'
                b'\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00'
                b'\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
            ),
            content_type='image/gif',
        )
        AssetImage.objects.create(
            asset=asset,
            image=image,
            caption='Test image',
            is_primary=True,
            uploaded_by=user,
        )

        response = api_client.get('/api/assets/featured/')

        assert response.status_code == status.HTTP_200_OK
        assert response.data[0]['primary_image']['image'].startswith('/media/')

    def test_serve_media_streams_uploaded_file(self, api_client, asset, user):
        """GET /media/<path> streams from default_storage (used by Next /api/media proxy)."""
        image = SimpleUploadedFile(
            'pixel.gif',
            (
                b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00'
                b'\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00'
                b'\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
            ),
            content_type='image/gif',
        )
        ai = AssetImage.objects.create(
            asset=asset,
            image=image,
            caption='x',
            is_primary=True,
            uploaded_by=user,
        )
        rel_path = ai.image.name
        response = api_client.get(f'/media/{rel_path}')
        assert response.status_code == status.HTTP_200_OK
        body = b''.join(response.streaming_content)
        assert b'GIF89a' in body

    def test_serve_media_rejects_path_traversal(self, api_client):
        assert api_client.get('/media/../manage.py').status_code == status.HTTP_404_NOT_FOUND

    def test_serve_media_missing_file(self, api_client):
        assert api_client.get('/media/does-not-exist-xyz.bin').status_code == status.HTTP_404_NOT_FOUND

    def test_serve_media_empty_path_404(self, api_client):
        assert api_client.get('/media/').status_code == status.HTTP_404_NOT_FOUND

    def test_asset_detail_image_urls_are_relative_media_paths(self, api_client, asset, user):
        image = SimpleUploadedFile(
            'x.gif',
            (
                b'GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00'
                b'\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00'
                b'\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'
            ),
            content_type='image/gif',
        )
        AssetImage.objects.create(
            asset=asset,
            image=image,
            caption='',
            is_primary=True,
            uploaded_by=user,
        )
        response = api_client.get(f'/api/assets/{asset.slug}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['images']
        assert response.data['images'][0]['image'].startswith('/media/')
        assert not response.data['images'][0]['image'].startswith('http')


@pytest.mark.django_db
class TestAssetNearbyAndSubmissions:
    """Geo filter action and authenticated ``my_submissions`` list."""

    def test_nearby_requires_lat_and_lng(self, api_client, asset):
        assert api_client.get('/api/assets/nearby/').status_code == status.HTTP_400_BAD_REQUEST
        assert api_client.get('/api/assets/nearby/?lat=50.2').status_code == status.HTTP_400_BAD_REQUEST

    def test_nearby_returns_near_assets(self, api_client, asset):
        r = api_client.get(
            f'/api/assets/nearby/?lat={asset.latitude}&lng={asset.longitude}&radius=50'
        )
        assert r.status_code == status.HTTP_200_OK
        assert len(r.data) >= 1
        slugs = [a['slug'] for a in r.data]
        assert asset.slug in slugs

    def test_my_submissions_requires_auth(self, api_client):
        assert api_client.get('/api/assets/my_submissions/').status_code == status.HTTP_401_UNAUTHORIZED

    def test_my_submissions_lists_current_user_assets(self, auth_client, asset, user, category):
        r = auth_client.get('/api/assets/my_submissions/')
        assert r.status_code == status.HTTP_200_OK
        assert isinstance(r.data, list)
        slugs = [row['slug'] for row in r.data]
        assert asset.slug in slugs


@pytest.mark.django_db
class TestAssetImageUploadAPI:
    """POST/DELETE ``/api/assets/{slug}/images/`` — ownership and moderator bypass."""

    def test_upload_image_as_submitter(self, auth_client, asset, user):
        r = auth_client.post(
            f'/api/assets/{asset.slug}/images/',
            {'image': _tiny_gif(), 'caption': 'New shot', 'is_primary': False},
            format='multipart',
        )
        assert r.status_code == status.HTTP_201_CREATED
        assert r.data['image'].startswith('/media/')
        user.refresh_from_db()
        assert user.points >= 5

    def test_upload_image_moderator_on_any_asset(self, mod_client, asset):
        r = mod_client.post(
            f'/api/assets/{asset.slug}/images/',
            {'image': _tiny_gif('mod.gif'), 'caption': 'Mod upload'},
            format='multipart',
        )
        assert r.status_code == status.HTTP_201_CREATED

    def test_upload_image_forbidden_for_other_user(self, contributor_client, asset):
        r = contributor_client.post(
            f'/api/assets/{asset.slug}/images/',
            {'image': _tiny_gif('bad.gif'), 'caption': 'x'},
            format='multipart',
        )
        assert r.status_code == status.HTTP_403_FORBIDDEN

    def test_upload_image_asset_not_found(self, auth_client):
        r = auth_client.post(
            '/api/assets/no-such-slug-xyz/images/',
            {'image': _tiny_gif(), 'caption': 'x'},
            format='multipart',
        )
        assert r.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_own_uploaded_image(self, auth_client, asset, user):
        create = auth_client.post(
            f'/api/assets/{asset.slug}/images/',
            {'image': _tiny_gif('del.gif'), 'caption': 'tmp'},
            format='multipart',
        )
        assert create.status_code == status.HTTP_201_CREATED
        img_id = create.data['id']
        r = auth_client.delete(f'/api/assets/{asset.slug}/images/{img_id}/')
        assert r.status_code == status.HTTP_204_NO_CONTENT
