import { PuzzleProgressProvider } from '../lib/puzzleProgress';
import { PuzzleLessonsPage } from '../components/PuzzleLessonsPage';

export default function PuzzleLessonsRouteContent() {
  return (
    <PuzzleProgressProvider>
      <PuzzleLessonsPage />
    </PuzzleProgressProvider>
  );
}
