import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Position, Move, GameState } from '@shared/types';
import { getLegalMoves, makeMove } from '@shared/engine';
import { PUZZLES } from '@shared/puzzles';
import { createGameStateFromPuzzle, getForcingMoves, getPliesRemaining, isThemeSatisfied } from '@shared/puzzleSolver';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Header from './Header';
import Board from './Board';

type PuzzleStatus = 'playing' | 'success' | 'failed';

function PuzzleListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const completedPuzzles = new Set(
    JSON.parse(localStorage.getItem('completedPuzzles') || '[]') as number[]
  );

  const filteredPuzzles = filter === 'all'
    ? PUZZLES
    : PUZZLES.filter(p => p.difficulty === filter);

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-text';
    }
  };

  const getDifficultyBg = (d: string) => {
    switch (d) {
      case 'beginner': return 'bg-green-400/10 border-green-400/30';
      case 'intermediate': return 'bg-yellow-400/10 border-yellow-400/30';
      case 'advanced': return 'bg-red-400/10 border-red-400/30';
      default: return 'bg-surface-alt border-surface-hover';
    }
  };

  const filterLabels: Record<string, string> = {
    all: t('puzzle.all'),
    beginner: t('puzzle.beginner'),
    intermediate: t('puzzle.intermediate'),
    advanced: t('puzzle.advanced'),
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="puzzles" subtitle={t('nav.puzzles')} />

      <main id="main-content" className="flex-1 px-4 py-6 sm:py-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-bright mb-2">{t('puzzle.title')}</h2>
          <p className="text-text-dim text-sm sm:text-base">
            {t('puzzle.desc')}
          </p>
          <p className="text-primary text-sm mt-1">
            {t('puzzle.completed', { done: completedPuzzles.size, total: PUZZLES.length })}
          </p>
        </div>

        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt hover:bg-surface-hover text-text border border-surface-hover'
              }`}
            >
              {filterLabels[f]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredPuzzles.map(puzzle => (
            <button
              key={puzzle.id}
              onClick={() => navigate(`/puzzle/${puzzle.id}`)}
              className="bg-surface-alt border border-surface-hover rounded-xl p-4 sm:p-5 text-left hover:border-primary/50 transition-all hover:shadow-lg group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-text-bright group-hover:text-primary-light transition-colors text-sm sm:text-base">
                  #{puzzle.id} · {puzzle.title}
                </h3>
                {completedPuzzles.has(puzzle.id) && (
                  <span className="text-primary text-sm font-bold">✓</span>
                )}
              </div>
              <p className="text-text-dim text-xs sm:text-sm mb-3">{puzzle.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded border ${getDifficultyBg(puzzle.difficulty)} ${getDifficultyColor(puzzle.difficulty)}`}>
                  {t('puzzle.' + puzzle.difficulty)}
                </span>
                <span className="text-xs text-text-dim px-2 py-0.5 rounded bg-surface border border-surface-hover">
                  {t('theme.' + puzzle.theme)}
                </span>
                <span className="text-xs text-text-dim ml-auto">
                  {t('puzzle.to_move', { color: puzzle.toMove === 'white' ? t('common.white') : t('common.black') })}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-surface-alt hover:bg-surface-hover text-text-bright rounded-lg border border-surface-hover transition-colors text-sm sm:text-base"
          >
            {t('common.back_home')}
          </button>
        </div>
      </main>
    </div>
  );
}

