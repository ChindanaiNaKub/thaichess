import type { Move, PieceColor, PieceType } from '@shared/types';

const CAPTURE_DISPLAY_ORDER: PieceType[] = ['R', 'N', 'S', 'M', 'PM', 'P'];
const CAPTURE_VALUES: Record<PieceType, number> = {
  K: 0,
  R: 5,
  N: 3,
  S: 2.5,
  M: 2,
  PM: 2,
  P: 1,
};

function getMoveColor(index: number): PieceColor {
  return index % 2 === 0 ? 'white' : 'black';
}

export function getCapturedSummary(moves: Move[], captorColor: PieceColor) {
  const capturedPieces = moves
    .filter((move, index) => move.captured && getMoveColor(index) === captorColor)
    .map((move) => move.captured!.type);
  const capturedColor: PieceColor = captorColor === 'white' ? 'black' : 'white';
  const pieces = CAPTURE_DISPLAY_ORDER
    .map((type) => ({
      type,
      count: capturedPieces.filter((piece) => piece === type).length,
      capturedColor,
    }))
    .filter((entry) => entry.count > 0);
  const material = capturedPieces.reduce((sum, piece) => sum + CAPTURE_VALUES[piece], 0);

  return {
    pieces,
    material: material > 0 ? material : null,
  };
}
