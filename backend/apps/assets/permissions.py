from rest_framework import permissions


class IsSubmitterOrReadOnly(permissions.BasePermission):
    """Only allow the submitter of an asset to update or delete it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if obj.submitted_by is None:
            return False
        return obj.submitted_by == request.user
