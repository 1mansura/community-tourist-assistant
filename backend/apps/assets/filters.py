"""
Query filters for the public asset list and the ``nearby`` custom action.

``lat``/``lng``/``radius`` implement a rough degree-distance annotate (111 km/deg);
query coordinates are cast to float for consistent numeric types in annotations.
"""
import django_filters
from .models import Asset


class AssetFilter(django_filters.FilterSet):
    """Filter set for querying approved assets (list + map/nearby)."""
    
    category = django_filters.CharFilter(field_name='category__slug')
    min_rating = django_filters.NumberFilter(
        field_name='average_rating',
        lookup_expr='gte'
    )
    featured = django_filters.BooleanFilter()
    
    lat = django_filters.NumberFilter(method='filter_by_location')
    lng = django_filters.NumberFilter(method='noop')
    radius = django_filters.NumberFilter(method='noop')
    
    class Meta:
        model = Asset
        fields = ['category', 'min_rating', 'featured']
    
    def noop(self, queryset, name, value):
        return queryset
    
    def filter_by_location(self, queryset, name, value):
        lat = self.data.get('lat')
        lng = self.data.get('lng')
        radius = self.data.get('radius', 10)
        
        if lat and lng:
            from django.db.models import F, FloatField
            from django.db.models.functions import Cast, Power, Sqrt

            lat = float(lat)
            lng = float(lng)
            radius = float(radius)

            queryset = queryset.annotate(
                distance=Sqrt(
                    Power(Cast(F('latitude'), FloatField()) - lat, 2)
                    + Power(Cast(F('longitude'), FloatField()) - lng, 2)
                )
                * 111
            ).filter(distance__lte=radius)
        
        return queryset
