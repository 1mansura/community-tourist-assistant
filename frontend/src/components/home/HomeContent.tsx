'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Compass,
  Map,
  MapPin,
  Star,
  ImageIcon,
  Landmark,
  Utensils,
  TreePine,
  Waves,
  Mountain,
  Palette,
  ChevronRight,
  PlusCircle,
  List,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { Asset } from '@/types';
import { mediaUrl } from '@/lib/mediaUrl';

const DynamicMap = dynamic(
  () => import('@/components/map/DynamicMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[320px] bg-slate-200 rounded-2xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Map className="h-10 w-10 animate-pulse" />
          <span>Loading map...</span>
        </div>
      </div>
    ),
  }
);

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

interface RawCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  asset_count: number;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  beaches: Waves,
  heritage: Landmark,
  dining: Utensils,
  nature: TreePine,
  outdoor: Mountain,
  arts: Palette,
};
const defaultCategoryIcon = MapPin;

const categoryColors: Record<string, string> = {
  beaches: 'from-cyan-400 to-blue-500',
  heritage: 'from-amber-400 to-orange-500',
  dining: 'from-rose-400 to-pink-500',
  nature: 'from-emerald-400 to-green-500',
  outdoor: 'from-lime-400 to-green-600',
  arts: 'from-violet-400 to-purple-500',
};
const defaultCategoryColor = 'from-primary-400 to-primary-600';

interface HomeContentProps {
  featured: FeaturedAsset[];
  categories: RawCategory[];
  stats: { assets: { total: number }; users: { contributors: number } };
  mapAssets: Asset[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 20 };
const hoverSpring = { type: 'spring' as const, stiffness: 300, damping: 20 };

function ExploreMapButton() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
      <motion.span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.preventDefault();
          if (navigating) return;
          setNavigating(true);
          router.push('/map');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (navigating) return;
            setNavigating(true);
            router.push('/map');
          }
        }}
        animate={navigating ? { scale: 1.08 } : {}}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        whileHover={!navigating ? { scale: 1.04 } : {}}
        whileTap={!navigating ? { scale: 0.98 } : {}}
        className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-400 text-amber-950 font-bold rounded-xl shadow-lg border-2 border-amber-500/50 hover:bg-amber-300 hover:shadow-amber-500/30 hover:shadow-xl transition-colors cursor-pointer"
      >
        Explore the map
        <motion.span
          animate={navigating ? { opacity: [1, 0.7, 1] } : {}}
          transition={{ duration: 0.25, repeat: navigating ? 2 : 0 }}
        >
          <ArrowRight className="h-5 w-5" />
        </motion.span>
      </motion.span>
    </div>
  );
}

const mainActions = [
  {
    href: '/assets',
    label: 'View all places',
    description: 'Browse by list',
    icon: List,
    color: 'bg-primary-500 hover:bg-primary-600',
    iconBg: 'bg-primary-100 text-primary-700',
  },
  {
    href: '/map',
    label: 'Explore on map',
    description: 'See where to go',
    icon: Map,
    color: 'bg-amber-500 hover:bg-amber-600',
    iconBg: 'bg-amber-100 text-amber-800',
  },
  {
    href: '#categories',
    label: 'By category',
    description: 'Beaches, food & more',
    icon: Layers,
    color: 'bg-emerald-500 hover:bg-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-700',
  },
  {
    href: '/assets/submit',
    label: 'Submit a place',
    description: 'Share a gem',
    icon: PlusCircle,
    color: 'bg-rose-500 hover:bg-rose-600',
    iconBg: 'bg-rose-100 text-rose-700',
  },
];

