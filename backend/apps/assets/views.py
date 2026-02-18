from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend

from .models import Category, Asset
from .serializers import (
    CategorySerializer,
    AssetListSerializer,
    AssetDetailSerializer,
    AssetCreateSerializer,
    AssetMySubmissionSerializer,
)
from .filters import AssetFilter
from .permissions import IsSubmitterOrReadOnly


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing and retrieving categories.
    
    GET /api/assets/categories/
    GET /api/assets/categories/{slug}/
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]


class AssetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for browsing, searching, and managing assets.
    
    GET /api/assets/ - List approved assets
    GET /api/assets/{slug}/ - Get asset details
    POST /api/assets/ - Submit new asset (authenticated)
    """
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AssetFilter
    search_fields = ['title', 'description', 'address']
    ordering_fields = ['created_at', 'average_rating', 'review_count', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        if self.action in ['list', 'featured', 'nearby']:
            return Asset.objects.filter(
                status=Asset.Status.APPROVED
            ).select_related('category').prefetch_related('images')
        if self.action == 'retrieve':
            base = Asset.objects.select_related('category').prefetch_related('images')
            if not self.request.user.is_authenticated:
                return base.filter(status=Asset.Status.APPROVED)
            if getattr(self.request.user, 'is_moderator', False):
                return base
            return base.filter(
                Q(status=Asset.Status.APPROVED) | Q(submitted_by=self.request.user)
            )
        return Asset.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'list':
            return AssetListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return AssetCreateSerializer
        return AssetDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'featured', 'nearby']:
            return [permissions.AllowAny()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsSubmitterOrReadOnly()]
        return [permissions.IsAuthenticated()]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Asset.objects.filter(pk=instance.pk).update(
            view_count=F('view_count') + 1
        )
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def featured(self, request):
        """Get featured assets for homepage."""
        featured = self.get_queryset().filter(featured=True)[:6]
        serializer = AssetListSerializer(featured, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def nearby(self, request):
        """Get assets near a location."""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        if not lat or not lng:
            return Response(
                {'error': 'lat and lng parameters required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = AssetFilter(
            {'lat': lat, 'lng': lng, 'radius': 15},
            queryset=self.get_queryset()
        ).qs[:20]
        
        serializer = AssetListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_submissions(self, request):
        """Get places submitted by the current user (pending, approved, rejected)."""
        queryset = (
            Asset.objects.filter(submitted_by=request.user)
            .select_related('category')
            .prefetch_related('images')
            .order_by('-created_at')
        )
        serializer = AssetMySubmissionSerializer(queryset, many=True)
        return Response(serializer.data)
