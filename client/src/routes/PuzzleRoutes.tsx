import { PuzzleProgressProvider } from '../lib/puzzleProgress';
import { PuzzlePlayer, PuzzleStreakPage } from '../components/PuzzlePage';

export function PuzzleStreakRoute() {
  return (
    <PuzzleProgressProvider>
      <PuzzleStreakPage />
    </PuzzleProgressProvider>
  );
}

export function PuzzlePlayerRoute() {
  return (
    <PuzzleProgressProvider>
      <PuzzlePlayer />
    </PuzzleProgressProvider>
  );
}
