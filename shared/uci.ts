import type { Move, Position } from './types';

export function positionToUciSquare(position: Position): string {
  return `${String.fromCharCode(97 + position.col)}${position.row + 1}`;
}

export function moveToUci(move: Pick<Move, 'from' | 'to'>): string {
  return `${positionToUciSquare(move.from)}${positionToUciSquare(move.to)}`;
}

export function uciSquareToPosition(square: string): Position | null {
  if (!/^[a-h][1-8]$/.test(square)) return null;

  return {
    col: square.charCodeAt(0) - 97,
    row: Number(square[1]) - 1,
  };
}

export function parseUciMove(uci: string): { from: Position; to: Position } | null {
  const normalized = uci.trim().toLowerCase();
  if (normalized.length < 4) return null;

  const from = uciSquareToPosition(normalized.slice(0, 2));
  const to = uciSquareToPosition(normalized.slice(2, 4));

  if (!from || !to) return null;
  return { from, to };
}
