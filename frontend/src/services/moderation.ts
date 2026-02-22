import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

export interface PendingAssetImage {
  id: number;
  image: string;
  caption: string;
  isPrimary: boolean;
  uploadedAt: string;
}

export interface PendingAsset {
  id: number;
  title: string;
  slug: string;
  description: string;
  categoryName: string;
  submittedByUsername: string | null;
  submittedByEmail: string | null;
  createdAt: string;
  latitude: number;
  longitude: number;
  address?: string;
  postcode?: string;
  website?: string;
  phone?: string;
  openingHours?: Record<string, string>;
  images?: PendingAssetImage[];
}

export interface ModerationHistoryItem {
  id: number;
  asset: number;
  assetTitle: string;
  assetSlug: string;
  moderator: number | null;
  moderatorUsername: string | null;
  action: 'approve' | 'reject' | 'request_changes';
  reason: string;
  createdAt: string;
}

export interface AdminAnalytics {
  pendingModeration: number;
  moderationSummary: {
    approved: number;
    rejected: number;
    requestedChanges: number;
  };
  assetsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  dailySubmissions?: Array<{ date: string; count: number }>;
  topContributors?: Array<{ username: string; contributionCount: number; points: number }>;
  categoryBreakdown?: Array<{ name: string; approved: number; totalViews: number | null; avgRating: number | null }>;
}

export interface Report {
  id: number;
  asset: number;
  assetSlug: string;
  assetTitle: string;
  reporter: number;
  reporterUsername: string;
  reportType: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface ModerationUser {
  id: number;
  email: string;
  username: string;
  role: 'user' | 'contributor' | 'moderator' | 'admin';
  isActive: boolean;
  points: number;
  contributionCount: number;
  dateJoined: string;
}

export const moderationService = {
  async getQueue(): Promise<PendingAsset[]> {
    const data = await api.get<PaginatedResponse<PendingAsset> | PendingAsset[]>('/moderation/queue/');
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<PendingAsset>).results ?? [];
  },
  
  async decide(assetId: number, action: string, reason?: string): Promise<void> {
    await api.post(`/moderation/assets/${assetId}/decide/`, { action, reason });
  },

  async getHistory(): Promise<ModerationHistoryItem[]> {
    const data = await api.get<PaginatedResponse<ModerationHistoryItem> | ModerationHistoryItem[]>(
      '/moderation/history/'
    );
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<ModerationHistoryItem>).results ?? [];
  },

  async getAdminAnalytics(): Promise<AdminAnalytics> {
    return api.get<AdminAnalytics>('/analytics/admin/');
  },

  async getUsers(query?: string): Promise<ModerationUser[]> {
    const data = await api.get<PaginatedResponse<ModerationUser> | ModerationUser[]>(
      '/moderation/users/',
      query ? { q: query } : undefined
    );
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<ModerationUser>).results ?? [];
  },

  async setUserStatus(
    userId: number,
    action: 'suspend' | 'ban' | 'reactivate',
    reason?: string
  ): Promise<{ status: string; action: string; targetUser: string; isActive: boolean }> {
    return api.post(`/moderation/users/${userId}/status/`, { action, reason });
  },
  
  async getReports(): Promise<Report[]> {
    const data = await api.get<PaginatedResponse<Report> | Report[]>('/moderation/reports/');
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<Report>).results ?? [];
  },
  
  async resolveReport(reportId: number, resolution: string, notes?: string): Promise<void> {
    await api.post(`/moderation/reports/${reportId}/resolve/`, { resolution, notes });
  },
};
