from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q

from apps.assets.models import Asset
from apps.users.models import User
from .models import ModerationAction, Report, AuditLog
from .serializers import (
    ModerationActionSerializer,
    PendingAssetSerializer,
    ModerationDecisionSerializer,
    ModerationUserSerializer,
    UserModerationActionSerializer,
    ReportSerializer,
    ReportCreateSerializer,
    AuditLogSerializer
)
from .permissions import IsModeratorOrAdmin, IsAdmin


def log_audit(user, action, target_type, target_id, details=None, request=None):
    ip = None
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')
    
    AuditLog.objects.create(
        user=user,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or {},
        ip_address=ip
    )


class ModerationQueueView(generics.ListAPIView):
    """GET /api/moderation/queue/"""
    serializer_class = PendingAssetSerializer
    permission_classes = [IsModeratorOrAdmin]
    
    def get_queryset(self):
        return Asset.objects.filter(
            status=Asset.Status.PENDING
        ).select_related('category', 'submitted_by').prefetch_related('images').order_by('created_at')


class ModerationDecisionView(generics.GenericAPIView):
    """POST /api/moderation/assets/{id}/decide/"""
    serializer_class = ModerationDecisionSerializer
    permission_classes = [IsModeratorOrAdmin]
    
    def post(self, request, pk):
        try:
            asset = Asset.objects.get(pk=pk)
        except Asset.DoesNotExist:
            return Response(
                {'error': 'Asset not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action_type = serializer.validated_data['action']
        reason = serializer.validated_data.get('reason', '')
        
        if action_type == 'approve':
            asset.status = Asset.Status.APPROVED
            asset.save()
            if asset.submitted_by:
                submitter = asset.submitted_by
                submitter.add_points(50, 'Asset approved')
                submitter.contribution_count = Asset.objects.filter(
                    submitted_by=submitter,
                    status=Asset.Status.APPROVED,
                ).count()
                submitter.save(update_fields=['contribution_count'])
                from apps.users.badges import check_and_award_badges
                check_and_award_badges(submitter)
        elif action_type == 'reject':
            asset.status = Asset.Status.REJECTED
        elif action_type == 'request_changes':
            asset.status = Asset.Status.PENDING
        
        if action_type != 'approve':
            asset.save()
        
        ModerationAction.objects.create(
            asset=asset,
            moderator=request.user,
            action=action_type,
            reason=reason
        )
        
        log_audit(
            user=request.user,
            action=f'moderation_{action_type}',
            target_type='asset',
            target_id=asset.id,
            details={'reason': reason},
            request=request
        )
        
        return Response({'status': 'success', 'new_status': asset.status})


class ModerationHistoryView(generics.ListAPIView):
    """GET /api/moderation/history/"""
    serializer_class = ModerationActionSerializer
    permission_classes = [IsModeratorOrAdmin]

    def get_queryset(self):
        return ModerationAction.objects.select_related('asset', 'moderator').all()


class ReportViewSet(viewsets.ModelViewSet):
    """
    GET,POST /api/moderation/reports/
    GET,PUT,PATCH,DELETE /api/moderation/reports/{id}/
    POST /api/moderation/reports/{id}/resolve/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_moderator:
            return Report.objects.all().select_related('asset', 'reporter')
        return Report.objects.filter(reporter=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReportCreateSerializer
        return ReportSerializer
    
    def perform_create(self, serializer):
        report = serializer.save(reporter=self.request.user)
        log_audit(
            user=self.request.user,
            action='report_created',
            target_type='asset',
            target_id=report.asset.id,
            details={'report_type': report.report_type},
            request=self.request
        )
    
    @action(detail=True, methods=['post'], permission_classes=[IsModeratorOrAdmin])
    def resolve(self, request, pk=None):
        """Resolve a report."""
        report = self.get_object()
        resolution = request.data.get('resolution', 'resolved')
        notes = request.data.get('notes', '')
        
        valid_statuses = dict(Report.Status.choices)
        if resolution not in valid_statuses:
            return Response(
                {'error': f'Invalid resolution. Must be one of: {", ".join(valid_statuses.keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        report.status = resolution
        report.resolved_by = request.user
        report.resolution_notes = notes
        report.resolved_at = timezone.now()
        report.save()
        
        log_audit(
            user=request.user,
            action='report_resolved',
            target_type='report',
            target_id=report.id,
            details={'resolution': resolution, 'notes': notes},
            request=request
        )
        
        return Response({'status': 'success'})


class AuditLogView(generics.ListAPIView):
    """GET /api/moderation/audit/"""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]
    queryset = AuditLog.objects.all().select_related('user')


class ModerationUsersView(generics.ListAPIView):
    """GET /api/moderation/users/"""
    serializer_class = ModerationUserSerializer
    permission_classes = [IsModeratorOrAdmin]

    def get_queryset(self):
        query = (self.request.query_params.get('q') or '').strip()
        qs = User.objects.exclude(id=self.request.user.id).order_by('-date_joined')
        if self.request.user.role == User.Role.MODERATOR:
            # Moderators can only action regular users/contributors.
            qs = qs.filter(role__in=[User.Role.USER, User.Role.CONTRIBUTOR])
        if query:
            qs = qs.filter(
                Q(username__icontains=query)
                | Q(email__icontains=query)
                | Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
            )
        return qs


class ModerationUserStatusView(generics.GenericAPIView):
    """POST /api/moderation/users/{id}/status/"""
    serializer_class = UserModerationActionSerializer
    permission_classes = [IsModeratorOrAdmin]

    def post(self, request, pk):
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if target.id == request.user.id:
            return Response({'error': 'You cannot moderate your own account.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.user.role == User.Role.MODERATOR and target.role in [User.Role.MODERATOR, User.Role.ADMIN]:
            return Response(
                {'error': 'Moderators can only manage user/contributor accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        data = self.get_serializer(data=request.data)
        data.is_valid(raise_exception=True)
        action_type = data.validated_data['action']
        reason = data.validated_data.get('reason', '')

        if action_type in ['suspend', 'ban']:
            target.is_active = False
        elif action_type == 'reactivate':
            target.is_active = True
        target.save(update_fields=['is_active'])

        log_audit(
            user=request.user,
            action=f'user_{action_type}',
            target_type='user',
            target_id=target.id,
            details={'reason': reason, 'target_email': target.email, 'target_role': target.role},
            request=request,
        )

        return Response(
            {
                'status': 'success',
                'action': action_type,
                'target_user': target.email,
                'is_active': target.is_active,
            }
        )
