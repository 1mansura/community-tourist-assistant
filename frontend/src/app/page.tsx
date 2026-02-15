import HomeContent from '@/components/home/HomeContent';
import { getApiUrl } from '@/lib/apiUrl';
import type { Asset } from '@/types';

const API_URL = getApiUrl();

interface FeaturedAsset {
  id: number;
  title: string;
  slug: string;
  category_name: string;
  average_rating: string;
  review_count: number;
  primary_image: { image: string; caption: string } | null;
  featured: boolean;
}

function mapApiAssetToAsset(a: Record<string, unknown>): Asset {
  return {
    id: a.id as number,
    title: a.title as string,
    slug: a.slug as string,
    description: (a.description as string) || '',
    category: a.category as Asset['category'],
    categoryName: a.category_name as string,
    categorySlug: a.category_slug as string | undefined,
    latitude: Number(a.latitude) || 0,
    longitude: Number(a.longitude) || 0,
    address: (a.address as string) || '',
    postcode: (a.postcode as string) || '',
    website: (a.website as string) || '',
    phone: (a.phone as string) || '',
    openingHours: (a.opening_hours as Record<string, string>) || {},
    averageRating: Number(a.average_rating) || 0,
    reviewCount: (a.review_count as number) || 0,
    viewCount: (a.view_count as number) || 0,
    featured: (a.featured as boolean) || false,
    images: (a.images as Asset['images']) || [],
    primaryImage: a.primary_image as Asset['primaryImage'],
    createdAt: (a.created_at as string) || '',
    updatedAt: (a.updated_at as string) || '',
  };
}

async function getMapAssets(): Promise<Asset[]> {
  try {
    const res = await fetch(`${API_URL}/assets/?page_size=30`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results ?? [];
    return results
      .filter((a: Record<string, unknown>) => a.latitude != null && a.longitude != null)
      .map(mapApiAssetToAsset);
  } catch {
    return [];
  }
}

interface RawCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  asset_count: number;
}

async function getFeatured(): Promise<FeaturedAsset[]> {
  try {
    const res = await fetch(`${API_URL}/assets/featured/`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<RawCategory[]> {
  try {
    const res = await fetch(`${API_URL}/assets/categories/`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.results ?? [];
  } catch {
    return [];
  }
}

async function getStats(): Promise<{
  assets: { total: number };
  users: { contributors: number };
}> {
  try {
    const res = await fetch(`${API_URL}/analytics/stats/`, {
      next: { revalidate: 60 },
    });
    if (!res.ok)
      return { assets: { total: 0 }, users: { contributors: 0 } };
    return res.json();
  } catch {
    return { assets: { total: 0 }, users: { contributors: 0 } };
  }
}

export default async function Home() {
  const [featured, categories, stats, mapAssets] = await Promise.all([
    getFeatured(),
    getCategories(),
    getStats(),
    getMapAssets(),
  ]);

  return (
    <HomeContent
      featured={featured}
      categories={categories}
      stats={stats}
      mapAssets={mapAssets}
    />
  );
}
