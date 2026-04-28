export type AnalysisRouteMode = 'game' | 'editor' | 'quick';

interface ResolveAnalysisRouteModeOptions {
  gameId?: string;
  searchParams: URLSearchParams;
}

export function resolveAnalysisRouteMode({
  gameId,
  searchParams,
}: ResolveAnalysisRouteModeOptions): AnalysisRouteMode {
  if (searchParams.get('mode') === 'editor') {
    return 'editor';
  }

  if (gameId || searchParams.has('moves') || searchParams.has('payload')) {
    return 'game';
  }

  return 'quick';
}
