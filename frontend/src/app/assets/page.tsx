import { Suspense } from 'react';
import AssetFilters from '@/components/assets/AssetFilters';
import AssetCard from '@/components/assets/AssetCard';
import type { Asset, Category, PaginatedResponse } from '@/types';

import { getApiUrl } from '@/lib/apiUrl';

const API_URL = getApiUrl();

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/assets/categories/`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = Array.isArray(data) ? data : data.results ?? [];
    return raw.map((c: Record<string, unknown>) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      assetCount: c.asset_count,
    })) as Category[];
  } catch {
    return [];
  }
}

async function getAssets(searchParams: Record<string, string>): Promise<PaginatedResponse<Asset>> {
  const empty = { count: 0, next: null, previous: null, results: [] };
  try {
    const params = new URLSearchParams(searchParams);
    const res = await fetch(`${API_URL}/assets/?${params}`, {
      cache: 'no-store',
    });
    if (!res.ok) return empty;
    const data = await res.json();
    const results = (data.results ?? []).map((a: Record<string, unknown>) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    description: a.description,
    category: a.category,
    categoryName: a.category_name,
    latitude: Number(a.latitude),
    longitude: Number(a.longitude),
    address: a.address,
    postcode: a.postcode,
    averageRating: Number(a.average_rating),
    reviewCount: a.review_count,
    viewCount: a.view_count,
    featured: a.featured,
    primaryImage: a.primary_image,
    images: a.images,
  })) as Asset[];
    return { count: data.count, next: data.next, previous: data.previous, results };
  } catch {
    return empty;
  }
}

interface PageProps {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}

export default async function AssetsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const sp = Object.fromEntries(
    Object.entries(resolvedSearchParams).flatMap(([key, value]) => {
      if (typeof value === 'string') return [[key, value]];
      if (Array.isArray(value)) return [[key, value[0] ?? '']];
      return [];
    }),
  ) as Record<string, string>;
  const [categories, assetsData] = await Promise.all([
    getCategories(),
    getAssets(sp),
  ]);
  
  const currentPage = parseInt(sp.page || '1');
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(sp);
    params.set('page', String(page));
    return `/assets?${params.toString()}`;
  };
  
  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Explore Devon
          </h1>
          <p className="text-slate-600">
            Discover {assetsData.count} places contributed by the community
          </p>
        </div>
        
        <Suspense fallback={<div>Loading filters...</div>}>
          <AssetFilters categories={categories} />
        </Suspense>
        
        {assetsData.results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No places found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {assetsData.results.map((asset, index) => (
              <AssetCard key={asset.id} asset={asset} index={index} />
            ))}
          </div>
        )}
        
        {(assetsData.next || assetsData.previous) && (
          <div className="flex justify-center gap-4 mt-8">
            {assetsData.previous && (
              <a
                href={buildPageUrl(currentPage - 1)}
                className="px-5 py-2.5 border border-slate-300 rounded-xl hover:bg-slate-50 font-medium transition-colors"
              >
                Previous
              </a>
            )}
            {assetsData.next && (
              <a
                href={buildPageUrl(currentPage + 1)}
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 hover:shadow-glow font-medium transition-all"
              >
                Next
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
