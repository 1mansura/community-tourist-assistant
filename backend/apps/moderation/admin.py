from django.contrib import admin
from .models import ModerationAction, Report, AuditLog


@admin.register(ModerationAction)
class ModerationActionAdmin(admin.ModelAdmin):
    list_display = ['asset', 'action', 'moderator', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['asset__title', 'reason']
    readonly_fields = ['created_at']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['asset', 'report_type', 'status', 'reporter', 'created_at']
    list_filter = ['report_type', 'status', 'created_at']
    search_fields = ['asset__title', 'description']
    readonly_fields = ['created_at', 'resolved_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'target_type', 'target_id', 'created_at']
    list_filter = ['action', 'target_type', 'created_at']
    search_fields = ['action', 'user__email']
    readonly_fields = ['created_at']
