from rest_framework import serializers
from .models import Category, Asset, AssetImage


class CategorySerializer(serializers.ModelSerializer):
    asset_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'asset_count']
    
    def get_asset_count(self, obj):
        return obj.assets.filter(status=Asset.Status.APPROVED).count()


class AssetImageSerializer(serializers.ModelSerializer):
    """Serializer for asset images. Always returns a relative path so the frontend can load via its proxy."""
    
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = AssetImage
        fields = ['id', 'image', 'caption', 'is_primary', 'uploaded_at']
    
    def get_image(self, obj):
        if not obj.image:
            return None
        # Always expose /media/<storage name> so the frontend can proxy via /api/media/
        # and Django streams from disk or MinIO (avoids next/image + localhost:9000 in Docker).
        name = (obj.image.name or '').lstrip('/')
        if not name:
            return None
        return f'/media/{name}'


class AssetListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    primary_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Asset
        fields = [
            'id', 'title', 'slug', 'category', 'category_name', 'category_slug',
            'latitude', 'longitude', 'average_rating', 'review_count',
            'primary_image', 'featured'
        ]
    
    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return AssetImageSerializer(primary).data
        first = obj.images.first()
        return AssetImageSerializer(first).data if first else None


class AssetMySubmissionSerializer(AssetListSerializer):
    """List serializer for current user's submitted places (includes status)."""
    status = serializers.CharField(read_only=True)

    class Meta(AssetListSerializer.Meta):
        fields = AssetListSerializer.Meta.fields + ['status', 'created_at']


class AssetDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = AssetImageSerializer(many=True, read_only=True)
    submitted_by_username = serializers.CharField(
        source='submitted_by.username',
        read_only=True
    )
    
    class Meta:
        model = Asset
        fields = [
            'id', 'title', 'slug', 'description', 'category',
            'latitude', 'longitude', 'address', 'postcode',
            'website', 'phone', 'opening_hours',
            'average_rating', 'review_count', 'view_count',
            'featured', 'status', 'images', 'submitted_by_username',
            'created_at', 'updated_at'
        ]


class AssetCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new assets. Returns slug in response so frontend can upload images."""
    
    class Meta:
        model = Asset
        fields = [
            'id', 'slug', 'title', 'description', 'category',
            'latitude', 'longitude', 'address', 'postcode',
            'website', 'phone', 'opening_hours'
        ]
        read_only_fields = ['id', 'slug']
    
    def create(self, validated_data):
        from django.utils.text import slugify
        import uuid
        
        title = validated_data['title']
        base_slug = slugify(title)
        slug = base_slug
        
        while Asset.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"
        
        validated_data['slug'] = slug
        validated_data['submitted_by'] = self.context['request'].user
        validated_data['status'] = Asset.Status.PENDING
        
        return super().create(validated_data)
