"""
Smoke tests for non-versioned URLs: health check and API index.

These are cheap sanity checks that the URLConf wires ``/health/`` and ``/api/``
without going through the full DRF router.
"""
import pytest


@pytest.mark.django_db
class TestSystemEndpoints:
    """Basic operational endpoint checks."""

    def test_health_endpoint_reports_backend_and_database(self, api_client):
        response = api_client.get('/health/')
        assert response.status_code == 200
        data = response.json()
        assert data['service'] == 'backend'
        assert data['status'] in {'ok', 'degraded'}
        assert data['database'] in {'up', 'down'}

    def test_api_index_lists_main_sections(self, api_client):
        response = api_client.get('/api/')
        assert response.status_code == 200
        data = response.json()
        assert set(data.keys()) == {'users', 'assets', 'reviews', 'moderation', 'analytics', 'docs'}