function PuzzlePlayer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const puzzleId = parseInt(id || '1');
  const puzzle = PUZZLES.find(p => p.id === puzzleId);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [status, setStatus] = useState<PuzzleStatus>('playing');
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const autoReplyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (autoReplyTimeoutRef.current !== null) {
      window.clearTimeout(autoReplyTimeoutRef.current);
      autoReplyTimeoutRef.current = null;
    }

    if (puzzle) {
      setGameState(createGameStateFromPuzzle(puzzle));
      setSelectedSquare(null);
      setLegalMoves([]);
      setStatus('playing');
      setHintUsed(false);
      setShowHint(false);
    }

    return () => {
      if (autoReplyTimeoutRef.current !== null) {
        window.clearTimeout(autoReplyTimeoutRef.current);
        autoReplyTimeoutRef.current = null;
      }
    };
  }, [puzzleId]);

  const markCompleted = useCallback(() => {
    const completed = JSON.parse(localStorage.getItem('completedPuzzles') || '[]') as number[];
    if (!completed.includes(puzzleId)) {
      completed.push(puzzleId);
      localStorage.setItem('completedPuzzles', JSON.stringify(completed));
    }
  }, [puzzleId]);

  const finishPuzzle = useCallback(() => {
    setStatus('success');
    markCompleted();
    playGameOverSound();
  }, [markCompleted]);

  const queueOpponentReply = useCallback((stateAfterPlayerMove: GameState) => {
    if (!puzzle) return;

    if (isThemeSatisfied(puzzle, stateAfterPlayerMove)) {
      finishPuzzle();
      return;
    }

    const replyMoves = getForcingMoves(stateAfterPlayerMove, puzzle);
    if (!replyMoves.length) {
      setStatus('failed');
      return;
    }

    const canonicalReply = puzzle.solution[stateAfterPlayerMove.moveHistory.length];
    const replyMove = canonicalReply
      ? replyMoves.find(move =>
        move.from.row === canonicalReply.from.row &&
        move.from.col === canonicalReply.from.col &&
        move.to.row === canonicalReply.to.row &&
        move.to.col === canonicalReply.to.col,
      ) ?? replyMoves[0]
      : replyMoves[0];

    autoReplyTimeoutRef.current = window.setTimeout(() => {
      const replyState = makeMove(stateAfterPlayerMove, replyMove.from, replyMove.to);
      autoReplyTimeoutRef.current = null;

      if (!replyState) {
        setStatus('failed');
        return;
      }

      setGameState(replyState);

      const lastMove = replyState.moveHistory[replyState.moveHistory.length - 1];
      if (replyState.isCheck) playCheckSound();
      else if (lastMove.captured) playCaptureSound();
      else playMoveSound();

      if (isThemeSatisfied(puzzle, replyState)) {
        finishPuzzle();
      } else {
        const nextSolverMoves = getForcingMoves(replyState, puzzle);
        if (!nextSolverMoves.length && getPliesRemaining(puzzle, replyState) > 0) {
          setStatus('failed');
        }
      }
    }, 450);
  }, [finishPuzzle, puzzle]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (!gameState || !puzzle || status !== 'playing') return;
    if (gameState.turn !== puzzle.toMove) return;

    const piece = gameState.board[pos.row][pos.col];
    const playerColor = puzzle.toMove;

    if (selectedSquare) {
      const isLegal = legalMoves.some(m => m.row === pos.row && m.col === pos.col);
      if (isLegal) {
        const forcingMoves = getForcingMoves(gameState, puzzle);
        const isCorrect = forcingMoves.some(move =>
          move.from.row === selectedSquare.row &&
          move.from.col === selectedSquare.col &&
          move.to.row === pos.row &&
          move.to.col === pos.col,
        );

        if (isCorrect) {
          const newState = makeMove(gameState, selectedSquare, pos);
          if (newState) {
            setGameState(newState);
            setSelectedSquare(null);
            setLegalMoves([]);

            const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
            if (newState.isCheck) playCheckSound();
            else if (lastMove.captured) playCaptureSound();
            else playMoveSound();

            queueOpponentReply(newState);
          }
        } else {
          setStatus('failed');
          setSelectedSquare(null);
          setLegalMoves([]);
        }
        return;
      }
    }

    if (piece && piece.color === playerColor) {
      setSelectedSquare(pos);
      setLegalMoves(getLegalMoves(gameState.board, pos));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [gameState, puzzle, selectedSquare, legalMoves, status, queueOpponentReply]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    if (!gameState || !puzzle || status !== 'playing') return;
    if (gameState.turn !== puzzle.toMove) return;
    const piece = gameState.board[from.row][from.col];
    if (!piece || piece.color !== puzzle.toMove) return;

    const legal = getLegalMoves(gameState.board, from);
    if (!legal.some(m => m.row === to.row && m.col === to.col)) return;

    const forcingMoves = getForcingMoves(gameState, puzzle);
    const isCorrect = forcingMoves.some(move =>
      move.from.row === from.row &&
      move.from.col === from.col &&
      move.to.row === to.row &&
      move.to.col === to.col,
    );

    if (isCorrect) {
      const newState = makeMove(gameState, from, to);
      if (newState) {
        setGameState(newState);
        setSelectedSquare(null);
        setLegalMoves([]);

        const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
        if (newState.isCheck) playCheckSound();
        else if (lastMove.captured) playCaptureSound();
        else playMoveSound();

        queueOpponentReply(newState);
      }
    } else {
      setStatus('failed');
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [gameState, puzzle, status, queueOpponentReply]);

  const handleRetry = () => {
    if (autoReplyTimeoutRef.current !== null) {
      window.clearTimeout(autoReplyTimeoutRef.current);
      autoReplyTimeoutRef.current = null;
    }
    if (puzzle) {
      setGameState(createGameStateFromPuzzle(puzzle));
      setSelectedSquare(null);
      setLegalMoves([]);
      setStatus('playing');
      setShowHint(false);
    }
  };

  const handleHint = () => {
    if (!puzzle || status !== 'playing') return;
    setHintUsed(true);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 3000);
  };

  const getNextPuzzle = (): number | null => {
    const idx = PUZZLES.findIndex(p => p.id === puzzleId);
    if (idx >= 0 && idx < PUZZLES.length - 1) return PUZZLES[idx + 1].id;
    return null;
  };

  const getPrevPuzzle = (): number | null => {
    const idx = PUZZLES.findIndex(p => p.id === puzzleId);
    if (idx > 0) return PUZZLES[idx - 1].id;
    return null;
  };

  const getLastMove = (): Move | null => {
    if (!gameState || gameState.moveHistory.length === 0) return null;
    return gameState.moveHistory[gameState.moveHistory.length - 1];
  };

  const getCheckSquare = (): Position | null => {
    if (!gameState?.isCheck) return null;
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

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-bright mb-4">{t('puzzle.not_found')}</h2>
          <button
            onClick={() => navigate('/puzzles')}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            {t('puzzle.back')}
          </button>
        </div>
      </div>
    );
  }

  const hintMove = gameState && gameState.turn === puzzle.toMove
    ? getForcingMoves(gameState, puzzle)[0]
    : undefined;
  const hintSquare = showHint && hintMove ? hintMove.from : null;
  const nextPuzzle = getNextPuzzle();
  const prevPuzzle = getPrevPuzzle();
  const solverColorLabel = puzzle.toMove === 'white' ? t('common.white') : t('common.black');
  const currentTurn = gameState?.turn ?? puzzle.toMove;
  const currentTurnLabel = currentTurn === 'white' ? t('common.white') : t('common.black');
  const isSolverTurn = status === 'playing' && gameState?.turn === puzzle.toMove;
  const currentStep = gameState ? Math.min(gameState.moveHistory.length + 1, puzzle.solution.length) : 1;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        active="puzzles"
        right={
          <button
            onClick={() => navigate('/puzzles')}
            className="text-text-dim hover:text-text-bright transition-colors text-sm"
          >
            {t('puzzle.all_puzzles')}
          </button>
        }
      />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 w-full max-w-[1100px]">
          <div className="flex flex-col items-center gap-3 w-full lg:flex-1 lg:max-w-[calc(100vh-140px)] max-w-[720px]">
            {gameState && (
              <BoardErrorBoundary onRetry={() => window.location.reload()}>
                <Board
                  board={gameState.board}
                  playerColor={puzzle.toMove}
                  isMyTurn={status === 'playing' && gameState.turn === puzzle.toMove}
                  legalMoves={legalMoves}
                  selectedSquare={selectedSquare || hintSquare}
                  lastMove={getLastMove()}
                  isCheck={gameState.isCheck}
                  checkSquare={getCheckSquare()}
                  onSquareClick={handleSquareClick}
                  onPieceDrop={handlePieceDrop}
                  disabled={status !== 'playing' || gameState.turn !== puzzle.toMove}
                />
              </BoardErrorBoundary>
            )}
          </div>

          <div className="flex flex-col gap-3 lg:w-80 w-full max-w-[720px]">
            <div className="bg-surface-alt border border-surface-hover rounded-xl p-4 sm:p-5">
              <div className="flex items-start justify-between mb-1 gap-2">
                <h3 className="text-base sm:text-lg font-bold text-text-bright">
                  #{puzzle.id} · {puzzle.title}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${
                  puzzle.difficulty === 'beginner' ? 'bg-green-400/10 border-green-400/30 text-green-400' :
                  puzzle.difficulty === 'intermediate' ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' :
                  'bg-red-400/10 border-red-400/30 text-red-400'
                }`}>
                  {t('puzzle.' + puzzle.difficulty)}
                </span>
              </div>
              <p className="text-text-dim text-xs sm:text-sm mb-3">{puzzle.description}</p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-dim">
                <span className="px-2 py-0.5 rounded bg-surface border border-surface-hover">{t('theme.' + puzzle.theme)}</span>
                <span>{t('puzzle.to_move', { color: currentTurnLabel })}</span>
                <span className="ml-auto">{t('puzzle.source')}: {puzzle.source}</span>
              </div>
            </div>

            {status === 'playing' && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-center">
                <p className="text-primary-light font-semibold text-sm">
                  {isSolverTurn
                    ? t('puzzle.find_best', { color: solverColorLabel })
                    : t('puzzle.to_move', { color: currentTurnLabel })}
                </p>
                <p className="text-text-dim text-xs mt-1">
                  {t('puzzle.step', { current: currentStep, total: puzzle.solution.length })}
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="bg-primary/20 border border-primary/30 rounded-lg px-4 py-4 text-center animate-slideUp">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-primary-light font-bold text-lg">{t('puzzle.correct')}</p>
                <p className="text-text-dim text-sm">
                  {hintUsed ? t('puzzle.solved_hint') : t('puzzle.solved_clean')}
                </p>
                <p className="mt-3 text-left text-sm text-text leading-relaxed">
                  <span className="font-semibold text-text-bright">{t('puzzle.lesson')}:</span> {puzzle.explanation}
                </p>
              </div>
            )}

            {status === 'failed' && (
              <div className="bg-danger/20 border border-danger/30 rounded-lg px-4 py-4 text-center animate-slideUp">
                <div className="text-3xl mb-2">✗</div>
                <p className="text-danger font-bold text-lg">{t('puzzle.wrong')}</p>
                <p className="text-text-dim text-sm">{t('puzzle.wrong_desc')}</p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {status === 'playing' && (
                <button
                  onClick={handleHint}
                  disabled={showHint}
                  className="flex-1 min-w-0 py-2 px-3 bg-accent/20 hover:bg-accent/30 text-accent text-sm rounded-lg border border-accent/30 transition-colors disabled:opacity-50"
                >
                  💡 {t('puzzle.hint')}
                </button>
              )}
              {status !== 'playing' && (
                <button
                  onClick={handleRetry}
                  className="flex-1 min-w-0 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text-bright text-sm rounded-lg border border-surface-hover transition-colors"
                >
                  ↺ {t('common.retry')}
                </button>
              )}
              {status === 'success' && nextPuzzle && (
                <button
                  onClick={() => navigate(`/puzzle/${nextPuzzle}`)}
                  className="flex-1 min-w-0 py-2 px-3 bg-primary hover:bg-primary-light text-white text-sm rounded-lg transition-colors font-semibold"
                >
                  {t('puzzle.next')} →
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {prevPuzzle && (
                <button
                  onClick={() => navigate(`/puzzle/${prevPuzzle}`)}
                  className="flex-1 min-w-0 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
                >
                  ← {t('puzzle.previous')}
                </button>
              )}
              <button
                onClick={() => navigate('/puzzles')}
                className="flex-1 min-w-0 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
              >
                {t('puzzle.all_puzzles')}
              </button>
              {nextPuzzle && status !== 'success' && (
                <button
                  onClick={() => navigate(`/puzzle/${nextPuzzle}`)}
                  className="flex-1 min-w-0 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
                >
                  {t('puzzle.next')} →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export { PuzzleListPage, PuzzlePlayer };
export default PuzzleListPage;
