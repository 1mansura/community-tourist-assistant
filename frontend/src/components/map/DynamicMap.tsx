'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';
import type { Asset } from '@/types';

const MapContainer = dynamic(() => import('./MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-gray-100 flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  ),
});

interface ErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    // Swallow Leaflet internal positioning errors — they are benign race conditions
    // during tile loading and don't affect map functionality when the component remounts.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[MapErrorBoundary] caught:', error.message);
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] bg-slate-100 flex flex-col items-center justify-center gap-3 text-slate-500">
          <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm font-medium">Map failed to load</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

interface DynamicMapProps {
  assets: Asset[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (asset: Asset) => void;
  selectedAssetId?: number | null;
  hideAttribution?: boolean;
  hideZoomControl?: boolean;
  interactive?: boolean;
}

export default function DynamicMap(props: DynamicMapProps) {
  return (
    <MapErrorBoundary>
      <MapContainer {...props} />
    </MapErrorBoundary>
  );
}
