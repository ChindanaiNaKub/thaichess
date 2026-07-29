import type { LessonScene } from '../lib/lessons';
import Board from './Board';

export function CoursePreviewBoard({ scene }: { scene: LessonScene }) {
  return (
    <div className="mx-auto w-full max-w-[220px]">
      <Board
        board={scene.board}
        playerColor={scene.playerColor}
        isMyTurn={false}
        legalMoves={[]}
        selectedSquare={null}
        lastMove={null}
        isCheck={false}
        checkSquare={null}
        onSquareClick={() => {}}
        onPieceDrop={() => {}}
        disabled
        squareHighlights={scene.highlights}
        squareAnnotations={scene.annotations}
        arrows={scene.arrows}
      />
    </div>
  );
}
