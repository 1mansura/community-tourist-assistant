'use client';

import dynamic from 'next/dynamic';

const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] w-full rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-sm text-slate-500">
      Loading map picker...
    </div>
  ),
});

interface DynamicLocationPickerMapProps {
  center: [number, number];
  selectedPosition: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}

export default function DynamicLocationPickerMap(props: DynamicLocationPickerMapProps) {
  return <LocationPickerMap {...props} />;
}
