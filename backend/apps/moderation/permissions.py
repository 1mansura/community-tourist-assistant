from rest_framework import permissions


class IsModeratorOrAdmin(permissions.BasePermission):
    """
    Allow access only to moderators and admins.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['moderator', 'admin']


class IsAdmin(permissions.BasePermission):
    """
    Allow access only to admins.
    """
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'admin'
