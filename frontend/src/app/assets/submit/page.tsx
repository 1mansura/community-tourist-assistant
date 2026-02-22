'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { assetsService } from '@/services/assets';
import { Button, Input } from '@/components/ui';
import { extractErrorMessage } from '@/lib/api';
import { recordSubmissionStatusSnapshot } from '@/lib/submissionNotifications';
import type { Category } from '@/types';
import DynamicLocationPickerMap from '@/components/map/DynamicLocationPickerMap';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimReverseResult {
  display_name: string;
  address?: {
    road?: string;
    pedestrian?: string;
    footway?: string;
    neighbourhood?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    postcode?: string;
  };
}

function formatReverseAddress(result: NominatimReverseResult): string {
  const a = result.address ?? {};
  const road = a.road ?? a.pedestrian ?? a.footway ?? '';
  const area = a.neighbourhood ?? a.suburb ?? a.village ?? '';
  const locality = a.town ?? a.city ?? a.county ?? '';
  return [road, area, locality].filter(Boolean).join(', ') || result.display_name;
}

function extractUkPostcode(text: string): string {
  const match = text.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})\b/i);
  return match ? match[1].toUpperCase() : '';
}

export default function SubmitAssetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <SubmitAssetContent />
    </Suspense>
  );
}

function SubmitAssetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([50.7184, -3.5339]);
  const [draftLocation, setDraftLocation] = useState<{
    lat: number;
    lng: number;
    displayName?: string;
    postcode?: string;
  } | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUpdateRequest, setIsUpdateRequest] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    latitude: '',
    longitude: '',
    address: '',
    postcode: '',
    website: '',
    phone: '',
  });
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/assets/submit');
    }
  }, [authLoading, isAuthenticated, router]);
  
  useEffect(() => {
    assetsService.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    const sourceSlug = searchParams.get('sourceSlug');
    if (!sourceSlug) return;
    setIsUpdateRequest(true);
    setFormData((prev) => ({
      ...prev,
      title: searchParams.get('title') ?? prev.title,
      description: searchParams.get('description') ?? prev.description,
      category: searchParams.get('categoryId') ?? prev.category,
      latitude: searchParams.get('lat') ?? prev.latitude,
      longitude: searchParams.get('lng') ?? prev.longitude,
      address: searchParams.get('address') ?? prev.address,
      postcode: searchParams.get('postcode') ?? prev.postcode,
      website: searchParams.get('website') ?? prev.website,
      phone: searchParams.get('phone') ?? prev.phone,
    }));
  }, [searchParams]);

  useEffect(() => {
    const lat = Number(formData.latitude);
    const lng = Number(formData.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMapCenter([lat, lng]);
    }
  }, [formData.latitude, formData.longitude]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const selectedMapPosition = useMemo<[number, number] | null>(() => {
    if (draftLocation) return [draftLocation.lat, draftLocation.lng];
    const lat = Number(formData.latitude);
    const lng = Number(formData.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  }, [draftLocation, formData.latitude, formData.longitude]);

  const handleMapPick = useCallback(async (lat: number, lng: number) => {
    setDraftLocation({ lat, lng });
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const data = (await res.json()) as NominatimReverseResult;
      const friendlyAddress = formatReverseAddress(data);
      const postcode = data.address?.postcode ? extractUkPostcode(data.address.postcode) : extractUkPostcode(data.display_name);
      setDraftLocation({ lat, lng, displayName: friendlyAddress, postcode });
    } catch {
      // Reverse geocode failed — draftLocation stays without displayName, user can type manually
    }
  }, []);

  const handleSearchAddress = async () => {
    const query = addressQuery.trim();
    if (!query) {
      setSearchError('Enter an address or place name to search.');
      setSearchResults([]);
      return;
    }

    setSearchError('');
    setIsSearchingAddress(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=gb&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Search request failed');
      }
      const data = (await response.json()) as NominatimResult[];
      setSearchResults(data);
      if (data.length === 0) {
        setSearchError('No matches found. Try a more specific address.');
      }
    } catch {
      setSearchError('Address search unavailable right now. You can still click the map to select location.');
      setSearchResults([]);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const applyDraftLocation = () => {
    if (!draftLocation) return;
    setFormData((prev) => ({
      ...prev,
      latitude: draftLocation.lat.toFixed(6),
      longitude: draftLocation.lng.toFixed(6),
      address: draftLocation.displayName ?? prev.address,
      postcode: draftLocation.postcode || prev.postcode,
    }));
    setMapCenter([draftLocation.lat, draftLocation.lng]);
    setDraftLocation(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: parseInt(formData.category),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address,
        postcode: formData.postcode,
        website: formData.website,
        phone: formData.phone,
      };
      
      const asset = await assetsService.createAsset(payload);
      if (imageFile) {
        try {
          await assetsService.uploadAssetImage(asset.slug, imageFile, { isPrimary: true });
        } catch (imgErr) {
          console.error('Image upload failed:', imgErr);
          showNotification(
            'Place submitted, but photo upload failed',
            'error',
            6500,
            'You can resubmit the image from your pending submission later.',
          );
        }
      }
      await refreshUser();
      if (user) {
        assetsService.getMySubmissions().then((subs) => {
          recordSubmissionStatusSnapshot(user.id, subs);
        }).catch(() => {});
      }
      showNotification(
        'Place submitted for review!',
        'success',
        6000,
        'A moderator will review it shortly. You\'ll earn 50 points once approved.',
        { onNextRoute: true },
      );
      router.push('/assets');
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50/80 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isUpdateRequest ? 'Suggest an update' : 'Submit a place'}
          </h1>
          <p className="text-slate-600 mb-8">
            {isUpdateRequest
              ? 'You are suggesting an update to an existing place. Edit any fields below and submit. A moderator will review before publishing.'
              : 'Share a favourite spot in Devon. After you submit, a moderator will review it; once approved, it will appear on the map and in Explore.'}
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Place Name"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Fistral Beach"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe what makes this place special..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Location</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Find the location by address search or click directly on the map. Then confirm the selected point.
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSearchAddress();
                    }
                  }}
                  placeholder="Search address or place in Devon"
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Button
                  type="button"
                  variant="secondary"
                  loading={isSearchingAddress}
                  onClick={() => void handleSearchAddress()}
                >
                  Search
                </Button>
              </div>
              {searchError && <p className="text-xs text-rose-600">{searchError}</p>}
              {searchResults.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 max-h-48 overflow-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.place_id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-50"
                      onClick={() => {
                        const lat = Number(result.lat);
                        const lng = Number(result.lon);
                        setDraftLocation({
                          lat,
                          lng,
                          displayName: result.display_name,
                          postcode: extractUkPostcode(result.display_name),
                        });
                        setMapCenter([lat, lng]);
                      }}
                    >
                      <p className="text-sm text-slate-700">{result.display_name}</p>
                    </button>
                  ))}
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Tip: click anywhere on the map to choose an exact pin.
                </p>
                <DynamicLocationPickerMap
                  center={mapCenter}
                  selectedPosition={selectedMapPosition}
                  onPick={handleMapPick}
                />
              </div>
              {draftLocation && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between gap-2">
                  <div className="text-xs text-emerald-800">
                    {draftLocation.displayName
                      ? `Selected: ${draftLocation.displayName}`
                      : 'Location selected on map'}
                  </div>
                  <Button type="button" onClick={applyDraftLocation}>
                    Confirm location
                  </Button>
                </div>
              )}
              {formData.latitude && formData.longitude && !draftLocation && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
                  Location set{formData.address ? `: ${formData.address}` : ''}
                </div>
              )}
              {!formData.latitude && !draftLocation && (
                <p className="text-xs text-amber-600">
                  Search for an address above or click the map to set the location.
                </p>
              )}
              <Input
                label="Address (optional but helpful)"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street, town, e.g. Exeter Quay, Exeter"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Postcode"
                name="postcode"
                value={formData.postcode}
                onChange={handleChange}
                placeholder="e.g. EX2 4AN"
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
            <Input
              label="Website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://..."
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-slate-500 mt-1">
                Add a photo so your place looks great once approved.
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isLoading}>
                Submit for Review
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
