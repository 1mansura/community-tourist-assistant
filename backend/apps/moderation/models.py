from django.db import models
from django.conf import settings


class ModerationAction(models.Model):
    """
    Tracks moderation decisions made on assets.
    """
    
    class ActionType(models.TextChoices):
        APPROVE = 'approve', 'Approved'
        REJECT = 'reject', 'Rejected'
        REQUEST_CHANGES = 'request_changes', 'Requested Changes'
    
    asset = models.ForeignKey(
        'assets.Asset',
        on_delete=models.CASCADE,
        related_name='moderation_actions'
    )
    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='moderation_actions'
    )
    action = models.CharField(
        max_length=20,
        choices=ActionType.choices
    )
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} - {self.asset.title}"


class Report(models.Model):
    """
    User reports on inappropriate or inaccurate content.
    """
    
    class ReportType(models.TextChoices):
        INACCURATE = 'inaccurate', 'Inaccurate Information'
        INAPPROPRIATE = 'inappropriate', 'Inappropriate Content'
        SPAM = 'spam', 'Spam'
        CLOSED = 'closed', 'Permanently Closed'
        OTHER = 'other', 'Other'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        RESOLVED = 'resolved', 'Resolved'
        DISMISSED = 'dismissed', 'Dismissed'
    
    asset = models.ForeignKey(
        'assets.Asset',
        on_delete=models.CASCADE,
        related_name='reports'
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_reports'
    )
    report_type = models.CharField(
        max_length=20,
        choices=ReportType.choices
    )
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_reports'
    )
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Report on {self.asset.title} - {self.report_type}"


class AuditLog(models.Model):
    """
    Audit trail for all moderation activities.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50)
    target_id = models.PositiveIntegerField()
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['target_type', 'target_id']),
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.action} by {self.user}"
