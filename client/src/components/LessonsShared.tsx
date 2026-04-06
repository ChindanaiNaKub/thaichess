import { useLayoutEffect, useRef, useState } from 'react';
import { isInCheck } from '@shared/engine';
import type { GameState, Position } from '@shared/types';
import type { LessonScene } from '../lib/lessons';
import Board from './Board';

export function shouldLogLessonDebug(): boolean {
  if (typeof window === 'undefined') return false;
  return import.meta.env.DEV || window.location.hostname === 'localhost';
}

export function useSquareFitSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const nextSize = Math.max(0, Math.floor(Math.min(rect.width, rect.height)));
      setSize(current => (current === nextSize ? current : nextSize));
    };

    const scheduleMeasure = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => scheduleMeasure())
      : null;

    resizeObserver?.observe(node);
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, []);

  return { ref, size };
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

export function formatConceptLabel(value: string): string {
  return value
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatMoveLabel(move: { from: Position; to: Position }): string {
  const toSquare = (pos: Position) => `${String.fromCharCode(97 + pos.col)}${pos.row + 1}`;
  return `${toSquare(move.from)}-${toSquare(move.to)}`;
}

export function getDifficultyBadgeClasses(difficulty: 'beginner' | 'intermediate' | 'advanced'): string {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-400/10 border-green-400/30 text-green-400';
    case 'intermediate':
      return 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400';
    case 'advanced':
      return 'bg-red-400/10 border-red-400/30 text-red-400';
    default:
      return 'bg-surface-alt border-surface-hover text-text';
  }
}

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
