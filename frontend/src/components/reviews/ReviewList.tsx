'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { reviewsService } from '@/services/reviews';
import { Button, Input } from '@/components/ui';
import type { Review } from '@/types';

interface ReviewListProps {
  reviews: Review[];
  onUpdate?: () => void;
}

function StarRating({
  rating,
  editable,
  onSelect,
}: {
  rating: number;
  editable?: boolean;
  onSelect?: (value: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={editable ? 'button' : 'button'}
          onClick={() => editable && onSelect?.(star)}
          className={editable ? 'p-0.5 focus:outline-none' : 'cursor-default'}
        >
          <svg
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
          >
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewList({ reviews, onUpdate }: ReviewListProps) {
  const { user } = useAuth();
  const [votingId, setVotingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleHelpful = async (reviewId: number) => {
    setVotingId(reviewId);
    try {
      await reviewsService.markHelpful(reviewId);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVotingId(null);
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditTitle(review.title);
    setEditContent(review.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    setSaving(true);
    try {
      await reviewsService.updateReview(editingId, {
        rating: editRating,
        title: editTitle,
        content: editContent,
      });
      onUpdate?.();
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update review:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(review.id);
    try {
      await reviewsService.deleteReview(review.id);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete review:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const isOwnReview = (review: Review) =>
    user != null && Number(review.user) === Number(user.id);

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reviews yet. Be the first to share your experience!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => {
        const ownReview = isOwnReview(review);
        const helpfulDisabled = votingId !== null || !user || ownReview || review.hasVotedHelpful;
        const helpfulLabel = !user
          ? 'Log in to mark helpful'
          : ownReview
            ? 'Cannot vote on your own review'
            : review.hasVotedHelpful
              ? 'Marked helpful'
              : `Helpful (${review.helpfulCount ?? 0})`;

        return (
        <div
          key={review.id}
          className={`bg-white rounded-lg border p-6 ${ownReview ? 'border-green-300 bg-green-50/40' : 'border-gray-100'}`}
        >
          {editingId === review.id ? (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Edit your review</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <StarRating rating={editRating} editable onSelect={setEditRating} />
              </div>
              <Input
                label="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Summarize your experience"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your review</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit} loading={saving} disabled={editRating === 0 || !editTitle.trim() || !editContent.trim()}>
                  Save
                </Button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-gray-900">{review.username}</span>
                    {ownReview && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Your review
                      </span>
                    )}
                    <StarRating rating={review.rating} />
                  </div>
                  <h4 className="font-semibold text-gray-900">{review.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                  {ownReview && (
                    <span className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(review)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Edit
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(review)}
                        disabled={deletingId !== null}
                        className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-4">{review.content}</p>

              {review.visitDate && (
                <p className="text-sm text-gray-500 mb-4">
                  Visited: {new Date(review.visitDate).toLocaleDateString()}
                </p>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleHelpful(review.id)}
                  disabled={helpfulDisabled}
                  title={helpfulLabel}
                  className={`flex items-center gap-2 text-sm ${
                    review.hasVotedHelpful ? 'text-green-700' : 'text-gray-500'
                  } hover:text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  {helpfulLabel}
                </button>
              </div>
            </>
          )}
        </div>
        );
      })}
    </div>
  );
}
