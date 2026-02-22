'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Asset } from '@/types';

/** Category slug -> emoji for map marker (clear at a glance). */
const CATEGORY_MARKER_EMOJI: Record<string, string> = {
  'heritage-sites': '🏰',
  beaches: '🏖️',
  'parks-gardens': '🌳',
  'beauty-spots': '⛰️',
  dining: '🍴',
  'pubs-nightlife': '🍺',
  activities: '🧗',
};
const DEFAULT_MARKER_EMOJI = '📍';

function iconForCategory(slug: string | undefined, selected = false): L.DivIcon {
  const emoji = (slug && CATEGORY_MARKER_EMOJI[slug]) || DEFAULT_MARKER_EMOJI;
  const border = selected ? '#16a34a' : '#0ea5e9';
  const glow = selected ? '0 0 0 6px rgba(34,197,94,0.22)' : '0 2px 6px rgba(0,0,0,0.25)';
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: white;
        border: 2px solid ${border};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: ${glow};
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 16px; line-height: 1;">${emoji}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function isMapSafe(map: L.Map | null, container: HTMLDivElement | null): boolean {
  if (!map || !container) return false;
  try {
    if (!document.body.contains(container)) return false;
    const pane = (map as unknown as { _container?: HTMLElement })._container;
    return !!(pane && document.body.contains(pane));
  } catch {
    return false;
  }
}

interface MapContainerProps {
  assets: Asset[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (asset: Asset) => void;
  selectedAssetId?: number | null;
  /** Set true to hide the Leaflet/OpenStreetMap attribution (e.g. for hero preview). */
  hideAttribution?: boolean;
  /** Set true to hide the +/- zoom control (e.g. for a clean hero preview). */
  hideZoomControl?: boolean;
  /** Set false to disable pan/zoom interactions (hero preview). */
  interactive?: boolean;
}

export default function MapContainer({
  assets,
  center = [50.7184, -3.5339],
  zoom = 9,
  onMarkerClick,
  selectedAssetId = null,
  hideAttribution = false,
  hideZoomControl = false,
  interactive = true,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersByAssetIdRef = useRef<Map<number, { marker: L.Marker; slug?: string }>>(new Map());
  const onMarkerClickRef = useRef<typeof onMarkerClick>(onMarkerClick);
  const mountedRef = useRef(true);
  const [mapReady, setMapReady] = useState(false);

  const centerLat = center[0];
  const centerLng = center[1];

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      attributionControl: !hideAttribution,
      zoomControl: !hideZoomControl,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      touchZoom: interactive,
    }).setView([centerLat, centerLng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: hideAttribution ? '' : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapInstanceRef.current = map;

    map.once('load', () => {
      if (mountedRef.current) setMapReady(true);
    });
    const fallback = setTimeout(() => {
      if (mountedRef.current) setMapReady(true);
    }, 800);

    return () => {
      clearTimeout(fallback);
      const instance = mapInstanceRef.current;
      mapInstanceRef.current = null;
      setMapReady(false);
      if (!instance) return;
      try {
        instance.off();
        instance.remove();
      } catch {
        // ignore if map already torn down
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideAttribution, hideZoomControl, interactive]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapRef.current;
    if (!map || !container || !mountedRef.current) return;
    if (!isMapSafe(map, container)) return;

    const markers: L.Marker[] = [];
    try {
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          markers.push(layer);
        }
      });
      markers.forEach((m) => {
        try {
          map.removeLayer(m);
        } catch {
          // layer may already be invalid
        }
      });
    } catch {
      return;
    }

    markersByAssetIdRef.current.clear();

    assets.forEach((asset) => {
      if (!isMapSafe(map, container)) return;
      const lat = Number(asset.latitude);
      const lng = Number(asset.longitude);
      const slug = asset.categorySlug ?? (asset.category as { slug?: string })?.slug;
      const marker = L.marker([lat, lng], {
        icon: iconForCategory(slug, false),
        interactive: interactive !== false,
      }).addTo(map);
      marker.setZIndexOffset(0);
      markersByAssetIdRef.current.set(asset.id, { marker, slug });

      if (interactive !== false) {
        const rating = Number(asset.averageRating);
        const popupContent = `
          <div style="min-width: 150px;">
            <strong>${asset.title}</strong>
            <p style="margin: 4px 0; color: #666; font-size: 12px;">
              ${asset.categoryName || (asset.category as { name?: string })?.name || ''}
            </p>
            ${rating > 0 ? `<p style="margin: 0; font-size: 12px;">Rating: ${rating.toFixed(1)}/5</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);
        marker.on('click', () => onMarkerClickRef.current?.(asset));
      }
    });

    if (assets.length > 0 && isMapSafe(map, container)) {
      const bounds = L.latLngBounds(
        assets.map((a) => [Number(a.latitude), Number(a.longitude)])
      );
      const id = setTimeout(() => {
        if (!mountedRef.current || !mapInstanceRef.current) return;
        if (!isMapSafe(map, container)) return;
        try {
          map.fitBounds(bounds, { padding: [50, 50] });
        } catch {
          // ignore if map unmounted
        }
      }, 0);
      return () => clearTimeout(id);
    }
  }, [assets, interactive]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapRef.current;
    if (!map || selectedAssetId == null || !isMapSafe(map, container)) return;
    const asset = assets.find((a) => a.id === selectedAssetId);
    if (!asset) return;
    const lat = Number(asset.latitude);
    const lng = Number(asset.longitude);
    const id = setTimeout(() => {
      if (!mountedRef.current || !mapInstanceRef.current) return;
      if (!isMapSafe(map, container)) return;
      try {
        map.flyTo([lat, lng], 14, { duration: 0.5 });
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(id);
  }, [selectedAssetId, assets]);

  useEffect(() => {
    markersByAssetIdRef.current.forEach(({ marker, slug }, assetId) => {
      const isSelected = selectedAssetId === assetId;
      marker.setIcon(iconForCategory(slug, isSelected));
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    });
  }, [selectedAssetId]);

  return (
    <motion.div
      className="w-full h-full overflow-hidden"
      style={{ minHeight: '400px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: mapReady ? 1 : 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div
        ref={mapRef}
        className="w-full h-full"
      />
    </motion.div>
  );
}
