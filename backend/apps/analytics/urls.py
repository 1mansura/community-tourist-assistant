from django.urls import path

from .views import PlatformStatsView, AdminAnalyticsView

urlpatterns = [
    path('stats/', PlatformStatsView.as_view(), name='platform-stats'),
    path('admin/', AdminAnalyticsView.as_view(), name='admin-analytics'),
]
