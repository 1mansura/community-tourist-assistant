import { getSubmissionStatusNotifications, recordSubmissionStatusSnapshot } from './submissionNotifications';
import type { AssetWithStatus } from '@/types';

const baseSubmission = (overrides: Partial<AssetWithStatus>): AssetWithStatus => ({
  id: 1,
  title: 'Test Place',
  slug: 'test-place',
  description: '',
  category: { id: 1, name: 'Parks', slug: 'parks', description: '', icon: '', assetCount: 0 },
  latitude: 50,
  longitude: -3,
  address: '',
  postcode: '',
  website: '',
  phone: '',
  openingHours: {},
  averageRating: 0,
  reviewCount: 0,
  viewCount: 0,
  featured: false,
  images: [],
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('submissionNotifications', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does not notify on first baseline snapshot', () => {
    const notifications = getSubmissionStatusNotifications(5, [baseSubmission({ status: 'pending' })]);
    expect(notifications).toHaveLength(0);
  });

  it('notifies when submission transitions to approved', () => {
    recordSubmissionStatusSnapshot(5, [baseSubmission({ status: 'pending' })]);
    const notifications = getSubmissionStatusNotifications(5, [baseSubmission({ status: 'approved' })]);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].variant).toBe('reward');
    expect(notifications[0].message.toLowerCase()).toContain('approved');
  });

  it('notifies when submission transitions to rejected', () => {
    recordSubmissionStatusSnapshot(5, [baseSubmission({ status: 'pending' })]);
    const notifications = getSubmissionStatusNotifications(5, [baseSubmission({ status: 'rejected' })]);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].variant).toBe('error');
  });
});
