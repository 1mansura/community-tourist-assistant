"""
URL configuration for Community Tourist Assistant.
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include, re_path
from django.db import connection
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from apps.assets.views_media import serve_media


def api_root(request):
    """Root URL: confirm backend is running and point to API docs."""
    return JsonResponse({
        'name': 'Community Tourist Assistant API',
        'docs': '/api/docs/',
        'schema': '/api/schema/',
        'admin': '/admin/',
    })


def api_index(request):
    """API root: list main API sections."""
    return JsonResponse({
        'users': '/api/users/',
        'assets': '/api/assets/',
        'reviews': '/api/reviews/',
        'moderation': '/api/moderation/',
        'analytics': '/api/analytics/',
        'docs': '/api/docs/',
    })


def health_check(request):
    """Basic health endpoint for local/dev monitoring."""
    db_ok = True
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception:
        db_ok = False

    status_code = 200 if db_ok else 503
    return JsonResponse(
        {
            'status': 'ok' if db_ok else 'degraded',
            'service': 'backend',
            'database': 'up' if db_ok else 'down',
        },
        status=status_code,
    )


urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),
    path('health/', health_check),
    path('api/', api_index),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/users/', include('apps.users.urls')),
    path('api/assets/', include('apps.assets.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/moderation/', include('apps.moderation.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    # Media: stream from default_storage (local or S3/MinIO). Used by Next /api/media/* rewrite.
    re_path(r'^media/(?P<path>.*)$', serve_media),
]
