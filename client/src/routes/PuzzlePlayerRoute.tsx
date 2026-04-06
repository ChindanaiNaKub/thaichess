import { lazy, Suspense } from 'react';

const PuzzlePlayerRouteContent = lazy(() => import('./PuzzlePlayerRouteContent'));

function PuzzleRouteFallback() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-text-dim">Loading puzzle...</p>
      </div>
    </div>
  );
}

export function PuzzlePlayerRoute() {
  return (
    <Suspense fallback={<PuzzleRouteFallback />}>
      <PuzzlePlayerRouteContent />
    </Suspense>
  );
}

export default PuzzlePlayerRoute;
