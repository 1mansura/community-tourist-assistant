'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Star, ImageIcon } from 'lucide-react';
import type { Asset } from '@/types';
import { mediaUrl } from '@/lib/mediaUrl';

interface AssetCardProps {
  asset: Asset;
  index?: number;
}

export default function AssetCard({ asset, index = 0 }: AssetCardProps) {
  const primaryImage = asset.primaryImage || asset.images?.[0];
  const rating = Number(asset.averageRating) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Link href={`/assets/${asset.slug}`}>
        <motion.article
          whileHover={{ y: -8, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.98 }}
          className="group bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden hover:shadow-card-hover hover:border-primary-100 transition-all duration-300"
        >
          <div className="relative h-48 bg-slate-100 overflow-hidden">
            {primaryImage ? (
              <img
                src={mediaUrl(primaryImage.image)}
                alt={asset.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300">
                <ImageIcon className="w-14 h-14" strokeWidth={1.2} />
              </div>
            )}
            {asset.featured && (
              <motion.span
                initial={{ scale: 0.9, opacity: 0.9 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-3 left-3 px-2.5 py-1 bg-amber-400/95 text-amber-900 text-xs font-semibold rounded-lg shadow-sm"
              >
                Featured
              </motion.span>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-primary-700 transition-colors">
                {asset.title}
              </h3>
              {rating > 0 && (
                <div className="flex items-center gap-1 text-sm shrink-0">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-medium text-slate-600">
                    {rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm text-primary-600 font-medium mb-2">
              {asset.categoryName ||
                (typeof asset.category === 'object' ? asset.category?.name : '')}
            </p>

            <div className="flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">
                {asset.address || 'Devon'}
              </span>
            </div>
          </div>
        </motion.article>
      </Link>
    </motion.div>
  );
}
