import { api } from '@/lib/api';
import type { Review, PaginatedResponse } from '@/types';

interface CreateReviewData {
  asset: number;
  rating: number;
  title: string;
  content: string;
  visitDate?: string;
}

export const reviewsService = {
  /** Fetch all reviews for an asset (handles pagination so list matches header count). */
  async getReviews(assetSlug: string): Promise<Review[]> {
    const all: Review[] = [];
    let page = 1;
    const params: Record<string, string | number> = { asset: assetSlug };

    while (true) {
      const data = await api.get<PaginatedResponse<Review> | Review[]>('/reviews/', {
        ...params,
        page,
      });
      const list = Array.isArray(data)
        ? data
        : ((data as PaginatedResponse<Review>).results ?? []);
      all.push(...list);

      const paginated = data as PaginatedResponse<Review>;
      const hasNext =
        !Array.isArray(data) &&
        paginated.next != null &&
        paginated.next !== '' &&
        list.length > 0;
      if (!hasNext) break;
      page += 1;
    }

    return all;
  },

  /** Current user's reviews (for profile). */
  async getMyReviews(): Promise<Review[]> {
    const data = await api.get<PaginatedResponse<Review> | Review[]>('/reviews/', { mine: 1 });
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<Review>).results ?? [];
  },
  
  async createReview(data: CreateReviewData): Promise<Review> {
    return api.post<Review>('/reviews/', data);
  },

  async updateReview(
    reviewId: number,
    data: { rating?: number; title?: string; content?: string; visitDate?: string | null }
  ): Promise<Review> {
    return api.patch<Review>(`/reviews/${reviewId}/`, data);
  },

  async markHelpful(reviewId: number): Promise<{ status: string }> {
    return api.post<{ status: string }>(`/reviews/${reviewId}/helpful/`);
  },
  
  async deleteReview(reviewId: number): Promise<void> {
    await api.delete(`/reviews/${reviewId}/`);
  },
};
