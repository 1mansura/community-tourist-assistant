from django.contrib.auth.models import AbstractUser
from django.db import models


class UserBadge(models.Model):
    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='badges'
    )
    badge_key = models.CharField(max_length=50)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'badge_key']
        ordering = ['-earned_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.badge_key}"


class User(AbstractUser):
    """
    Custom user model supporting contributor/admin roles
    and gamification features.
    """
    
    class Role(models.TextChoices):
        USER = 'user', 'User'
        CONTRIBUTOR = 'contributor', 'Contributor'
        MODERATOR = 'moderator', 'Moderator'
        ADMIN = 'admin', 'Administrator'
    
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER
    )
    
    bio = models.TextField(blank=True, max_length=500)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    location = models.CharField(max_length=100, blank=True)
    
    points = models.PositiveIntegerField(default=0)
    contribution_count = models.PositiveIntegerField(default=0)
    
    email_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['points']),
        ]
    
    def __str__(self):
        return self.email
    
    @property
    def is_moderator(self):
        return self.role in [self.Role.MODERATOR, self.Role.ADMIN]
    
    @property
    def is_contributor(self):
        return self.role in [
            self.Role.CONTRIBUTOR,
            self.Role.MODERATOR,
            self.Role.ADMIN
        ]
    
    def add_points(self, amount: int, reason: str = ''):
        self.points += amount
        self.save(update_fields=['points'])
