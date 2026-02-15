/**
 * Returns the correct API base URL depending on execution context.
 *
 * Server components (inside Docker) use INTERNAL_API_URL → http://backend:8000/api
 * Client components (browser)      use NEXT_PUBLIC_API_URL → http://localhost:8000/api
 *
 * Falls back to http://localhost:8000/api for local dev without Docker.
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:8000/api'
    );
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
}
