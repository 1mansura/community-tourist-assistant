from rest_framework import generics, permissions, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenObtainSerializer,
)
from django.contrib.auth import get_user_model

from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    LeaderboardUserSerializer,
)

User = get_user_model()


LOGIN_FAILURE_DETAIL = 'Invalid email or password.'


class CTAUserTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom login serializer that returns specific messages for suspended/banned users.

    For wrong email, wrong password, or unknown account, return one generic string so
    attackers cannot tell whether an email is registered (except via timing).

    Specific copy is only returned when the account exists, is inactive, and the
    password is correct (suspended vs banned).
    """

    default_error_messages = {
        **TokenObtainSerializer.default_error_messages,
        'no_active_account': LOGIN_FAILURE_DETAIL,
    }

    def validate(self, attrs):
        email = attrs.get(self.username_field)
        password = attrs.get('password')

        if email and password:
            user = User.objects.filter(email__iexact=email).first()
            if user and not user.is_active and user.check_password(password):
                account_state = 'suspended'
                try:
                    from apps.moderation.models import AuditLog

                    latest_action = (
                        AuditLog.objects.filter(
                            target_type='user',
                            target_id=user.id,
                            action__in=['user_suspend', 'user_ban', 'user_reactivate'],
                        )
                        .order_by('-created_at')
                        .first()
                    )
                    if latest_action and latest_action.action == 'user_ban':
                        account_state = 'banned'
                except Exception:
                    account_state = 'suspended'

                if account_state == 'banned':
                    raise AuthenticationFailed('Your account is banned. Please contact an administrator.')
                raise AuthenticationFailed('Your account is suspended. Please contact a moderator or administrator.')

        return super().validate(attrs)


class UserLoginView(TokenObtainPairView):
    serializer_class = CTAUserTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/users/register/"""
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/users/profile/
    PATCH /api/users/profile/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer
    
    def get_object(self):
        return self.request.user


class LeaderboardView(generics.ListAPIView):
    """GET /api/users/leaderboard/"""
    serializer_class = LeaderboardUserSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return User.objects.filter(
            is_active=True,
            points__gt=0,
            role__in=[User.Role.USER, User.Role.CONTRIBUTOR],
        ).order_by('-points')[:20]
