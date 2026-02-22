import { api } from '@/lib/api';
import type { Asset, AssetCreateData, AssetWithStatus, Category, PaginatedResponse } from '@/types';

interface AssetFilters {
  category?: string;
  search?: string;
  minRating?: number;
  featured?: boolean;
  ordering?: string;
  page?: number;
  [key: string]: string | number | boolean | undefined;
}

export const assetsService = {
  async getCategories(): Promise<Category[]> {
    const data = await api.get<PaginatedResponse<Category> | Category[]>('/assets/categories/');
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<Category>).results ?? [];
  },
  
  async getAssets(filters: AssetFilters = {}): Promise<PaginatedResponse<Asset>> {
    return api.get<PaginatedResponse<Asset>>('/assets/', filters);
  },
  
  async getAsset(slug: string): Promise<Asset> {
    return api.get<Asset>(`/assets/${slug}/`);
  },

  async updateAsset(
    slug: string,
    data: Partial<AssetCreateData>
  ): Promise<Asset> {
    return api.patch<Asset>(`/assets/${slug}/`, data);
  },

  async getFeatured(): Promise<Asset[]> {
    const data = await api.get<Asset[] | PaginatedResponse<Asset>>('/assets/featured/');
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<Asset>).results ?? [];
  },
  
  async getNearby(lat: number, lng: number): Promise<Asset[]> {
    const data = await api.get<Asset[] | PaginatedResponse<Asset>>('/assets/nearby/', { lat, lng });
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<Asset>).results ?? [];
  },
  
  async createAsset(data: AssetCreateData): Promise<Asset> {
    return api.post<Asset>('/assets/', data);
  },

  /** Upload an image to an asset (submitter or moderator). */
  async uploadAssetImage(
    slug: string,
    file: File,
    options?: { caption?: string; isPrimary?: boolean }
  ): Promise<{ id: number; image: string; caption: string; isPrimary: boolean }> {
    const form = new FormData();
    form.append('image', file);
    form.append('caption', options?.caption ?? (file.name || 'Photo'));
    form.append('is_primary', String(options?.isPrimary ?? true));
    return api.post(`/assets/${slug}/images/`, form) as Promise<{ id: number; image: string; caption: string; isPrimary: boolean }>;
  },

  /** Current user's submitted places (pending, approved, rejected). */
  async getMySubmissions(): Promise<AssetWithStatus[]> {
    return api.get<AssetWithStatus[]>('/assets/my_submissions/');
  },
};
