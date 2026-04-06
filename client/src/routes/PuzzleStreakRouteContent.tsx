import { PuzzleProgressProvider } from '../lib/puzzleProgress';
import { PuzzleStreakPage } from '../components/PuzzlePage';

export default function PuzzleStreakRouteContent() {
  return (
    <PuzzleProgressProvider>
      <PuzzleStreakPage />
    </PuzzleProgressProvider>
  );
}
