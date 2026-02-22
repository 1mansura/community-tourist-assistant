'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { reviewsService } from '@/services/reviews';
import { Button, Input } from '@/components/ui';
import { extractErrorMessage } from '@/lib/api';

interface ReviewFormProps {
  assetId: number;
  onSuccess?: () => void;
}

export default function ReviewForm({ assetId, onSuccess }: ReviewFormProps) {
  const { isAuthenticated, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">Sign in to leave a review</p>
        <a href="/login" className="text-primary-600 hover:underline">
          Sign In
        </a>
      </div>
    );
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const created = await reviewsService.createReview({
        asset: assetId,
        rating,
        title,
        content,
        visitDate: visitDate || undefined,
      });
      await refreshUser();
      const points = Number(created.pointsAwarded ?? 0);
      const badges = Array.isArray(created.badgesAwarded) ? created.badgesAwarded : [];
      if (badges.length > 0) {
        showNotification(
          `Badge earned: ${badges.map((b) => b.replace(/_/g, ' ')).join(', ')}! 🎉`,
          'reward',
          7000,
          `+${points} points for your review`,
        );
      } else if (points > 0) {
        showNotification(
          `+${points} points earned! ⭐`,
          'reward',
          6000,
          'Thanks for your review — it helps others discover great places.',
        );
      } else {
        showNotification(
          'Review submitted! ✓',
          'success',
          5000,
          'Thanks for sharing your experience.',
        );
      }
      
      setRating(0);
      setTitle('');
      setContent('');
      setVisitDate('');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = extractErrorMessage(err);
      setError(msg);
      showNotification(msg, 'error', 6000);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
            >
              <svg
                className={`w-8 h-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Summarize your experience"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Review
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Share details about your visit..."
          />
        </div>
        
        <Input
          label="Visit Date (optional)"
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
        />
        
        <Button type="submit" loading={isLoading}>
          Submit Review
        </Button>
      </div>
    </form>
  );
}
