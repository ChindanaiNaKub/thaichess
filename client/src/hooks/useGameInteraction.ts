import { useState, useCallback, useEffect, useRef } from 'react';
import type { Position, PieceColor, ClientGameState } from '@shared/types';
import { getLegalMoves } from '@shared/engine';
import {
  emptyBoardSelection,
  includesPosition,
  samePosition,
  selectBoardSquare,
} from '../lib/boardSession';
import { socket } from '../lib/socket';

interface UseGameInteractionOptions {
  gameState: ClientGameState | null;
  playerColor: PieceColor | null;
  isMyTurn: boolean;
}

interface PremoveState {
  from: Position;
  to: Position;
}

interface UseGameInteractionReturn {
  selectedSquare: Position | null;
  legalMoves: Position[];
  premove: PremoveState | null;
  handleSquareClick: (pos: Position) => void;
  handlePieceDrop: (from: Position, to: Position) => void;
  cancelPremove: () => void;
  clearSelection: () => void;
}

/**
 * Hook for handling game interactions (clicks, drag-drop, premove).
 * Encapsulates move validation and socket emission logic.
 */
export function useGameInteraction(options: UseGameInteractionOptions): UseGameInteractionReturn {
  const { gameState, playerColor, isMyTurn } = options;

  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [premove, setPremove] = useState<PremoveState | null>(null);

  // Track latest state without triggering re-renders
  const gameStateRef = useRef(gameState);
  const playerColorRef = useRef(playerColor);
  const legalMovesRef = useRef(legalMoves);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    playerColorRef.current = playerColor;
  }, [playerColor]);

  useEffect(() => {
    legalMovesRef.current = legalMoves;
  }, [legalMoves]);

  const applySelection = (selection: ReturnType<typeof emptyBoardSelection>) => {
    setSelectedSquare(selection.selectedSquare);
    setLegalMoves(selection.legalMoves);
  };

  const handleSquareClick = useCallback((pos: Position) => {
    const state = gameStateRef.current;
    const color = playerColorRef.current;
    const moves = legalMovesRef.current;

    if (!state || !color || state.status !== 'playing') return;

    const piece = state.board[pos.row][pos.col];

    // Pre-move logic: when it's not our turn, allow setting a premove
    if (!isMyTurn && !state.gameOver) {
      if (selectedSquare) {
        if (!samePosition(pos, selectedSquare)) {
          const fromPiece = state.board[selectedSquare.row][selectedSquare.col];
          if (fromPiece && fromPiece.color === color) {
            setPremove({ from: selectedSquare, to: pos });
            applySelection(emptyBoardSelection());
            return;
          }
        }
      }

      if (piece && piece.color === color) {
        applySelection(selectBoardSquare(state.board, pos));
        setPremove(null);
      } else {
        applySelection(emptyBoardSelection());
      }
      return;
    }

    // Normal move logic
    if (selectedSquare) {
      if (includesPosition(moves, pos)) {
        socket.emit('make_move', { from: selectedSquare, to: pos });
        applySelection(emptyBoardSelection());
        return;
      }
    }

    if (piece && piece.color === color && isMyTurn) {
      applySelection(selectBoardSquare(state.board, pos));
    } else {
      applySelection(emptyBoardSelection());
    }
  }, [isMyTurn, selectedSquare]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    const state = gameStateRef.current;
    const color = playerColorRef.current;

    if (!state || !color) return;

    // Pre-move via drag
    if (!isMyTurn && state.status === 'playing' && !state.gameOver) {
      const piece = state.board[from.row][from.col];
      if (piece && piece.color === color) {
        setPremove({ from, to });
        applySelection(emptyBoardSelection());
        return;
      }
    }

    if (!isMyTurn) return;
    const legal = getLegalMoves(state.board, from);
    if (includesPosition(legal, to)) {
      socket.emit('make_move', { from, to });
      applySelection(emptyBoardSelection());
    }
  }, [isMyTurn]);

  const cancelPremove = useCallback(() => {
    setPremove(null);
  }, []);

  const clearSelection = useCallback(() => {
    applySelection(emptyBoardSelection());
  }, []);

  return {
    selectedSquare,
    legalMoves,
    premove,
    handleSquareClick,
    handlePieceDrop,
    cancelPremove,
    clearSelection,
  };
}
