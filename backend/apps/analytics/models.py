from django.db import models


class DailyStats(models.Model):
    """
    Aggregated daily statistics for the platform.
    """
    
    date = models.DateField(unique=True)
    
    total_assets = models.PositiveIntegerField(default=0)
    new_assets = models.PositiveIntegerField(default=0)
    pending_assets = models.PositiveIntegerField(default=0)
    
    total_users = models.PositiveIntegerField(default=0)
    new_users = models.PositiveIntegerField(default=0)
    active_users = models.PositiveIntegerField(default=0)
    
    total_reviews = models.PositiveIntegerField(default=0)
    new_reviews = models.PositiveIntegerField(default=0)
    
    total_views = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "daily stats"
        ordering = ['-date']
    
    def __str__(self):
        return f"Stats for {self.date}"


class CategoryStats(models.Model):
    """
    Per-category statistics.
    """
    
    category = models.ForeignKey(
        'assets.Category',
        on_delete=models.CASCADE,
        related_name='stats'
    )
    date = models.DateField()
    
    asset_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)
    review_count = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0
    )
    
    class Meta:
        unique_together = ['category', 'date']
        ordering = ['-date']
