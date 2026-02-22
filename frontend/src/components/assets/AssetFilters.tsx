'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import type { Category } from '@/types';

interface AssetFiltersProps {
  categories: Category[];
}

export default function AssetFilters({ categories }: AssetFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  
  const currentCategory = searchParams.get('category') || '';
  const currentOrdering = searchParams.get('ordering') || '-created_at';
  
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`/assets?${params.toString()}`);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters('search', search);
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 mb-6">
      <form onSubmit={handleSearch} className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search places..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 hover:shadow-glow font-medium transition-all"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category
          </label>
          <select
            value={currentCategory}
            onChange={(e) => updateFilters('category', e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name} ({cat.assetCount})
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Sort By
          </label>
          <select
            value={currentOrdering}
            onChange={(e) => updateFilters('ordering', e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="-average_rating">Highest Rated</option>
            <option value="-review_count">Most Reviewed</option>
            <option value="title">A-Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}
