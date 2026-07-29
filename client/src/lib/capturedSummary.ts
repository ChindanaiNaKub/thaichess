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
  const capturedPieces: PieceType[] = [];
  for (let index = 0; index < moves.length; index++) {
    const move = moves[index];
    if (move.captured && getMoveColor(index) === captorColor) {
      capturedPieces.push(move.captured.type);
    }
  }
  const capturedColor: PieceColor = captorColor === 'white' ? 'black' : 'white';
  const pieces: Array<{ type: PieceType; count: number; capturedColor: PieceColor }> = [];
  for (const type of CAPTURE_DISPLAY_ORDER) {
    const count = capturedPieces.filter((piece) => piece === type).length;
    if (count > 0) {
      pieces.push({ type, count, capturedColor });
    }
  }
  const material = capturedPieces.reduce((sum, piece) => sum + CAPTURE_VALUES[piece], 0);

  return {
    pieces,
    material: material > 0 ? material : null,
  };
}
