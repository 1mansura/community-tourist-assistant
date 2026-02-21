"""
Badge definitions and awarding logic for gamification.
"""

BADGE_DEFINITIONS = {
    'first_submission': {
        'name': 'First Steps',
        'description': 'Submitted your first place',
        'icon': 'rocket',
        'points_value': 10,
    },
    'five_submissions': {
        'name': 'Contributor',
        'description': 'Submitted 5 places',
        'icon': 'star',
        'points_value': 25,
    },
    'ten_submissions': {
        'name': 'Local Expert',
        'description': 'Submitted 10 places',
        'icon': 'trophy',
        'points_value': 50,
    },
    'first_review': {
        'name': 'Reviewer',
        'description': 'Wrote your first review',
        'icon': 'pen',
        'points_value': 10,
    },
    'ten_reviews': {
        'name': 'Critic',
        'description': 'Wrote 10 reviews',
        'icon': 'book',
        'points_value': 30,
    },
    'helpful_reviewer': {
        'name': 'Helpful Hand',
        'description': 'Received 10 helpful votes',
        'icon': 'thumbs-up',
        'points_value': 20,
    },
    'photographer': {
        'name': 'Photographer',
        'description': 'Uploaded 10 photos',
        'icon': 'camera',
        'points_value': 25,
    },
    'early_adopter': {
        'name': 'Early Adopter',
        'description': 'Joined during launch period',
        'icon': 'clock',
        'points_value': 15,
    },
}


def check_and_award_badges(user):
    """
    Check user's stats and award any earned badges.
    Returns list of newly awarded badge keys.
    """
    from .models import UserBadge
    
    existing = set(user.badges.values_list('badge_key', flat=True))
    newly_awarded = []
    
    checks = [
        ('first_submission', user.contribution_count >= 1),
        ('five_submissions', user.contribution_count >= 5),
        ('ten_submissions', user.contribution_count >= 10),
        ('first_review', user.reviews.count() >= 1),
        ('ten_reviews', user.reviews.count() >= 10),
    ]
    
    for badge_key, condition in checks:
        if condition and badge_key not in existing:
            UserBadge.objects.create(user=user, badge_key=badge_key)
            badge = BADGE_DEFINITIONS.get(badge_key, {})
            user.add_points(badge.get('points_value', 0), f'Badge earned: {badge_key}')
            newly_awarded.append(badge_key)
    
    return newly_awarded
