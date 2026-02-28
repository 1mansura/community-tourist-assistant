/** Compile-time shape checks for TS types that mirror the Django API (camelCase). */
import type { User, Asset, Review, Category, PaginatedResponse, AuthTokens } from './index';

describe('Type definitions', () => {
  it('User type has required fields', () => {
    const user: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      bio: '',
      avatar: null,
      location: 'Cornwall',
      points: 100,
      contributionCount: 5,
      dateJoined: '2026-01-01T00:00:00Z',
    };
    expect(user.id).toBe(1);
    expect(user.role).toBe('user');
    expect(user.badges).toBeUndefined();
  });

  it('User type supports badges', () => {
    const user: User = {
      id: 1,
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'contributor',
      bio: '',
      avatar: null,
      location: '',
      points: 0,
      contributionCount: 0,
      dateJoined: '2026-01-01T00:00:00Z',
      badges: [
        { badgeKey: 'first_sub', name: 'First Submission', description: 'Submit an asset', icon: 'rocket', earnedAt: '2026-01-10T00:00:00Z' },
      ],
    };
    expect(user.badges).toHaveLength(1);
    expect(user.badges![0].badgeKey).toBe('first_sub');
  });

  it('Review type has correct field names matching backend', () => {
    const review: Review = {
      id: 1,
      asset: 10,
      user: 2,
      username: 'reviewer',
      userAvatar: null,
      rating: 4,
      title: 'Great',
      content: 'Loved it',
      visitDate: null,
      helpfulCount: 5,
      hasVotedHelpful: false,
      createdAt: '2026-01-15T00:00:00Z',
    };
    expect(review.asset).toBe(10);
    expect(review.user).toBe(2);
    expect(review.helpfulCount).toBe(5);
    expect(review.hasVotedHelpful).toBe(false);
  });

  it('PaginatedResponse wraps results', () => {
    const response: PaginatedResponse<Category> = {
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 1, name: 'Beaches', slug: 'beaches', description: '', icon: '', assetCount: 5 },
        { id: 2, name: 'Heritage', slug: 'heritage', description: '', icon: '', assetCount: 3 },
      ],
    };
    expect(response.results).toHaveLength(2);
    expect(response.count).toBe(2);
  });

  it('AuthTokens has access and refresh', () => {
    const tokens: AuthTokens = {
      access: 'eyJhbGciOiJIUzI1NiJ9...',
      refresh: 'eyJhbGciOiJIUzI1NiJ9...',
    };
    expect(tokens.access).toBeTruthy();
    expect(tokens.refresh).toBeTruthy();
  });

  it('Asset supports optional fields', () => {
    const asset: Partial<Asset> = {
      id: 1,
      title: 'Test Place',
      slug: 'test-place',
      featured: false,
    };
    expect(asset.primaryImage).toBeUndefined();
    expect(asset.categoryName).toBeUndefined();
    expect(asset.submittedByUsername).toBeUndefined();
  });
});
