from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ModerationQueueView,
    ModerationHistoryView,
    ModerationDecisionView,
    ModerationUsersView,
    ModerationUserStatusView,
    ReportViewSet,
    AuditLogView
)

router = DefaultRouter()
router.register('reports', ReportViewSet, basename='report')

urlpatterns = [
    path('queue/', ModerationQueueView.as_view(), name='moderation-queue'),
    path('history/', ModerationHistoryView.as_view(), name='moderation-history'),
    path('users/', ModerationUsersView.as_view(), name='moderation-users'),
    path('users/<int:pk>/status/', ModerationUserStatusView.as_view(), name='moderation-user-status'),
    path('assets/<int:pk>/decide/', ModerationDecisionView.as_view(), name='moderation-decide'),
    path('audit/', AuditLogView.as_view(), name='audit-log'),
    path('', include(router.urls)),
]
