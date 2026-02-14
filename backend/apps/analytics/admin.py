from django.contrib import admin
from .models import DailyStats, CategoryStats


@admin.register(DailyStats)
class DailyStatsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'total_assets', 'new_assets', 'total_users',
        'new_users', 'total_reviews', 'total_views'
    ]
    date_hierarchy = 'date'
    readonly_fields = ['created_at']


@admin.register(CategoryStats)
class CategoryStatsAdmin(admin.ModelAdmin):
    list_display = [
        'category', 'date', 'asset_count', 'view_count',
        'review_count', 'average_rating'
    ]
    list_filter = ['category', 'date']
