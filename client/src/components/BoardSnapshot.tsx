import type { Board as BoardType, Move, PieceColor } from '@shared/types';
import { useBoardAppearance } from '../lib/pieceStyle';
import PieceSVG from './PieceSVG';

interface BoardSnapshotProps {
  board: BoardType;
  playerColor: PieceColor;
  lastMove: Move | null;
  className?: string;
  size?: number;
}

export default function BoardSnapshot({
  board,
  playerColor,
  lastMove,
  className,
  size,
}: BoardSnapshotProps) {
  const { boardTheme } = useBoardAppearance();
  const flipped = playerColor === 'black';
  const squares = [];

  for (let displayRow = 0; displayRow < 8; displayRow += 1) {
    for (let displayCol = 0; displayCol < 8; displayCol += 1) {
      const row = flipped ? displayRow : 7 - displayRow;
      const col = flipped ? 7 - displayCol : displayCol;
      const piece = board[row][col];
      const isLastMoveSquare = Boolean(
        lastMove
        && ((lastMove.from.row === row && lastMove.from.col === col)
          || (lastMove.to.row === row && lastMove.to.col === col)),
      );

      squares.push(
        <div
          key={`${row}-${col}`}
          className="relative"
          style={{
            boxShadow: `inset 0 0 0 1px ${boardTheme.gridColor}`,
            background: isLastMoveSquare ? boardTheme.lastMoveBackground : 'transparent',
          }}
        >
          {piece && (
            <div className="absolute inset-[11%] flex items-center justify-center drop-shadow-[0_6px_12px_rgba(0,0,0,0.18)]">
              <PieceSVG type={piece.type} color={piece.color} className="h-full w-full" />
            </div>
          )}
        </div>,
      );
    }
  }

  return (
    <div
      className={`relative aspect-square overflow-hidden rounded-[18px] bg-[#14100d] shadow-[0_10px_28px_rgba(0,0,0,0.16)] ${className ?? ''}`}
      style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
    >
      <div
        className="relative grid h-full w-full grid-cols-8 overflow-hidden rounded-[18px]"
        style={{
          background: boardTheme.surfaceBackground,
          boxShadow: `inset 0 0 0 1px ${boardTheme.gridColor}`,
        }}
      >
        {squares}
      </div>
    </div>
  );
}
