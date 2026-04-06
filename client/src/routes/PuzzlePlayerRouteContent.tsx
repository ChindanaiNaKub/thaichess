import { PuzzleProgressProvider } from '../lib/puzzleProgress';
import { PuzzlePlayer } from '../components/PuzzlePage';

export default function PuzzlePlayerRouteContent() {
  return (
    <PuzzleProgressProvider>
      <PuzzlePlayer />
    </PuzzleProgressProvider>
  );
}