export default function HomeContent({
  featured,
  categories,
  stats,
  mapAssets,
}: HomeContentProps) {
  return (
    <main className="min-h-screen">
      {/* Hero – 50/50 split: left = CTA + actions, right = map preview with zig-zag divider */}
      <section className="relative isolate min-h-[85vh] flex flex-col lg:flex-row overflow-hidden">
        {/* Left half – gradient + content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative flex-1 flex flex-col justify-center bg-gradient-to-br from-primary-800 via-primary-900 to-slate-900 text-white px-6 py-12 lg:py-16 lg:pl-12 lg:pr-8 xl:pl-20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_40%,rgba(255,255,255,0.08),transparent)]" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/10 to-transparent" />
          <div className="relative max-w-lg">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-4xl md:text-5xl lg:text-5xl font-bold tracking-tight mb-2"
            >
              Discover Devon
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="text-primary-200 text-lg mb-8"
            >
              Beaches, heritage, food & hidden gems — from the community.
            </motion.p>

            {/* Vertical stack of action cards */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={container}
              className="flex flex-col gap-3"
            >
              {mainActions.map((action) => {
                const Icon = action.icon;
                return (
                  <motion.div key={action.href} variants={item}>
                    <Link href={action.href}>
                      <motion.div
                        whileHover={{ x: 6, scale: 1.02 }}
                        whileTap={{ scale: 0.98, x: 2 }}
                        transition={tapSpring}
                        className={`rounded-2xl p-4 ${action.color} text-white shadow-lg flex flex-row items-center gap-4 transition-colors`}
                      >
                        <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${action.iconBg}`}>
                          <Icon className="h-6 w-6" />
                        </span>
                        <div className="text-left min-w-0">
                          <p className="font-semibold text-sm md:text-base">{action.label}</p>
                          <p className="text-white/80 text-xs truncate">{action.description}</p>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Stats strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-8 mt-8 pt-6 border-t border-white/20"
            >
              {[
                { value: stats.assets?.total ?? 0, label: 'Places', icon: MapPin },
                { value: stats.users?.contributors ?? 0, label: 'Contributors', icon: Users },
                { value: categories.length, label: 'Categories', icon: Sparkles },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-2">
                    <span className="rounded-lg bg-white/15 p-2">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xl font-bold">{stat.value}+</p>
                      <p className="text-primary-200 text-xs">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>

        {/* Right half – map preview, no hard edge: gradient-only blend into left panel */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative flex-1 min-h-[320px] lg:min-h-[85vh] bg-slate-200 overflow-hidden lg:-ml-8"
        >
          <div className="absolute inset-0 z-0 overflow-hidden shadow-2xl">
            <DynamicMap assets={mapAssets} center={[50.7184, -3.5339]} zoom={9} hideAttribution hideZoomControl interactive={false} />
          </div>
          {/* Full-width soft gradient so map fades into the dark panel – no visible border */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(17, 94, 89, 0.72) 0%, rgba(17, 94, 89, 0.42) 9%, rgba(19, 78, 74, 0.2) 18%, transparent 32%)',
            }}
          />
          <ExploreMapButton />
        </motion.div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              className="flex items-center justify-between mb-8"
            >
              <h2 className="text-2xl font-bold text-slate-900">Featured places</h2>
              <Link
                href="/assets"
                className="flex items-center gap-1 text-primary-600 font-medium hover:text-primary-700 transition-colors"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: false, margin: '-50px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {featured.slice(0, 6).map((asset) => (
                <motion.div key={asset.id} variants={item}>
                  <Link href={`/assets/${asset.slug}`}>
                    <motion.article
                      whileHover={{ y: -6, transition: hoverSpring }}
                      whileTap={{ scale: 0.98, transition: tapSpring }}
                      className="group bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden hover:shadow-card-hover hover:border-primary-200 transition-all duration-300"
                    >
                      <div className="relative h-44 bg-slate-200 overflow-hidden">
                        {asset.primary_image ? (
                          <img
                            src={mediaUrl(asset.primary_image.image)}
                            alt={asset.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            <ImageIcon className="w-12 h-12" />
                          </div>
                        )}
                        {asset.featured && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-semibold rounded-md">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-primary-700 transition-colors">
                            {asset.title}
                          </h3>
                          {Number(asset.average_rating) > 0 && (
                            <div className="flex items-center gap-1 text-sm shrink-0">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="text-slate-600">
                                {Number(asset.average_rating).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-primary-600 font-medium">
                          {asset.category_name}
                        </p>
                      </div>
                    </motion.article>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Categories – icon-first, more color */}
      <section id="categories" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-2xl font-bold text-slate-900 mb-8 text-center"
          >
            Browse by category
          </motion.h2>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, margin: '-40px' }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.slug] ?? defaultCategoryIcon;
              const gradient = categoryColors[cat.slug] ?? defaultCategoryColor;
              return (
                <motion.div key={cat.slug} variants={item}>
                  <Link href={`/assets?category=${cat.slug}`}>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.03, transition: hoverSpring }}
                      whileTap={{ scale: 0.98, transition: tapSpring }}
                      className="p-5 bg-white rounded-2xl border border-slate-100 text-center hover:shadow-card-hover hover:border-slate-200 transition-all duration-200"
                    >
                      <span
                        className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md mb-3`}
                      >
                        <Icon className="h-7 w-7" />
                      </span>
                      <p className="font-semibold text-slate-900 text-sm">{cat.name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {cat.asset_count} places
                      </p>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary-600 via-primary-700 to-amber-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(255,255,255,0.1),transparent)]" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-2xl font-bold mb-4"
          >
            Share your local knowledge
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            className="text-lg text-white/90 mb-8"
          >
            Know a hidden gem? Help visitors discover the best of Devon.
          </motion.p>
          <Link href="/assets/submit">
            <motion.span
              whileHover={{ scale: 1.05, transition: hoverSpring }}
              whileTap={{ scale: 0.96, transition: tapSpring }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl shadow-lg hover:shadow-glow transition-shadow"
            >
              <PlusCircle className="h-5 w-5" />
              Submit a place
            </motion.span>
          </Link>
        </div>
      </section>
    </main>
  );
}
