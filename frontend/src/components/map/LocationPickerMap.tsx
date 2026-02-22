'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pickerIcon = L.divIcon({
  className: '',
  html: `<div style="
    display:flex;align-items:center;justify-content:center;
    width:32px;height:42px;position:relative;
  ">
    <svg width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z"
            fill="#3b82f6" stroke="#1e40af" stroke-width="1.5"/>
      <circle cx="16" cy="15" r="6" fill="white"/>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

interface LocationPickerMapProps {
  center: [number, number];
  selectedPosition: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({
  center,
  selectedPosition,
  onPick,
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const mountedRef = useRef(true);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Create map once — never tear down on prop changes
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(center, 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    map.on('click', (event: L.LeafletMouseEvent) => {
      onPickRef.current(event.latlng.lat, event.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      mountedRef.current = false;
      mapInstanceRef.current = null;
      markerRef.current = null;
      try {
        map.off();
        map.remove();
      } catch {
        // already torn down
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan to new center when it changes (don't recreate map)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mountedRef.current) return;
    try {
      map.setView(center, map.getZoom(), { animate: true });
    } catch {
      // map may be mid-teardown during unmount
    }
  }, [center]);

  // Update or create marker when selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mountedRef.current) return;

    if (!selectedPosition) {
      if (markerRef.current) {
        try { map.removeLayer(markerRef.current); } catch { /* */ }
        markerRef.current = null;
      }
      return;
    }

    const [lat, lng] = selectedPosition;
    try {
      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng], { icon: pickerIcon }).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
    } catch {
      // marker ops can fail if map is torn down
    }
  }, [selectedPosition]);

  return <div ref={mapRef} className="h-[320px] w-full rounded-lg border border-slate-200" />;
}
