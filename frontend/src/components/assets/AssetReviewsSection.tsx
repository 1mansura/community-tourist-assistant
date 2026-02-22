'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { reviewsService } from '@/services/reviews';
import ReviewList from '@/components/reviews/ReviewList';
import ReviewForm from '@/components/reviews/ReviewForm';
import type { Review } from '@/types';

interface AssetReviewsSectionProps {
  assetId: number;
  assetSlug: string;
  /** From asset API so we can show a retry when list is empty but listing says there are reviews. */
  assetReviewCount?: number;
  submittedByUsername: string | null;
}

export default function AssetReviewsSection({
  assetId,
  assetSlug,
  assetReviewCount = 0,
  submittedByUsername,
}: AssetReviewsSectionProps) {
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const data = await reviewsService.getReviews(assetSlug);
      setReviews(data);
    } catch (err) {
      setReviews([]);
      setFetchError('Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, [assetSlug]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const hasReviewed = isAuthenticated && user && reviews.some((r) => r.user === user.id);
  const isSubmitter = isAuthenticated && user && submittedByUsername === user.username;
  const focusReview = searchParams.get('focus') === 'review';

  useEffect(() => {
    if (!focusReview || loading) return;
    const section = document.getElementById('reviews');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusReview, loading]);

  return (
    <div id="reviews" className="mt-10 pt-8 border-t border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews & ratings</h2>

      {loading ? (
        <p className="text-gray-500">Loading reviews...</p>
      ) : (
        <>
          {fetchError && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
              <p className="text-sm font-medium">{fetchError}</p>
              {assetReviewCount > 0 && (
                <p className="text-sm mt-1 text-amber-700">
                  This place has {assetReviewCount} review{assetReviewCount !== 1 ? 's' : ''} on the listing.
                </p>
              )}
              <button
                type="button"
                onClick={fetchReviews}
                className="mt-3 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium rounded-lg text-sm transition-colors"
              >
                Try again
              </button>
            </div>
          )}
          <ReviewList reviews={reviews} onUpdate={fetchReviews} />

          {isAuthenticated ? (
            hasReviewed ? (
              <p className="mt-6 text-gray-600 text-sm">
                You&apos;ve already reviewed this place. Edit or delete your review above.
              </p>
            ) : (
              <div className="mt-8">
                <ReviewForm assetId={assetId} onSuccess={fetchReviews} />
              </div>
            )
          ) : (
            <div className="mt-8 bg-primary-50 border border-primary-100 rounded-xl p-6 text-center">
              <p className="text-gray-800 font-medium mb-2">Rate and review this place</p>
              <p className="text-gray-600 text-sm mb-4">
                Create an account or log in to add your rating and review. Your contribution helps others discover the best of Devon.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/assets/${assetSlug}?focus=review#reviews`)}`}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href={`/register?redirect=${encodeURIComponent(`/assets/${assetSlug}?focus=review#reviews`)}`}
                  className="inline-flex items-center justify-center px-5 py-2.5 bg-white border-2 border-primary-600 text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </>
      )}

      {isSubmitter && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <Link
            href={`/assets/${assetSlug}/edit`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <span>Edit this place</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
