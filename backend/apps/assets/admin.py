from django.contrib import admin
from .models import Category, Asset, AssetImage


class AssetImageInline(admin.TabularInline):
    model = AssetImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'display_order']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['display_order']


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'average_rating', 'created_at']
    list_filter = ['status', 'category', 'featured']
    search_fields = ['title', 'description', 'address']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['average_rating', 'review_count', 'view_count']
    inlines = [AssetImageInline]
    date_hierarchy = 'created_at'
