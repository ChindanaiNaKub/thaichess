/**
 * Known application paths served by the SPA. Mirrors client/src/lib/routes.ts.
 * Any extensionless GET that does not match here gets a real 404 instead of
 * the indexable SPA shell (soft-404 / duplicate-content protection).
 */
const STATIC_APP_PATHS = new Set([
  '/',
  '/local',
  '/bot',
  '/puzzles',
  '/puzzles/random',
  '/puzzles/streak',
  '/puzzles/themes',
  '/lessons',
  '/course',
  '/course-path',
  '/learn',
  '/watch',
  '/play',
  '/quick-play',
  '/about',
  '/games',
  '/leaderboard',
  '/what-is-makruk',
  '/how-to-play-makruk',
  '/play-makruk-online',
  '/feedback',
  '/fair-play',
  '/privacy',
  '/terms',
  '/donate',
  '/login',
  '/2fa',
  '/account',
  '/settings/board-pieces',
  '/analysis',
  '/database',
  '/openings',
]);

const DYNAMIC_APP_PATH_PATTERNS: RegExp[] = [
  /^\/puzzle\/[^/]+$/,
  /^\/lessons\/[^/]+$/,
  /^\/course\/[^/]+$/,
  /^\/learn\/[^/]+$/,
  /^\/game\/[^/]+$/,
  /^\/spectate\/[^/]+$/,
  /^\/analysis\/[^/]+$/,
];

export function isKnownAppPath(pathname: string): boolean {
  if (STATIC_APP_PATHS.has(pathname)) return true;
  return DYNAMIC_APP_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}
