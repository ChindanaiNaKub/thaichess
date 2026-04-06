import { lazy, Suspense } from 'react';
import { PuzzleProgressProvider } from '../lib/puzzleProgress';

const PuzzleStreakPage = lazy(() => import('../components/PuzzlePage').then((module) => ({
  default: module.PuzzleStreakPage,
})));

function PuzzleRouteFallback() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-text-dim">Loading puzzles...</p>
      </div>
    </div>
  );
}

export function PuzzleStreakRoute() {
  return (
    <PuzzleProgressProvider>
      <Suspense fallback={<PuzzleRouteFallback />}>
        <PuzzleStreakPage />
      </Suspense>
    </PuzzleProgressProvider>
  );
}

export default PuzzleStreakRoute;
