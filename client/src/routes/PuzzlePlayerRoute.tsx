import { lazy, Suspense } from 'react';
import { PuzzleProgressProvider } from '../lib/puzzleProgress';

const PuzzlePlayerPage = lazy(() => import('../components/PuzzlePage').then((module) => ({
  default: module.PuzzlePlayer,
})));

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
    <PuzzleProgressProvider>
      <Suspense fallback={<PuzzleRouteFallback />}>
        <PuzzlePlayerPage />
      </Suspense>
    </PuzzleProgressProvider>
  );
}

export default PuzzlePlayerRoute;
