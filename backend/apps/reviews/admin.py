from django.contrib import admin
from .models import Review, ReviewHelpful


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['asset', 'user', 'rating', 'title', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['asset__title', 'user__username', 'title', 'content']
    readonly_fields = ['helpful_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(ReviewHelpful)
class ReviewHelpfulAdmin(admin.ModelAdmin):
    list_display = ['review', 'user', 'created_at']
