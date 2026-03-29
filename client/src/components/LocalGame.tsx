import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Position, PieceColor, Move, GameState } from '@shared/types';
import {
  getLegalMoves, makeMove, createInitialGameState, createInitialBoard, getBoardAtMove,
  startCounting, stopCounting,
} from '@shared/engine';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import { buildInlineAnalysisRoute } from '../lib/analysis';
import { getCapturedSummary } from '../lib/capturedSummary';
import AppearanceSettingsButton from './AppearanceSettingsButton';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import MoveHistory from './MoveHistory';
import GameOverModal from './GameOverModal';
import GameOverPanel from './GameOverPanel';
import Clock from './Clock';
import InGameShell from './InGameShell';

const DEFAULT_PLAY_TIME_MS = 10 * 60 * 1000;
const LOCAL_CLOCK_TICK_MS = 500;

export default function LocalGame() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [viewAs, setViewAs] = useState<PieceColor>('white');
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null } | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [viewMoveIndex, setViewMoveIndex] = useState<number | null>(null);
  const moveCountRef = useRef(gameState.moveHistory.length);

  useEffect(() => {
    if (gameState.moveHistory.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const moveCount = gameState.moveHistory.length;
      const current = viewMoveIndex ?? moveCount - 1;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setViewMoveIndex(Math.max(-1, current - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(moveCount - 1, current + 1);
        setViewMoveIndex(next >= moveCount - 1 ? null : next);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setViewMoveIndex(-1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setViewMoveIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, viewMoveIndex]);

  useEffect(() => {
    if (gameOverInfo) setShowGameOverModal(true);
  }, [gameOverInfo]);

  useEffect(() => {
    const previousMoveCount = moveCountRef.current;
    const currentMoveCount = gameState.moveHistory.length;

    if (!gameState.gameOver && currentMoveCount !== previousMoveCount && viewMoveIndex !== null) {
      setViewMoveIndex(null);
    }

    moveCountRef.current = currentMoveCount;
  }, [gameState.gameOver, gameState.moveHistory.length, viewMoveIndex]);

  useEffect(() => {
    if (gameState.gameOver) return;

    const interval = setInterval(() => {
      let timeoutWinner: PieceColor | null = null;

      setGameState((prev) => {
        if (prev.gameOver) return prev;

        const now = Date.now();
          const elapsed = now - prev.lastMoveTime;
          if (elapsed <= 0) return prev;

          if (prev.turn === 'white') {
            const whiteTime = Math.max(0, prev.whiteTime - elapsed);
            if (whiteTime === 0) {
              timeoutWinner = 'black';
              return { ...prev, whiteTime: 0, lastMoveTime: now, gameOver: true, winner: 'black', resultReason: 'timeout', counting: null };
            }
            return { ...prev, whiteTime, lastMoveTime: now };
          }

          const blackTime = Math.max(0, prev.blackTime - elapsed);
          if (blackTime === 0) {
            timeoutWinner = 'white';
            return { ...prev, blackTime: 0, lastMoveTime: now, gameOver: true, winner: 'white', resultReason: 'timeout', counting: null };
          }
          return { ...prev, blackTime, lastMoveTime: now };
      });

      if (timeoutWinner) {
        setGameOverInfo({ reason: 'timeout', winner: timeoutWinner });
        playGameOverSound();
      }
    }, LOCAL_CLOCK_TICK_MS);

    return () => clearInterval(interval);
  }, [gameState.gameOver]);

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
            const reason = newState.resultReason ?? 'draw';
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
          const reason = newState.resultReason ?? 'draw';
          setGameOverInfo({ reason, winner: newState.winner });
          playGameOverSound();
        }
      }
    }
  }, [gameState]);

  const handleReset = () => {
    setGameState(createInitialGameState(DEFAULT_PLAY_TIME_MS, DEFAULT_PLAY_TIME_MS));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setShowGameOverModal(false);
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

  const getVisibleMoves = () => {
    if (viewMoveIndex === null || viewMoveIndex === gameState.moveHistory.length - 1) {
      return gameState.moveHistory;
    }
    if (viewMoveIndex < 0) return [];
    return gameState.moveHistory.slice(0, viewMoveIndex + 1);
  };

  const handleMoveClick = useCallback((index: number) => {
    const latestIndex = gameState.moveHistory.length - 1;
    if (index === latestIndex) {
      setViewMoveIndex(null);
      return;
    }
    setViewMoveIndex(index);
  }, [gameState.moveHistory.length, viewMoveIndex]);

  const colorName = (c: PieceColor) => t(c === 'white' ? 'common.white' : 'common.black');

  const isViewingHistory = viewMoveIndex !== null && viewMoveIndex !== gameState.moveHistory.length - 1;
  const topColor: PieceColor = viewAs === 'white' ? 'black' : 'white';
  const countingLabel = gameState.counting
    ? !gameState.counting.active
      ? t('game.counting_available', {
        type: t(gameState.counting.type === 'board_honor' ? 'game.counting_board_honor' : 'game.counting_pieces_honor'),
        color: colorName(gameState.counting.countingColor),
      })
      : gameState.counting.finalAttackPending
      ? t('game.counting_final', {
        type: t(gameState.counting.type === 'board_honor' ? 'game.counting_board_honor' : 'game.counting_pieces_honor'),
      })
      : t('game.counting_status', {
        type: t(gameState.counting.type === 'board_honor' ? 'game.counting_board_honor' : 'game.counting_pieces_honor'),
        color: colorName(gameState.counting.countingColor),
        current: gameState.counting.currentCount,
        limit: gameState.counting.limit,
      })
    : null;
  const canStartLocalCounting = Boolean(gameState.counting && !gameState.gameOver && !gameState.counting.active && gameState.turn === gameState.counting.countingColor);
  const canStopLocalCounting = Boolean(gameState.counting && !gameState.gameOver && gameState.counting.active && gameState.turn === gameState.counting.countingColor);
  const moveCount = gameState.moveHistory.length;
  const visibleMoves = getVisibleMoves();
  const topCaptureSummary = getCapturedSummary(visibleMoves, topColor);
  const bottomCaptureSummary = getCapturedSummary(visibleMoves, viewAs);
  const statusText = gameState.gameOver
    ? t('game.reviewing_position')
    : t('local.turn', { color: colorName(gameState.turn) });

  const handleStartCounting = () => {
    const newState = startCounting(gameState);
    if (newState) setGameState(newState);
  };

  const handleStopCounting = () => {
    const newState = stopCounting(gameState);
    if (newState) setGameState(newState);
  };

  return (
    <>
      <InGameShell
      onHome={() => navigate('/')}
      headerMeta={
        <>
          <AppearanceSettingsButton compact />
          <span className="hidden md:inline">{t('local.title')}</span>
          <span className="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] bg-surface text-text-dim border border-surface-hover">
            {t('local.title')}
          </span>
        </>
      }
        topPanel={
          <Clock
            time={topColor === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={gameState.turn === topColor && !gameState.gameOver}
            color={topColor}
            playerName={topColor === 'white' ? t('common.white') : t('common.black')}
            subtitle={topColor === 'white' ? t('common.white') : t('common.black')}
            capturedPieces={topCaptureSummary.pieces}
            materialDelta={topCaptureSummary.material}
          />
        }
        board={
          <BoardErrorBoundary onRetry={() => window.location.reload()}>
            <Board
              board={getDisplayBoard()}
              playerColor={viewAs}
              draggableColor={gameState.turn}
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
          </BoardErrorBoundary>
        }
        bottomPanel={
          <Clock
            time={viewAs === 'white' ? gameState.whiteTime : gameState.blackTime}
            isActive={gameState.turn === viewAs && !gameState.gameOver}
            color={viewAs}
            playerName={viewAs === 'white' ? t('common.white') : t('common.black')}
            subtitle={viewAs === 'white' ? t('common.white') : t('common.black')}
            capturedPieces={bottomCaptureSummary.pieces}
            materialDelta={bottomCaptureSummary.material}
          />
        }
        statusText={statusText}
        moveCount={moveCount}
        isViewingHistory={isViewingHistory}
        showCheckBadge={gameState.isCheck}
        toolbar={
          isViewingHistory ? (
            <button
              onClick={() => setViewMoveIndex(null)}
              className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary-light normal-case tracking-normal transition-colors hover:bg-primary/15"
            >
              {t('game.return_to_live')}
            </button>
          ) : null
        }
        sidePanel={
          <>
            <div className="rounded-xl border border-surface-hover bg-surface-alt/90 px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="font-semibold text-text-bright">{statusText}</div>
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                  <span>{t('local.title')}</span>
                  <span className="rounded-full px-2 py-1 bg-surface text-text-dim border border-surface-hover">
                    {viewAs === 'white' ? t('common.white') : t('common.black')}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-surface-hover/80 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                  {t('local.view_as')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewAs('white')}
                    className={`px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${viewAs === 'white' ? 'bg-primary/15 border-primary/30 text-primary-light' : 'bg-surface-alt border-surface-hover text-text-dim hover:text-text-bright'}`}
                  >
                    {t('common.white')}
                  </button>
                  <button
                    onClick={() => setViewAs('black')}
                    className={`px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${viewAs === 'black' ? 'bg-primary/15 border-primary/30 text-primary-light' : 'bg-surface-alt border-surface-hover text-text-dim hover:text-text-bright'}`}
                  >
                    {t('common.black')}
                  </button>
                </div>
              </div>
            </div>

            {!gameState.gameOver && countingLabel && (
              <div className="rounded-xl px-4 py-3 bg-accent/10 text-accent border border-accent/30">
                <div className="text-xs uppercase tracking-wide font-semibold mb-1">
                  {t('game.counting_title')}
                </div>
                <div className="text-sm">{countingLabel}</div>
                {canStartLocalCounting && (
                  <button
                    onClick={handleStartCounting}
                    className="mt-3 w-full py-2 px-3 bg-accent/20 hover:bg-accent/30 text-accent text-sm rounded-lg border border-accent/30 transition-colors"
                  >
                    {t('game.counting_start')}
                  </button>
                )}
                {canStopLocalCounting && (
                  <button
                    onClick={handleStopCounting}
                    className="mt-3 w-full py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
                  >
                    {t('game.counting_stop')}
                  </button>
                )}
              </div>
            )}

            {/* Inline Game Over Panel (Lichess-style) */}
            {gameOverInfo && (
              <GameOverPanel
                winner={gameOverInfo.winner}
                reason={gameOverInfo.reason}
                playerColor={viewAs}
                onRematch={handleReset}
                onNewGame={() => navigate('/')}
                onAnalyze={gameState.moveHistory.length > 0
                  ? () => {
                      navigate(buildInlineAnalysisRoute({
                        source: 'local',
                        moves: gameState.moveHistory,
                        result: gameState.winner || 'draw',
                        reason: gameOverInfo.reason,
                      }));
                    }
                  : undefined
                }
              />
            )}

            <MoveHistory
              moves={gameState.moveHistory}
              initialBoard={createInitialBoard()}
              currentMoveIndex={viewMoveIndex ?? undefined}
              onMoveClick={handleMoveClick}
            />

            {gameState.moveHistory.length > 0 && (
              <div className="text-center text-[11px] text-text-dim">
                {t('game.nav_hint')}
              </div>
            )}

            {!gameState.gameOver && (
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-light text-white text-sm rounded-xl transition-colors"
              >
                {t('local.play_online')}
              </button>
            )}
          </>
        }
      />

      {gameOverInfo && showGameOverModal && (
        <GameOverModal
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={viewAs}
          onRematch={handleReset}
          onNewGame={() => navigate('/')}
          onAnalyze={gameState.moveHistory.length > 0
            ? () => {
                navigate(buildInlineAnalysisRoute({
                  source: 'local',
                  moves: gameState.moveHistory,
                  result: gameState.winner || 'draw',
                  reason: gameOverInfo.reason,
                }));
              }
            : undefined
          }
          onClose={() => setShowGameOverModal(false)}
        />
      )}
    </>
  );
}
