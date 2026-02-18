"""
Analytics views for the Devon Community Tourist Assistant.

Provides two endpoints:
  - GET /api/analytics/stats/  — public platform aggregates (no auth).
  - GET /api/analytics/admin/  — moderation-focused metrics (staff only).
"""

from datetime import timedelta

from django.db.models import Avg, Count, Q, Sum
from django.utils import timezone
from rest_framework import permissions, views
from rest_framework.response import Response

from apps.assets.models import Asset, Category
from apps.moderation.models import ModerationAction
from apps.moderation.permissions import IsModeratorOrAdmin
from apps.reviews.models import Review
from apps.users.models import User


class PlatformStatsView(views.APIView):
    """Public platform statistics (no authentication required).

    GET /api/analytics/stats/

    Returns asset totals, active-user counts, review averages, and
    per-category breakdowns used by the landing page and explore views.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now = timezone.now()
        week_ago = now - timedelta(days=7)

        stats = {
            'assets': {
                'total': Asset.objects.filter(status='approved').count(),
                'new_this_week': Asset.objects.filter(
                    status='approved',
                    created_at__gte=week_ago,
                ).count(),
            },
            'users': {
                'total': User.objects.filter(is_active=True).count(),
                'contributors': User.objects.filter(
                    is_active=True,
                    contribution_count__gt=0,
                ).count(),
            },
            'reviews': {
                'total': Review.objects.count(),
                'average_rating': Review.objects.aggregate(
                    avg=Avg('rating'),
                )['avg'] or 0,
            },
            'categories': list(
                Category.objects.annotate(
                    count=Count('assets', filter=Q(assets__status='approved')),
                ).values('name', 'slug', 'count').order_by('-count')[:5],
            ),
        }

        return Response(stats)


class AdminAnalyticsView(views.APIView):
    """Staff-only moderation analytics for the admin dashboard.

    GET /api/analytics/admin/

    All response fields are intentionally flat and chart-friendly:
      pending_moderation, daily_submissions (last 30 days),
      top_contributors, category_breakdown, moderation_summary,
      assets_by_status.
    """

    permission_classes = [IsModeratorOrAdmin]

    def get(self, request):
        now = timezone.now()

        pending_count = Asset.objects.filter(status='pending').count()

        daily_submissions = []
        for i in range(30):
            date = now.date() - timedelta(days=i)
            count = Asset.objects.filter(created_at__date=date).count()
            daily_submissions.append({'date': date.isoformat(), 'count': count})

        top_contributors = User.objects.filter(
            contribution_count__gt=0,
        ).order_by('-contribution_count').values(
            'username', 'contribution_count', 'points',
        )[:10]

        category_breakdown = Category.objects.annotate(
            approved=Count('assets', filter=Q(assets__status='approved')),
            total_views=Sum('assets__view_count'),
            avg_rating=Avg('assets__average_rating'),
        ).values('name', 'approved', 'total_views', 'avg_rating')

        moderation_summary = {
            'approved': ModerationAction.objects.filter(action='approve').count(),
            'rejected': ModerationAction.objects.filter(action='reject').count(),
            'requested_changes': ModerationAction.objects.filter(action='request_changes').count(),
        }

        assets_by_status = {
            'pending': Asset.objects.filter(status='pending').count(),
            'approved': Asset.objects.filter(status='approved').count(),
            'rejected': Asset.objects.filter(status='rejected').count(),
        }

        return Response({
            'pending_moderation': pending_count,
            'daily_submissions': daily_submissions,
            'top_contributors': list(top_contributors),
            'category_breakdown': list(category_breakdown),
            'moderation_summary': moderation_summary,
            'assets_by_status': assets_by_status,
        })
