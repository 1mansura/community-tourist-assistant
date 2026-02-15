/**
 * Normalize asset image URLs for the Next.js rewrite `/api/media/*` → Django `/media/*`.
 * Absolute URLs whose path starts with `media/` are rewritten to the proxy (legacy MinIO responses).
 */
export function mediaUrl(url: string | null | undefined): string {
  if (url == null || typeof url !== 'string') return '';
  const s = String(url).trim();
  if (!s) return '';
  // Legacy API responses: absolute MinIO/S3 URL → same proxy path as /media/
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const u = new URL(s);
      let pathname = u.pathname.replace(/^\/+/, '');
      if (pathname.startsWith('media/')) {
        return `/api/media/${pathname.slice('media/'.length)}`;
      }
    } catch {
      /* ignore */
    }
    return s;
  }
  if (s.startsWith('/api/media/')) return s;
  let path: string;
  try {
    if (s.startsWith('/media/')) path = s.slice(7);
    else if (s.startsWith('/media')) path = s.slice(6).replace(/^\/+/, '');
    else if (s.startsWith('/')) path = s.slice(1);
    else {
      const parsed = new URL(s);
      const raw = parsed.pathname.replace(/^\/+/, '');
      path = raw.startsWith('media/') ? raw.slice(6) : raw;
    }
  } catch {
    path = s.replace(/^\/+/, '').replace(/^media\/?/, '');
  }
  const clean = path.replace(/^\/+/, '').replace(/^media\/?/, '');
  if (!clean) return '';
  return `/api/media/${clean}`;
}
