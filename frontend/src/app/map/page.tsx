'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicMap from '@/components/map/DynamicMap';
import { assetsService } from '@/services/assets';
import { useAuth } from '@/contexts/AuthContext';
import {
  MapPin,
  Star,
  MessageSquare,
  ExternalLink,
  X,
  ChevronRight,
  Search,
  List,
} from 'lucide-react';
import type { Asset } from '@/types';
import { mediaUrl } from '@/lib/mediaUrl';

export default function MapPage() {
  const { isAuthenticated } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await assetsService.getAssets({ ordering: '-average_rating' });
        setAssets(data.results);
      } catch (error) {
        console.error('Failed to load assets:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAssets();
  }, []);

  const handleMarkerClick = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
  }, []);

  const filteredAssets = searchQuery.trim()
    ? assets.filter((a) => {
        const query = searchQuery.toLowerCase();
        const words = query.split(/\s+/);
        const haystack = [
          a.title,
          a.categoryName ?? (a.category as { name?: string })?.name ?? '',
          a.address ?? '',
          a.description ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return words.every((word) => haystack.includes(word));
      })
    : assets;

  const getReviewHref = (slug: string) => {
    const target = `/assets/${slug}?focus=review#reviews`;
    return isAuthenticated ? target : `/login?redirect=${encodeURIComponent(target)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <span>Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-50 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Map View</h1>
            <p className="text-sm text-slate-500">
              {assets.length} places in Cornwall — click a marker or choose from the list
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Map area */}
        <div className="flex-1 min-w-0 p-3">
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-card border border-slate-100">
            <DynamicMap
              assets={assets}
              onMarkerClick={handleMarkerClick}
              selectedAssetId={selectedAsset?.id ?? null}
              hideAttribution
            />
          </div>
        </div>

        {/* Sidebar – always visible */}
        <aside className="w-80 md:w-96 shrink-0 flex flex-col bg-white border-l border-slate-200 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {selectedAsset ? (
                /* Detail panel */
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-semibold text-slate-900 text-lg">
                      {selectedAsset.title}
                    </h2>
                    <button
                      onClick={() => setSelectedAsset(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {(selectedAsset.primaryImage ?? selectedAsset.images?.[0]) && (
                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100 mb-3">
                      <img
                        src={mediaUrl((selectedAsset.primaryImage ?? selectedAsset.images?.[0])?.image)}
                        alt={selectedAsset.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <p className="font-medium text-primary-600">
                      {selectedAsset.categoryName ??
                        (typeof selectedAsset.category === 'object'
                          ? selectedAsset.category?.name
                          : '')}
                    </p>
                    {Number(selectedAsset.averageRating) > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span>
                          {Number(selectedAsset.averageRating).toFixed(1)} · {Number(selectedAsset.reviewCount) || 0}{' '}
                          reviews
                        </span>
                      </div>
                    )}
                    {selectedAsset.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                        <span>{selectedAsset.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link href={`/assets/${selectedAsset.slug}`}>
                      <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 hover:shadow-glow transition-all">
                        <ExternalLink className="h-4 w-4" />
                        View full page
                      </button>
                    </Link>
                    <Link href={getReviewHref(selectedAsset.slug)}>
                      <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-primary-200 transition-all">
                        <MessageSquare className="h-4 w-4" />
                        {isAuthenticated ? 'Write a review' : 'Log in to review'}
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                /* Place list */
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3"
                >
                  <div className="flex items-center gap-2 text-slate-500 text-sm mb-3">
                    <List className="h-4 w-4" />
                    <span>Click a place to see details and actions</span>
                  </div>
                  <ul className="space-y-1">
                    {filteredAssets.length === 0 ? (
                      <li className="py-4 text-center text-slate-500 text-sm">
                        No places match your search.
                      </li>
                    ) : (
                      filteredAssets.map((asset) => (
                        <li key={asset.id}>
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-900 truncate">
                                {asset.title}
                              </span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                              <span>
                                {asset.categoryName ??
                                  (typeof asset.category === 'object'
                                    ? asset.category?.name
                                    : '')}
                              </span>
                              {Number(asset.averageRating) > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-0.5">
                                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                    {Number(asset.averageRating).toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}
