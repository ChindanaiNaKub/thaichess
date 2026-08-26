import { isInCheck } from '@shared/engine';
import type { GameState, Position } from '@shared/types';
import type { LessonScene } from '../lib/lessons';

export function shouldLogLessonDebug(): boolean {
  if (typeof window === 'undefined') return false;
  return import.meta.env.DEV || window.location.hostname === 'localhost';
}

export function createLessonGameState(scene: LessonScene): GameState {
  const board = scene.board.map(row => row.map(piece => (piece ? { ...piece } : null)));
  return {
    board,
    turn: scene.toMove,
    moveHistory: [],
    lastMove: null,
    isCheck: isInCheck(board, scene.toMove),
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    gameOver: false,
    winner: null,
    resultReason: null,
    counting: null,
    whiteTime: 0,
    blackTime: 0,
    lastMoveTime: Date.now(),
    moveCount: 0,
  };
}

export function getPublicPuzzleTitle(title: string): string {
  return title
    .replace(/\s*\([0-9a-f]{8}\s*@\s*ply\s*\d+\)$/i, '')
    .replace(/^Real-Game\s+/i, '')
    .trim();
}


export function formatMoveLabel(move: { from: Position; to: Position }): string {
  const toSquare = (pos: Position) => `${String.fromCharCode(97 + pos.col)}${pos.row + 1}`;
  return `${toSquare(move.from)}-${toSquare(move.to)}`;
}

