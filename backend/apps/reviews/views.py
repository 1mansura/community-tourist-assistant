from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F

from .models import Review, ReviewHelpful
from .serializers import ReviewSerializer, ReviewCreateSerializer
from .permissions import IsOwnerOrReadOnly


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reviews.
    
    GET /api/reviews/?asset={slug} - List reviews for an asset
    POST /api/reviews/ - Create a review
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    
    def get_queryset(self):
        queryset = Review.objects.select_related('user', 'asset')
        
        asset_slug = self.request.query_params.get('asset')
        if asset_slug:
            queryset = queryset.filter(asset__slug=asset_slug)
        
        # GET /api/reviews/?mine=1 — current user's reviews only
        if self.request.query_params.get('mine') and self.request.user.is_authenticated:
            queryset = queryset.filter(user=self.request.user)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        review = serializer.instance
        output = ReviewSerializer(review, context=self.get_serializer_context()).data
        headers = self.get_success_headers(output)
        return Response(output, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        super().perform_update(serializer)
        asset = serializer.instance.asset
        from django.db.models import Avg
        stats = asset.reviews.aggregate(avg=Avg('rating'))
        asset.average_rating = stats['avg'] or 0
        asset.review_count = asset.reviews.count()
        asset.save(update_fields=['average_rating', 'review_count'])

    def perform_destroy(self, instance):
        asset = instance.asset
        instance.delete()
        
        from django.db.models import Avg
        stats = asset.reviews.aggregate(avg=Avg('rating'))
        asset.average_rating = stats['avg'] or 0
        asset.review_count = asset.reviews.count()
        asset.save(update_fields=['average_rating', 'review_count'])
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def helpful(self, request, pk=None):
        """Mark a review as helpful."""
        review = self.get_object()
        
        if review.user == request.user:
            return Response(
                {'error': 'Cannot vote on your own review'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        helpful, created = ReviewHelpful.objects.get_or_create(
            review=review,
            user=request.user
        )
        
        if created:
            Review.objects.filter(pk=review.pk).update(
                helpful_count=F('helpful_count') + 1
            )
            return Response({'status': 'voted'})
        else:
            helpful.delete()
            Review.objects.filter(pk=review.pk).update(
                helpful_count=F('helpful_count') - 1
            )
            return Response({'status': 'unvoted'})
