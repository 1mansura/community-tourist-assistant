'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { assetsService } from '@/services/assets';
import { Button, Input } from '@/components/ui';
import { extractErrorMessage } from '@/lib/api';
import { mediaUrl } from '@/lib/mediaUrl';
import { recordSubmissionStatusSnapshot } from '@/lib/submissionNotifications';
import type { Asset, Category } from '@/types';

export default function EditAssetPage() {
  const router = useRouter();
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const { showNotification } = useNotification();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [error, setError] = useState('');

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/assets/${slug}/edit`);
      return;
    }
    if (!slug) return;
    assetsService
      .getAsset(slug)
      .then((a) => {
        setAsset(a);
        const cat = a.category as { id?: number };
        setFormData({
          title: a.title,
          description: a.description,
          category: String(cat?.id ?? ''),
          latitude: String(a.latitude),
          longitude: String(a.longitude),
          address: a.address ?? '',
          postcode: a.postcode ?? '',
          website: a.website ?? '',
          phone: a.phone ?? '',
        });
      })
      .catch(() => setFetchError("Place not found or you don't have permission to edit it."));
    assetsService.getCategories().then(setCategories).catch(console.error);
  }, [authLoading, isAuthenticated, slug, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setError('');
    setIsLoading(true);
    try {
      await assetsService.updateAsset(slug, {
        title: formData.title,
        description: formData.description,
        category: parseInt(formData.category, 10),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        address: formData.address || undefined,
        postcode: formData.postcode || undefined,
        website: formData.website || undefined,
        phone: formData.phone || undefined,
      });
      if (imageFile) {
        setImageUploading(true);
        setImageError('');
        try {
          await assetsService.uploadAssetImage(slug, imageFile, { isPrimary: true });
          setImageFile(null);
        } catch (imgErr: unknown) {
          setImageError(extractErrorMessage(imgErr));
        } finally {
          setImageUploading(false);
        }
      }
      await refreshUser();
      if (user) {
        assetsService.getMySubmissions().then((subs) => {
          recordSubmissionStatusSnapshot(user.id, subs);
        }).catch(() => {});
      }
      const updatedAsset = await assetsService.getAsset(slug);
      const isApproved = updatedAsset?.status === 'approved';
      showNotification(
        'Changes saved',
        'success',
        4500,
        imageFile ? 'Your place details and photo were updated.' : 'Your place details were updated.',
        { onNextRoute: true },
      );
      router.push(isApproved ? `/assets/${slug}` : '/profile');
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (isAuthenticated && !asset && !fetchError)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (fetchError || !asset) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow border border-slate-200 p-8 max-w-md text-center">
          <p className="text-slate-700 mb-4">{fetchError || 'Place not found.'}</p>
          <Link href="/assets" className="text-primary-600 hover:underline">
            Back to places
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && asset.submittedByUsername === user.username;
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow border border-slate-200 p-8 max-w-md text-center">
          <p className="text-slate-700 mb-4">You can only edit places you submitted.</p>
          <Link href={`/assets/${slug}`} className="text-primary-600 hover:underline">
            Back to place
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Edit place</h1>
          <p className="text-slate-600 mb-8">
            Update the details below. Changes are saved immediately.
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
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
              <h3 className="text-sm font-semibold text-slate-800">Location</h3>
              {formData.address && (
                <p className="text-sm text-slate-600">Current: {formData.address}</p>
              )}
              <Input
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street, town, e.g. Exeter Quay, Exeter"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Postcode" name="postcode" value={formData.postcode} onChange={handleChange} />
              <Input label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
            </div>
            <Input
              label="Website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
            />

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Photo</h3>
              {(asset.primaryImage || asset.images?.[0]) && (
                <div className="relative h-32 w-full max-w-xs rounded-lg overflow-hidden bg-slate-200">
                  <img
                    src={mediaUrl((asset.primaryImage || asset.images?.[0])?.image)}
                    alt={asset.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {asset.images?.length ? 'Add or replace photo' : 'Add a photo'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setImageFile(f ?? null);
                    setImageError('');
                  }}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700"
                />
                {imageFile && (
                  <p className="mt-1 text-sm text-slate-500">
                    {imageFile.name} will be set as the main photo when you save.
                  </p>
                )}
                {imageError && (
                  <p className="mt-1 text-sm text-red-600">{imageError}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href={asset.status === 'approved' ? `/assets/${slug}` : '/profile'}>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" loading={isLoading || imageUploading}>
                {imageUploading ? 'Saving and uploading photo…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
