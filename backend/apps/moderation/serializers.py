from rest_framework import serializers
from apps.assets.serializers import AssetImageSerializer
from apps.users.models import User
from .models import ModerationAction, Report, AuditLog


class ModerationActionSerializer(serializers.ModelSerializer):
    moderator_username = serializers.CharField(source='moderator.username', read_only=True)
    asset_title = serializers.CharField(source='asset.title', read_only=True)
    asset_slug = serializers.CharField(source='asset.slug', read_only=True)
    
    class Meta:
        model = ModerationAction
        fields = [
            'id', 'asset', 'asset_title', 'asset_slug',
            'moderator', 'moderator_username', 'action', 'reason', 'created_at'
        ]
        read_only_fields = ['id', 'moderator', 'created_at']


class PendingAssetSerializer(serializers.Serializer):
    """Serializer for pending assets in moderation queue.

    Includes uploaded images so moderators can visually review
    submissions before making a decision.
    """

    id = serializers.IntegerField()
    title = serializers.CharField()
    slug = serializers.CharField()
    description = serializers.CharField()
    category_name = serializers.CharField(source='category.name')
    submitted_by_username = serializers.CharField(source='submitted_by.username', default=None)
    submitted_by_email = serializers.CharField(source='submitted_by.email', default=None)
    created_at = serializers.DateTimeField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    address = serializers.CharField(allow_blank=True, required=False)
    postcode = serializers.CharField(allow_blank=True, required=False)
    website = serializers.CharField(allow_blank=True, required=False)
    phone = serializers.CharField(allow_blank=True, required=False)
    opening_hours = serializers.JSONField(required=False)
    images = AssetImageSerializer(many=True, read_only=True)


class ModerationDecisionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject', 'request_changes'])
    reason = serializers.CharField(required=False, allow_blank=True)


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    asset_title = serializers.CharField(source='asset.title', read_only=True)
    asset_slug = serializers.CharField(source='asset.slug', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'asset', 'asset_slug', 'asset_title', 'reporter', 'reporter_username',
            'report_type', 'description', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'reporter', 'status', 'created_at']


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['asset', 'report_type', 'description']


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'username', 'action', 'target_type', 'target_id', 'details', 'created_at']


class ModerationUserSerializer(serializers.ModelSerializer):
    """User summary for moderation actions (suspend/ban/reactivate)."""

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'role',
            'is_active',
            'points',
            'contribution_count',
            'date_joined',
        ]


class UserModerationActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['suspend', 'ban', 'reactivate'])
    reason = serializers.CharField(required=False, allow_blank=True)
