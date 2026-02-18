"""
DRF serializers for registration, profile read/update, badges, and leaderboard rows.

JWT login uses SimpleJWT's default pair serializer (``USERNAME_FIELD`` is ``email``).
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Create users with password confirmation and Django password validators."""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class BadgeSerializer(serializers.Serializer):
    """Shape of an earned badge for nested output on ``UserSerializer``."""
    badge_key = serializers.CharField()
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()
    earned_at = serializers.DateTimeField()
    
    def get_name(self, obj):
        from .badges import BADGE_DEFINITIONS
        return BADGE_DEFINITIONS.get(obj.badge_key, {}).get('name', obj.badge_key)
    
    def get_description(self, obj):
        from .badges import BADGE_DEFINITIONS
        return BADGE_DEFINITIONS.get(obj.badge_key, {}).get('description', '')
    
    def get_icon(self, obj):
        from .badges import BADGE_DEFINITIONS
        return BADGE_DEFINITIONS.get(obj.badge_key, {}).get('icon', 'badge')


class UserSerializer(serializers.ModelSerializer):
    """Authenticated user's profile including points, contribution count, and badges."""
    badges = BadgeSerializer(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'bio', 'avatar', 'location', 'points',
            'contribution_count', 'date_joined', 'badges'
        ]
        read_only_fields = ['id', 'email', 'role', 'points', 'contribution_count', 'date_joined', 'badges']


class LeaderboardUserSerializer(serializers.ModelSerializer):
    """Public serializer for leaderboard - excludes email."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'role', 'points',
            'contribution_count', 'date_joined'
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'bio', 'avatar', 'location']
