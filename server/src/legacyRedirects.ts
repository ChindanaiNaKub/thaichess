/**
 * Legacy path redirects (SEO). Served as 301 before canonicalization so
 * Googlebot's "Page with redirect" entries resolve to live indexable URLs.
 */
const LEGACY_PATH_REDIRECTS: Record<string, string> = {
  '/play': '/quick-play',
  '/learn': '/lessons',
  '/course': '/lessons',
  '/course-path': '/lessons',
};

const LEGACY_SEGMENT_REDIRECT = /^\/(learn|course)\/([^/]+)$/;

export function getLegacyRedirectPath(pathname: string): string | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;

  const staticTarget = LEGACY_PATH_REDIRECTS[normalized];
  if (staticTarget) return staticTarget;

  const segmentMatch = LEGACY_SEGMENT_REDIRECT.exec(normalized);
  if (segmentMatch) return `/lessons/${segmentMatch[2]}`;

  return null;
}
