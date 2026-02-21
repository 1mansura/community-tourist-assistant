from rest_framework import serializers
from .models import AssetImage


class AssetImageUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading images to assets."""

    class Meta:
        model = AssetImage
        fields = ['id', 'asset', 'image', 'caption', 'is_primary', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']
    
    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            name = (instance.image.name or '').lstrip('/')
            if name:
                data['image'] = f'/media/{name}'
        return data
