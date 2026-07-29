import { useState, useCallback, useEffect, useRef } from 'react';
import type { Position, PieceColor, ClientGameState } from '@shared/types';
import { getLegalMoves } from '@shared/engine';
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

  const handleSquareClick = useCallback((pos: Position) => {
    const state = gameStateRef.current;
    const color = playerColorRef.current;
    const moves = legalMovesRef.current;

    if (!state || !color || state.status !== 'playing') return;

    const piece = state.board[pos.row][pos.col];

    // Pre-move logic: when it's not our turn, allow setting a premove
    if (!isMyTurn && !state.gameOver) {
      if (selectedSquare) {
        if (pos.row !== selectedSquare.row || pos.col !== selectedSquare.col) {
          const fromPiece = state.board[selectedSquare.row][selectedSquare.col];
          if (fromPiece && fromPiece.color === color) {
            setPremove({ from: selectedSquare, to: pos });
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
          }
        }
      }

      if (piece && piece.color === color) {
        setSelectedSquare(pos);
        setLegalMoves(getLegalMoves(state.board, pos));
        setPremove(null);
      } else {
        setSelectedSquare(null);
        setLegalMoves([]);
      }
      return;
    }

    // Normal move logic
    if (selectedSquare) {
      const isLegal = moves.some(m => m.row === pos.row && m.col === pos.col);
      if (isLegal) {
        socket.emit('make_move', { from: selectedSquare, to: pos });
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    if (piece && piece.color === color && isMyTurn) {
      setSelectedSquare(pos);
      setLegalMoves(getLegalMoves(state.board, pos));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
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
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    if (!isMyTurn) return;
    const legal = getLegalMoves(state.board, from);
    if (legal.some(m => m.row === to.row && m.col === to.col)) {
      socket.emit('make_move', { from, to });
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [isMyTurn]);

  const cancelPremove = useCallback(() => {
    setPremove(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
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
