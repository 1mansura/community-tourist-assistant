import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AssetReviewsSection from '@/components/assets/AssetReviewsSection';
import ReportButton from '@/components/assets/ReportButton';
import SuggestUpdateButton from '@/components/assets/SuggestUpdateButton';
import { mediaUrl } from '@/lib/mediaUrl';

import { getApiUrl } from '@/lib/apiUrl';

const API_URL = getApiUrl();

interface RawAssetDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: { id: number; name: string; slug: string };
  latitude: string;
  longitude: string;
  address: string;
  postcode: string;
  website: string;
  phone: string;
  opening_hours: Record<string, string>;
  average_rating: string;
  review_count: number;
  view_count: number;
  featured: boolean;
  images: { id: number; image: string; caption: string; is_primary: boolean }[];
  submitted_by_username?: string;
  created_at: string;
}

async function getAsset(slug: string): Promise<RawAssetDetail | null> {
  try {
    const res = await fetch(`${API_URL}/assets/${slug}/`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AssetDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const asset = await getAsset(resolvedParams.slug);
  
  if (!asset) {
    notFound();
  }
  
  const primaryImage = asset.images?.find((img) => img.is_primary) || asset.images?.[0];
  const rating = Number(asset.average_rating);
  const lat = Number(asset.latitude);
  const lng = Number(asset.longitude);
  const delta = 0.01;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const osmOpenUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const hasWebsite = Boolean(asset.website);
  const hasPhone = Boolean(asset.phone);
  const updateRequestHref = `/assets/submit?${new URLSearchParams({
    sourceSlug: asset.slug,
    title: asset.title,
    description: asset.description,
    categoryId: String(asset.category?.id ?? ''),
    lat: String(asset.latitude ?? ''),
    lng: String(asset.longitude ?? ''),
    address: asset.address ?? '',
    postcode: asset.postcode ?? '',
    website: asset.website ?? '',
    phone: asset.phone ?? '',
  }).toString()}`;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/assets"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to listings
        </Link>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {primaryImage && (
            <div className="h-80 bg-gray-100 overflow-hidden">
              {/* Native img: avoids next/image optimizer hitting localhost:9000 from inside Docker */}
              <img
                src={mediaUrl(primaryImage.image)}
                alt={asset.title}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </div>
          )}
          
          <div className="p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-full mb-3">
                  {asset.category?.name}
                </span>
                <h1 className="text-3xl font-bold text-gray-900">{asset.title}</h1>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                {rating > 0 && (
                  <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="font-semibold">{rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({asset.review_count} reviews)</span>
                  </div>
                )}
                <ReportButton assetId={asset.id} assetTitle={asset.title} />
              </div>
            </div>
            
            <p className="text-gray-700 text-lg leading-relaxed mb-8">
              {asset.description}
            </p>
            
            <div className="border-t border-gray-100 pt-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Location</h2>
                  <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 space-y-2 text-gray-700">
                    {asset.address && <p>{asset.address}</p>}
                    {asset.postcode && <p>{asset.postcode}</p>}
                    {!asset.address && !asset.postcode && (
                      <p className="text-sm text-gray-500 italic">Location available on map below</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-100">
                    <iframe
                      title={`Map location for ${asset.title}`}
                      src={osmEmbedUrl}
                      className="w-full h-72"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <a
                      href={osmOpenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Open in OpenStreetMap
                    </a>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  {(hasWebsite || hasPhone) && (
                    <div className="rounded-xl border border-gray-200 p-4">
                      <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
                      <div className="space-y-2 text-sm">
                        {hasWebsite && (
                          <a
                            href={asset.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-primary-600 hover:underline"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Visit website
                          </a>
                        )}
                        {hasPhone && (
                          <a
                            href={`tel:${asset.phone}`}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {asset.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick stats</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Category: {asset.category?.name}</p>
                      <p>Reviews: {asset.review_count}</p>
                      <p>Views: {asset.view_count}</p>
                      <p>Submitted by: {asset.submitted_by_username || 'Community'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {asset.opening_hours && Object.keys(asset.opening_hours).length > 0 && (
              <div className="border-t border-gray-100 pt-8 mt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Opening Hours</h2>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(asset.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between py-1">
                      <span className="capitalize text-gray-600">{day}</span>
                      <span className="text-gray-900">{hours as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-6 mt-8 text-sm text-gray-500">
              <p>Submitted by {asset.submitted_by_username || 'Community'}</p>
              <div className="flex items-center gap-4">
                <SuggestUpdateButton href={updateRequestHref} />
                <p>{asset.view_count} views</p>
              </div>
            </div>

            <Suspense fallback={<div className="mt-8 pt-8 border-t border-gray-100 animate-pulse h-32 bg-gray-50 rounded-xl" />}>
              <AssetReviewsSection
                assetId={asset.id}
                assetSlug={asset.slug}
                assetReviewCount={asset.review_count}
                submittedByUsername={asset.submitted_by_username ?? null}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
