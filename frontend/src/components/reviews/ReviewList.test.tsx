/**
 * ReviewList presentation: empty state, row content, own-review helpful disable.
 * Framer Motion and AuthContext are mocked to keep the suite fast.
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ReviewList from './ReviewList';
import type { Review } from '@/types';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 1, username: 'testuser' } }),
}));

jest.mock('@/services/reviews', () => ({
  reviewsService: {
    markHelpful: jest.fn(),
  },
}));

const mockReviews: Review[] = [
  {
    id: 1,
    asset: 1,
    user: 2,
    username: 'alice',
    userAvatar: null,
    rating: 5,
    title: 'Amazing place',
    content: 'Absolutely stunning views from the castle.',
    visitDate: '2026-01-15',
    helpfulCount: 3,
    hasVotedHelpful: false,
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 2,
    asset: 1,
    user: 3,
    username: 'bob',
    userAvatar: null,
    rating: 3,
    title: 'Decent visit',
    content: 'Nice but crowded during summer.',
    visitDate: null,
    helpfulCount: 0,
    hasVotedHelpful: false,
    createdAt: '2026-01-22T14:00:00Z',
  },
];

describe('ReviewList', () => {
  it('shows empty state when no reviews', () => {
    render(<ReviewList reviews={[]} />);
    expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
  });

  it('renders all reviews', () => {
    render(<ReviewList reviews={mockReviews} />);
    expect(screen.getByText('Amazing place')).toBeInTheDocument();
    expect(screen.getByText('Decent visit')).toBeInTheDocument();
  });

  it('shows review content', () => {
    render(<ReviewList reviews={mockReviews} />);
    expect(screen.getByText('Absolutely stunning views from the castle.')).toBeInTheDocument();
    expect(screen.getByText('Nice but crowded during summer.')).toBeInTheDocument();
  });

  it('displays usernames', () => {
    render(<ReviewList reviews={mockReviews} />);
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('shows helpful count', () => {
    render(<ReviewList reviews={mockReviews} />);
    expect(screen.getByText('Helpful (3)')).toBeInTheDocument();
    expect(screen.getByText('Helpful (0)')).toBeInTheDocument();
  });

  it('shows visit date when provided', () => {
    render(<ReviewList reviews={mockReviews} />);
    const visitTexts = screen.getAllByText(/visited/i);
    expect(visitTexts.length).toBe(1);
  });

  it('disables helpful button for own reviews', () => {
    const ownReview: Review[] = [{
      ...mockReviews[0],
      user: 1,
    }];
    render(<ReviewList reviews={ownReview} />);
    const helpfulBtn = screen.getByText(/cannot vote on your own review/i).closest('button');
    expect(helpfulBtn).toBeDisabled();
  });
});
