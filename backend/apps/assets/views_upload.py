from rest_framework import viewsets, permissions, status, parsers
from rest_framework.response import Response

from .models import Asset, AssetImage
from .serializers_upload import AssetImageUploadSerializer


class AssetImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing asset images.
    
    POST /api/assets/{slug}/images/ - Upload image
    DELETE /api/assets/{slug}/images/{id}/ - Remove image
    """
    serializer_class = AssetImageUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    def get_queryset(self):
        asset_slug = self.kwargs.get('asset_slug')
        return AssetImage.objects.filter(asset__slug=asset_slug)
    
    def create(self, request, asset_slug=None):
        try:
            asset = Asset.objects.get(slug=asset_slug)
        except Asset.DoesNotExist:
            return Response(
                {'error': 'Asset not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        can_upload = (
            request.user.is_moderator or
            asset.submitted_by == request.user
        )
        
        if not can_upload:
            return Response(
                {'error': 'Not authorized to upload images'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data.copy()
        data['asset'] = asset.id
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        image = serializer.save()
        
        if data.get('is_primary'):
            AssetImage.objects.filter(asset=asset).exclude(pk=image.pk).update(
                is_primary=False
            )
        
        request.user.add_points(5, 'Image uploaded')
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        can_delete = (
            request.user.is_moderator or
            instance.uploaded_by == request.user
        )
        
        if not can_delete:
            return Response(
                {'error': 'Not authorized to delete this image'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
