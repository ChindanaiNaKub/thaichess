import type { Board, Move, PieceColor, Position } from '@shared/types';
import { createInitialBoard, getBoardAtMove, getLegalMoves } from '@shared/engine';

export type BoardNavAction = 'back' | 'forward' | 'start' | 'end';

/** How End / latest-forward map onto `viewMoveIndex`. */
export type ViewIndexMode =
  /** Live tip is `null` (BotGame / LocalGame during play scrubbing). */
  | 'liveNull'
  /** Always keep an explicit index including the final ply (Spectator review). */
  | 'explicitIndex';

export type BoardSelection = {
  selectedSquare: Position | null;
  legalMoves: Position[];
};

export type CheckSquareState = {
  board: Board;
  turn: PieceColor;
  isCheck: boolean;
};

export type ViewableGameState = {
  board: Board;
  turn: PieceColor;
  isCheck: boolean;
  moveHistory: Move[];
};

export function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function includesPosition(positions: Position[], pos: Position): boolean {
  return positions.some((candidate) => samePosition(candidate, pos));
}

export function emptyBoardSelection(): BoardSelection {
  return { selectedSquare: null, legalMoves: [] };
}

export function selectBoardSquare(board: Board, pos: Position): BoardSelection {
  return {
    selectedSquare: pos,
    legalMoves: getLegalMoves(board, pos),
  };
}

export function findKingInCheckSquare(state: CheckSquareState): Position | null {
  if (!state.isCheck) return null;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = state.board[row][col];
      if (piece && piece.type === 'K' && piece.color === state.turn) {
        return { row, col };
      }
    }
  }

  return null;
}

export function isLiveViewIndex(viewMoveIndex: number | null, moveCount: number): boolean {
  return viewMoveIndex === null || viewMoveIndex === moveCount - 1;
}

export function isViewingHistoryIndex(viewMoveIndex: number | null, moveCount: number): boolean {
  return !isLiveViewIndex(viewMoveIndex, moveCount);
}

export function getCheckSquareForView(
  state: ViewableGameState | null | undefined,
  viewMoveIndex: number | null,
): Position | null {
  if (!state?.isCheck) return null;
  if (isViewingHistoryIndex(viewMoveIndex, state.moveHistory.length)) return null;
  return findKingInCheckSquare(state);
}

export function getDisplayBoardForView(
  state: Pick<ViewableGameState, 'board' | 'moveHistory'> | null | undefined,
  viewMoveIndex: number | null,
  options?: { forceLive?: boolean },
): Board {
  if (!state) return createInitialBoard();
  if (options?.forceLive || isLiveViewIndex(viewMoveIndex, state.moveHistory.length)) {
    return state.board;
  }
  // After the live-index check, viewMoveIndex is a historical ply (including -1).
  if (viewMoveIndex === null || viewMoveIndex === -1) return createInitialBoard();
  return getBoardAtMove(createInitialBoard(), state.moveHistory, viewMoveIndex);
}

export function getVisibleMovesForView(
  moveHistory: Move[] | undefined,
  viewMoveIndex: number | null,
  options?: { forceLive?: boolean },
): Move[] {
  if (!moveHistory) return [];
  if (options?.forceLive || isLiveViewIndex(viewMoveIndex, moveHistory.length)) {
    return moveHistory;
  }
  if (viewMoveIndex === null || viewMoveIndex < 0) return [];
  return moveHistory.slice(0, viewMoveIndex + 1);
}

/**
 * Resolve a move-history click into the next view index.
 * Clicking the latest ply returns to live (`null`) for Bot/Local.
 */
export function viewMoveIndexFromHistoryClick(index: number, moveCount: number): number | null {
  if (index === moveCount - 1) return null;
  return index;
}

export function scrubViewMoveIndex(
  viewMoveIndex: number | null,
  moveCount: number,
  action: BoardNavAction,
  mode: ViewIndexMode = 'liveNull',
): number | null {
  const current = viewMoveIndex ?? moveCount - 1;

  switch (action) {
    case 'back':
      return Math.max(-1, current - 1);
    case 'forward': {
      const next = Math.min(moveCount - 1, current + 1);
      if (mode === 'liveNull' && next >= moveCount - 1) return null;
      return next;
    }
    case 'start':
      return -1;
    case 'end':
      return mode === 'liveNull' ? null : moveCount - 1;
    default:
      return viewMoveIndex;
  }
}

export function matchBoardNavKey(key: string): BoardNavAction | null {
  if (key === 'ArrowLeft' || key === 'ArrowUp') return 'back';
  if (key === 'ArrowRight' || key === 'ArrowDown') return 'forward';
  if (key === 'Home') return 'start';
  if (key === 'End') return 'end';
  return null;
}

export type BoardNavHandlers = {
  onBack: () => void;
  onForward: () => void;
  onStart: () => void;
  onEnd: () => void;
};

export function applyBoardNavAction(action: BoardNavAction, handlers: BoardNavHandlers): void {
  switch (action) {
    case 'back':
      handlers.onBack();
      return;
    case 'forward':
      handlers.onForward();
      return;
    case 'start':
      handlers.onStart();
      return;
    case 'end':
      handlers.onEnd();
      return;
  }
}

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}
