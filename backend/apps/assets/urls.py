from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, AssetViewSet
from .views_upload import AssetImageViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('', AssetViewSet, basename='asset')

urlpatterns = [
    path('<slug:asset_slug>/images/', AssetImageViewSet.as_view({
        'get': 'list',
        'post': 'create',
    }), name='asset-images'),
    path('<slug:asset_slug>/images/<int:pk>/', AssetImageViewSet.as_view({
        'delete': 'destroy',
    }), name='asset-image-detail'),
    path('', include(router.urls)),
]
