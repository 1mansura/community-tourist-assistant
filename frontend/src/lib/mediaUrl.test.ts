/**
 * Tests for normalising backend image paths to the Next.js ``/api/media`` proxy.
 */
import { mediaUrl } from './mediaUrl';

describe('mediaUrl', () => {
  it('keeps already proxied media URLs unchanged', () => {
    expect(mediaUrl('/api/media/assets/2026/03/example.jpg')).toBe(
      '/api/media/assets/2026/03/example.jpg'
    );
  });

  it('converts relative media URLs to proxied URLs', () => {
    expect(mediaUrl('/media/assets/2026/03/example.jpg')).toBe(
      '/api/media/assets/2026/03/example.jpg'
    );
  });

  it('rewrites absolute URLs whose path is /media/... to /api/media proxy', () => {
    expect(mediaUrl('http://localhost:9000/media/assets/2026/03/example.jpg')).toBe(
      '/api/media/assets/2026/03/example.jpg'
    );
    expect(mediaUrl('https://cdn.example.com/media/foo/bar.jpg')).toBe('/api/media/foo/bar.jpg');
  });

  it('keeps other absolute URLs unchanged', () => {
    expect(mediaUrl('https://images.unsplash.com/photo-1')).toBe('https://images.unsplash.com/photo-1');
  });

  it('returns an empty string for blank values', () => {
    expect(mediaUrl('')).toBe('');
    expect(mediaUrl(undefined)).toBe('');
    expect(mediaUrl(null)).toBe('');
  });

  it('handles bare storage paths without leading slash via fallback parsing', () => {
    expect(mediaUrl('assets/2026/01/x.jpg')).toBe('/api/media/assets/2026/01/x.jpg');
  });
});
