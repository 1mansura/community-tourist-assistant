from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.ImageField(source='user.avatar', read_only=True)
    has_voted_helpful = serializers.SerializerMethodField()
    points_awarded = serializers.SerializerMethodField()
    badges_awarded = serializers.SerializerMethodField()
    asset_slug = serializers.CharField(source='asset.slug', read_only=True)
    asset_title = serializers.CharField(source='asset.title', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'asset', 'asset_slug', 'asset_title', 'user', 'username', 'user_avatar',
            'rating', 'title', 'content', 'visit_date',
            'helpful_count', 'has_voted_helpful', 'points_awarded', 'badges_awarded', 'created_at'
        ]
        read_only_fields = ['id', 'asset', 'user', 'helpful_count', 'created_at']
    
    def get_has_voted_helpful(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.helpful_votes.filter(user=request.user).exists()

    def get_points_awarded(self, obj):
        return getattr(obj, 'points_awarded', 0)

    def get_badges_awarded(self, obj):
        return getattr(obj, 'badges_awarded', [])


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['asset', 'rating', 'title', 'content', 'visit_date']
    
    def validate(self, attrs):
        user = self.context['request'].user
        asset = attrs['asset']
        
        from apps.assets.models import Asset
        if asset.status != Asset.Status.APPROVED:
            raise serializers.ValidationError(
                "Cannot review assets that aren't approved."
            )
        
        if Review.objects.filter(asset=asset, user=user).exists():
            raise serializers.ValidationError(
                "You have already reviewed this place."
            )
        
        return attrs
    
    def create(self, validated_data):
        user = self.context['request'].user
        initial_points = user.points
        validated_data['user'] = user
        review = super().create(validated_data)
        
        self._update_asset_rating(review.asset)
        from apps.users.badges import check_and_award_badges
        newly_awarded = check_and_award_badges(review.user)

        review.user.refresh_from_db(fields=['points'])
        review.points_awarded = max(review.user.points - initial_points, 0)
        review.badges_awarded = newly_awarded
        
        return review
    
    def _update_asset_rating(self, asset):
        from django.db.models import Avg
        
        stats = asset.reviews.aggregate(avg=Avg('rating'))
        asset.average_rating = stats['avg'] or 0
        asset.review_count = asset.reviews.count()
        asset.save(update_fields=['average_rating', 'review_count'])
