import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Position, PieceColor, Move, GameState } from '@shared/types';
import { getLegalMoves, makeMove, createInitialGameState, createInitialBoard, getBoardAtMove } from '@shared/engine';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import Board from './Board';
import type { Arrow } from './Board';
import MoveHistory from './MoveHistory';
import GameOverModal from './GameOverModal';
import Header from './Header';

export default function LocalGame() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(0, 0));
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [viewAs, setViewAs] = useState<PieceColor>('white');
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null } | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!gameState.gameOver || gameState.moveHistory.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const moveCount = gameState.moveHistory.length;
      const current = viewMoveIndex ?? moveCount - 1;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setViewMoveIndex(Math.max(-1, current - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setViewMoveIndex(Math.min(moveCount - 1, current + 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setViewMoveIndex(-1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setViewMoveIndex(moveCount - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, viewMoveIndex]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (gameState.gameOver) return;
    const piece = gameState.board[pos.row][pos.col];

    if (selectedSquare) {
      const isLegal = legalMoves.some(m => m.row === pos.row && m.col === pos.col);
      if (isLegal) {
        const newState = makeMove(gameState, selectedSquare, pos);
        if (newState) {
          setGameState(newState);
          setSelectedSquare(null);
          setLegalMoves([]);
          setArrows([]);
          const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
          if (newState.isCheck) playCheckSound();
          else if (lastMove.captured) playCaptureSound();
          else playMoveSound();
          if (newState.gameOver) {
            const reason = newState.isCheckmate ? 'checkmate' : newState.isStalemate ? 'stalemate' : 'draw';
            setGameOverInfo({ reason, winner: newState.winner });
            playGameOverSound();
          }
        }
        return;
      }
    }

    if (piece && piece.color === gameState.turn) {
      setSelectedSquare(pos);
      setLegalMoves(getLegalMoves(gameState.board, pos));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [gameState, selectedSquare, legalMoves]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    if (gameState.gameOver) return;
    const piece = gameState.board[from.row][from.col];
    if (!piece || piece.color !== gameState.turn) return;
    const legal = getLegalMoves(gameState.board, from);
    if (legal.some(m => m.row === to.row && m.col === to.col)) {
      const newState = makeMove(gameState, from, to);
      if (newState) {
        setGameState(newState);
        setSelectedSquare(null);
        setLegalMoves([]);
        setArrows([]);
        const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
        if (newState.isCheck) playCheckSound();
        else if (lastMove.captured) playCaptureSound();
        else playMoveSound();
        if (newState.gameOver) {
          const reason = newState.isCheckmate ? 'checkmate' : newState.isStalemate ? 'stalemate' : 'draw';
          setGameOverInfo({ reason, winner: newState.winner });
          playGameOverSound();
        }
      }
    }
  }, [gameState]);

  const handleReset = () => {
    setGameState(createInitialGameState(0, 0));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setArrows([]);
    setViewMoveIndex(null);
  };

  const getLastMove = (): Move | null => {
    if (gameState.moveHistory.length === 0) return null;
    const idx = viewMoveIndex ?? gameState.moveHistory.length - 1;
    if (idx < 0) return null;
    return gameState.moveHistory[idx];
  };

  const getCheckSquare = (): Position | null => {
    if (!gameState.isCheck) return null;
    if (viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1) return null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.type === 'K' && piece.color === gameState.turn) {
          return { row, col };
        }
      }
    }
    return null;
  };

  const getDisplayBoard = () => {
    if (viewMoveIndex === null || viewMoveIndex === gameState.moveHistory.length - 1) {
      return gameState.board;
    }
    if (viewMoveIndex === -1) return createInitialBoard();
    return getBoardAtMove(createInitialBoard(), gameState.moveHistory, viewMoveIndex);
  };

  const handleMoveClick = useCallback((index: number) => {
    if (index === gameState.moveHistory.length - 1 && viewMoveIndex === null) return;
    setViewMoveIndex(index);
  }, [gameState.moveHistory.length, viewMoveIndex]);

  const colorName = (c: PieceColor) => t(c === 'white' ? 'common.white' : 'common.black');

  const isViewingHistory = viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1;

  return (
    <div className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
      <Header subtitle={t('local.title')} />

      <main className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 w-full max-w-[1100px]">
          <div className="flex flex-col items-center gap-2 sm:gap-3 w-full lg:flex-1 lg:max-w-[calc(100vh-140px)] max-w-[720px]">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-text-dim">{t('local.view_as')}</span>
              <button
                onClick={() => setViewAs('white')}
                className={`px-3 py-1 rounded ${viewAs === 'white' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
              >
                {t('common.white')}
              </button>
              <button
                onClick={() => setViewAs('black')}
                className={`px-3 py-1 rounded ${viewAs === 'black' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
              >
                {t('common.black')}
              </button>
            </div>

            <Board
              board={getDisplayBoard()}
              playerColor={viewAs}
              isMyTurn={!isViewingHistory}
              legalMoves={isViewingHistory ? [] : legalMoves}
              selectedSquare={isViewingHistory ? null : selectedSquare}
              lastMove={getLastMove()}
              isCheck={isViewingHistory ? false : gameState.isCheck}
              checkSquare={getCheckSquare()}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              disabled={gameState.gameOver || isViewingHistory}
              arrows={arrows}
              onArrowsChange={setArrows}
            />

            <div className={`
              rounded-lg px-6 py-2.5 text-center font-semibold text-base
              ${gameState.gameOver
                ? 'bg-accent/20 text-accent border border-accent/30'
                : gameState.turn === 'white'
                  ? 'bg-white/10 text-text-bright border border-white/20'
                  : 'bg-gray-800/50 text-text-bright border border-gray-600/30'
              }
            `}>
              {gameState.gameOver
                ? gameState.winner ? t('local.wins', { color: colorName(gameState.winner) }) : t('common.draw')
                : t('local.turn', { color: colorName(gameState.turn) })
              }
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:w-72 w-full max-w-[720px]">
            <MoveHistory
              moves={gameState.moveHistory}
              initialBoard={createInitialBoard()}
              currentMoveIndex={viewMoveIndex ?? undefined}
              onMoveClick={gameState.gameOver ? handleMoveClick : undefined}
            />

            {gameState.gameOver && gameState.moveHistory.length > 0 && (
              <div className="text-center text-xs text-text-dim">
                Use arrow keys to navigate moves
              </div>
            )}

            {gameState.gameOver && gameState.moveHistory.length > 0 && (
              <button
                onClick={() => {
                  const movesParam = encodeURIComponent(JSON.stringify(gameState.moveHistory));
                  const result = gameState.winner || 'draw';
                  const reason = gameOverInfo?.reason || 'unknown';
                  navigate(`/analysis/local?moves=${movesParam}&result=${result}&reason=${reason}`);
                }}
                className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-sm rounded-lg border border-blue-600/30 transition-colors"
              >
                🔍 {t('analysis.analyze')}
              </button>
            )}

            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 bg-surface-alt hover:bg-surface-hover text-text-bright text-sm rounded-lg border border-surface-hover transition-colors"
            >
              ↺ {t('common.new_game')}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-light text-white text-sm rounded-lg transition-colors"
            >
              {t('local.play_online')}
            </button>
          </div>
        </div>
      </main>

      {gameOverInfo && (
        <GameOverModal
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={viewAs}
          onRematch={handleReset}
          onNewGame={() => navigate('/')}
          onAnalyze={gameState.moveHistory.length > 0
            ? () => {
                const movesParam = encodeURIComponent(JSON.stringify(gameState.moveHistory));
                const result = gameState.winner || 'draw';
                const reason = gameOverInfo.reason;
                navigate(`/analysis/local?moves=${movesParam}&result=${result}&reason=${reason}`);
              }
            : undefined
          }
        />
      )}
    </div>
  );
}
