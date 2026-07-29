import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Position, Move, GameState } from '@shared/types';
import { getLegalMoves, makeMove } from '@shared/engine';
import { ALL_PUZZLES, PUZZLES } from '@shared/puzzlesRuntime';
import { createGameStateFromPuzzle, getForcingMoves, getPliesRemaining, isThemeSatisfied } from '@shared/puzzleSolver';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import { usePuzzleProgress } from '../lib/puzzleProgress';
import { pickRandomPuzzleId, rememberRandomPuzzleVisit } from '../lib/randomPuzzles';
import { puzzleRoute, routes } from '../lib/routes';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Header from './Header';
import Board from './Board';
import MoveHistory from './MoveHistory';
import { PuzzleCoachSection as CoachSection } from './PuzzleCoachSection';
import {
  MAX_RANDOM_RESULT_HISTORY,
  buildReplayState,
  formatActivityDate,
  getCheckSquare,
  getDifficultyBadgeClasses,
  getDifficultyTextClasses,
  getLastMove,
  getPuzzleFailureDetail,
  getPuzzleIdentityBadges,
  getPublicPuzzleTitle,
  getPuzzleOriginBadgeClasses,
  getPuzzleOriginLabel,
  getPuzzleSourceLabel,
  getVerificationLabel,
  readRandomResultHistory,
  translatePuzzleContent,
  writeRandomResultHistory,
  type PuzzleStatus,
  type RandomResultEntry,
} from './PuzzleShared';

export function PuzzlePlayer() {
  return usePuzzlePlayerScreen();
}

function usePuzzlePlayerScreen() {
  const { t, lang } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { progressRecords, completedPuzzleSet, recordPuzzleVisited, recordPuzzleFailed, markPuzzleCompleted } = usePuzzleProgress();
  const { id } = useParams<{ id: string }>();
  const puzzleId = parseInt(id || '1', 10);
  const puzzle = PUZZLES.find(p => p.id === puzzleId) ?? ALL_PUZZLES.find(p => p.id === puzzleId);
  const navigationPool = puzzle?.reviewStatus === 'ship' ? PUZZLES : (puzzle ? [puzzle] : PUZZLES);
  const isRandomMode = new URLSearchParams(location.search).get('mode') === 'random';
  const autoReplyTimeoutRef = useRef<number | null>(null);
  const autoAdvanceTimeoutRef = useRef<number | null>(null);
  const [randomResultHistory, setRandomResultHistory] = useState<RandomResultEntry[]>([]);
  const recordedOutcomeRef = useRef<string | null>(null);
  const resolvedPuzzleIdRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [status, setStatus] = useState<PuzzleStatus>('playing');
  const [hintUsed, setHintUsed] = useState(false);
  const [hintStage, setHintStage] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [failureDetail, setFailureDetail] = useState<string | null>(null);
  const [reviewMoveIndex, setReviewMoveIndex] = useState<number | null>(null);
  const [randomNextPuzzleId, setRandomNextPuzzleId] = useState<number | null>(null);

  useEffect(() => {
    if (autoReplyTimeoutRef.current !== null) {
      window.clearTimeout(autoReplyTimeoutRef.current);
      autoReplyTimeoutRef.current = null;
    }
    if (autoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (puzzle) {
      setGameState(createGameStateFromPuzzle(puzzle));
      setSelectedSquare(null);
      setLegalMoves([]);
      setStatus('playing');
      setHintUsed(false);
      setHintStage(0);
      setShowHint(false);
      setFailureDetail(null);
      setReviewMoveIndex(null);
    }
    if (isRandomMode) {
      if (puzzle) {
        rememberRandomPuzzleVisit(puzzle.id, PUZZLES.length);
        setRandomNextPuzzleId(pickRandomPuzzleId(PUZZLES, puzzle.id));
      } else {
        setRandomNextPuzzleId(null);
      }
      setRandomResultHistory(readRandomResultHistory());
      recordedOutcomeRef.current = null;
    } else {
      setRandomNextPuzzleId(null);
    }
    resolvedPuzzleIdRef.current = null;

    return () => {
      if (autoReplyTimeoutRef.current !== null) {
        window.clearTimeout(autoReplyTimeoutRef.current);
        autoReplyTimeoutRef.current = null;
      }
      if (autoAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, [isRandomMode, puzzle, puzzleId]);

  useEffect(() => {
    if (!puzzle) return;
    void recordPuzzleVisited(puzzleId);
  }, [puzzle, puzzleId, recordPuzzleVisited]);

  const markCompleted = useCallback(() => {
    void markPuzzleCompleted(puzzleId);
  }, [markPuzzleCompleted, puzzleId]);

  const finishPuzzle = useCallback(() => {
    resolvedPuzzleIdRef.current = puzzleId;
    setStatus('success');
    setFailureDetail(null);
    markCompleted();
    playGameOverSound();
  }, [markCompleted, puzzleId]);

  const failPuzzle = useCallback((attemptedMove: Pick<Move, 'from' | 'to'> | null = null) => {
    if (!puzzle) return;

    resolvedPuzzleIdRef.current = puzzleId;
    void recordPuzzleFailed(puzzleId);
    setFailureDetail(getPuzzleFailureDetail(puzzle, attemptedMove));
    setStatus('failed');
  }, [puzzle, puzzleId, recordPuzzleFailed]);

  const queueOpponentReply = useCallback((stateAfterPlayerMove: GameState) => {
    if (!puzzle) return;

    if (isThemeSatisfied(puzzle, stateAfterPlayerMove)) {
      finishPuzzle();
      return;
    }

    const replyMoves = getForcingMoves(stateAfterPlayerMove, puzzle);
    if (!replyMoves.length) {
      failPuzzle();
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
        failPuzzle();
        return;
      }

      setGameState(replyState);
      setReviewMoveIndex(null);

      const lastMove = replyState.moveHistory[replyState.moveHistory.length - 1];
      if (replyState.isCheck) playCheckSound();
      else if (lastMove.captured) playCaptureSound();
      else playMoveSound();

      if (isThemeSatisfied(puzzle, replyState)) {
        finishPuzzle();
      } else {
        const nextSolverMoves = getForcingMoves(replyState, puzzle);
        if (!nextSolverMoves.length && getPliesRemaining(puzzle, replyState) > 0) {
          failPuzzle();
        }
      }
    }, 450);
  }, [failPuzzle, finishPuzzle, puzzle]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (!gameState || !puzzle || status !== 'playing' || reviewMoveIndex !== null) return;
    if (gameState.turn !== puzzle.sideToMove) return;

    const piece = gameState.board[pos.row][pos.col];
    const playerColor = puzzle.sideToMove;

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
            setReviewMoveIndex(null);
            setSelectedSquare(null);
            setLegalMoves([]);

            const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
            if (newState.isCheck) playCheckSound();
            else if (lastMove.captured) playCaptureSound();
            else playMoveSound();

            queueOpponentReply(newState);
          }
        } else {
          failPuzzle({ from: selectedSquare, to: pos });
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
  }, [failPuzzle, gameState, legalMoves, puzzle, queueOpponentReply, reviewMoveIndex, selectedSquare, status]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    if (!gameState || !puzzle || status !== 'playing' || reviewMoveIndex !== null) return;
    if (gameState.turn !== puzzle.sideToMove) return;
    const piece = gameState.board[from.row][from.col];
    if (!piece || piece.color !== puzzle.sideToMove) return;

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
        setReviewMoveIndex(null);
        setSelectedSquare(null);
        setLegalMoves([]);

        const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
        if (newState.isCheck) playCheckSound();
        else if (lastMove.captured) playCaptureSound();
        else playMoveSound();

        queueOpponentReply(newState);
      }
    } else {
      failPuzzle({ from, to });
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [failPuzzle, gameState, puzzle, queueOpponentReply, reviewMoveIndex, status]);

  const handleRetry = useCallback(() => {
    if (autoReplyTimeoutRef.current !== null) {
      window.clearTimeout(autoReplyTimeoutRef.current);
      autoReplyTimeoutRef.current = null;
    }
    if (puzzle) {
      setGameState(createGameStateFromPuzzle(puzzle));
      setSelectedSquare(null);
      setLegalMoves([]);
      setStatus('playing');
      setHintStage(0);
      setShowHint(false);
      setFailureDetail(null);
      setReviewMoveIndex(null);
    }
  }, [puzzle]);

  const handleHint = useCallback(() => {
    if (!puzzle || status !== 'playing') return;
    const nextHintStage = Math.min(3, hintStage + 1);
    setHintUsed(true);
    setHintStage(nextHintStage);
    setShowHint(true);
    window.setTimeout(() => setShowHint(false), 3000);
  }, [hintStage, puzzle, status]);

  const jumpToMove = useCallback((index: number) => {
    if (!gameState) return;
    const lastIndex = gameState.moveHistory.length - 1;

    if (index < 0) {
      setReviewMoveIndex(-1);
      return;
    }

    if (index >= lastIndex) {
      setReviewMoveIndex(null);
      return;
    }

    setReviewMoveIndex(index);
  }, [gameState]);

  const stepReviewBy = useCallback((delta: number) => {
    if (!gameState || gameState.moveHistory.length === 0) return;
    const liveIndex = gameState.moveHistory.length - 1;
    const baseIndex = reviewMoveIndex ?? liveIndex;
    jumpToMove(baseIndex + delta);
  }, [gameState, jumpToMove, reviewMoveIndex]);

  const getPuzzleUrl = useCallback((targetPuzzleId: number): string => {
    const basePath = puzzleRoute(String(targetPuzzleId));
    return isRandomMode ? `${basePath}?mode=random` : basePath;
  }, [isRandomMode]);

  const openRandomResultPuzzle = useCallback((targetPuzzleId: number) => {
    if (!isRandomMode || targetPuzzleId === puzzleId) return;
    navigate(getPuzzleUrl(targetPuzzleId));
  }, [getPuzzleUrl, isRandomMode, navigate, puzzleId]);

  const getNextPuzzle = (): number | null => {
    if (isRandomMode) {
      return randomNextPuzzleId;
    }
    const idx = navigationPool.findIndex(p => p.id === puzzleId);
    if (idx >= 0 && idx < navigationPool.length - 1) return navigationPool[idx + 1].id;
    return null;
  };

  const getPrevPuzzle = (): number | null => {
    if (isRandomMode) return null;
    const idx = navigationPool.findIndex(p => p.id === puzzleId);
    if (idx > 0) return navigationPool[idx - 1].id;
    return null;
  };

  const nextPuzzle = getNextPuzzle();
  const activeGameState = useMemo(
    () => (gameState && puzzle ? buildReplayState(puzzle, gameState, reviewMoveIndex) : null),
    [gameState, puzzle, reviewMoveIndex],
  );

  useEffect(() => {
    if (!isRandomMode || status === 'playing' || !puzzle) return;
    if (resolvedPuzzleIdRef.current !== puzzle.id) return;
    const outcomeKey = `${puzzle.id}:${status}`;
    if (recordedOutcomeRef.current === outcomeKey) return;

    const entry: RandomResultEntry = {
      id: crypto.randomUUID(),
      puzzleId: puzzle.id,
      outcome: status === 'success' ? 'success' : 'failed',
    };
    const currentHistory = readRandomResultHistory();
    const nextHistory = [...currentHistory, entry].slice(-MAX_RANDOM_RESULT_HISTORY);
    writeRandomResultHistory(nextHistory);
    setRandomResultHistory(nextHistory);
    recordedOutcomeRef.current = outcomeKey;
  }, [isRandomMode, puzzle, status]);

  useEffect(() => {
    if (
      !isRandomMode ||
      status !== 'success' ||
      !nextPuzzle
    ) {
      if (autoAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
      return;
    }

    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      navigate(getPuzzleUrl(nextPuzzle));
      autoAdvanceTimeoutRef.current = null;
    }, 900);

    return () => {
      if (autoAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(autoAdvanceTimeoutRef.current);
        autoAdvanceTimeoutRef.current = null;
      }
    };
  }, [getPuzzleUrl, isRandomMode, navigate, nextPuzzle, status]);

  useEffect(() => {
    if (!puzzle) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepReviewBy(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepReviewBy(1);
        return;
      }

      if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        handleHint();
        return;
      }

      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        handleRetry();
        return;
      }

      if ((event.key === 'n' || event.key === 'N') && nextPuzzle) {
        event.preventDefault();
        navigate(getPuzzleUrl(nextPuzzle));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [getPuzzleUrl, handleHint, handleRetry, navigate, nextPuzzle, puzzle, stepReviewBy]);

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-bright mb-4">{t('puzzle.not_found')}</h2>
          <button type="button"
            onClick={() => navigate(routes.lessons)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            {t('puzzle.back_to_lessons')}
          </button>
        </div>
      </div>
    );
  }

  const hintMove = gameState && gameState.turn === puzzle.sideToMove
    ? getForcingMoves(gameState, puzzle)[0]
    : undefined;
  const hintSquare = showHint && hintMove ? hintMove.from : null;
  const prevPuzzle = getPrevPuzzle();
  const solverColorLabel = puzzle.sideToMove === 'white' ? t('common.white') : t('common.black');
  const currentTurnLabel = puzzle.sideToMove === 'white' ? t('common.white') : t('common.black');
  const isSolverTurn = status === 'playing' && gameState?.turn === puzzle.sideToMove;
  const currentStep = gameState ? Math.min(gameState.moveHistory.length + 1, puzzle.solution.length) : 1;
  const isReviewingPosition = reviewMoveIndex !== null;
  const activeMoveIndex = gameState
    ? (reviewMoveIndex ?? gameState.moveHistory.length - 1)
    : -1;
  const progressRecord = progressRecords.find(record => record.puzzleId === puzzleId) ?? null;
  const completedTimestamp = progressRecord?.completedAt ?? (status === 'success' ? Math.floor(Date.now() / 1000) : null);

  let activityStatusLabel = t('puzzle.activity_status_new');
  if (completedTimestamp !== null) {
    activityStatusLabel = t('puzzle.activity_status_solved');
  } else if (progressRecord) {
    activityStatusLabel = t('puzzle.activity_status_in_progress');
  }

  const relatedThemePuzzles = PUZZLES
    .filter(candidate => candidate.id !== puzzle.id && candidate.theme === puzzle.theme)
    .sort((a, b) => {
      const aCompleted = completedPuzzleSet.has(a.id);
      const bCompleted = completedPuzzleSet.has(b.id);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      return a.id - b.id;
    })
    .slice(0, 3);
  const revealedHints = [
    hintStage >= 1 ? { label: t('puzzle.hint_label_1'), text: puzzle.hint1 } : null,
    hintStage >= 2 ? { label: t('puzzle.hint_label_2'), text: puzzle.hint2 } : null,
    hintStage >= 3 ? { label: t('puzzle.key_idea_label'), text: puzzle.keyIdea } : null,
  ].filter((entry): entry is { label: string; text: string } => Boolean(entry && (entry.text ?? '').trim().length > 0));
  const lessonIdentityBadges = getPuzzleIdentityBadges(puzzle, t);
  const verificationLabel = getVerificationLabel(puzzle, t);

  return (
    <div className="bg-surface flex min-h-screen flex-col lg:h-dvh lg:overflow-hidden">
      <Header
        active="puzzles"
        subtitle={t('puzzle.lessons_nav')}
      />

      <main id="main-content" className="flex-1 min-h-0 px-4 py-4 lg:overflow-hidden">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1280px] flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-stretch">
          <div className="flex min-h-0 flex-col items-center justify-center gap-3 lg:overflow-hidden">
            {activeGameState && (
              <BoardErrorBoundary onRetry={handleRetry}>
                <Board
                  board={activeGameState.board}
                  className="max-w-full lg:h-full lg:w-auto lg:max-h-[calc(100dvh-9.5rem)]"
                  playerColor={puzzle.sideToMove}
                  isMyTurn={status === 'playing' && !isReviewingPosition && activeGameState.turn === puzzle.sideToMove}
                  legalMoves={legalMoves}
                  selectedSquare={selectedSquare || hintSquare}
                  lastMove={getLastMove(activeGameState)}
                  isCheck={activeGameState.isCheck}
                  checkSquare={getCheckSquare(activeGameState)}
                  onSquareClick={handleSquareClick}
                  onPieceDrop={handlePieceDrop}
                  disabled={status !== 'playing' || isReviewingPosition || activeGameState.turn !== puzzle.sideToMove}
                />
              </BoardErrorBoundary>
            )}
            {isRandomMode && (
              <div className="flex w-full max-w-[520px] flex-wrap items-center gap-2 px-1 pt-1">
                {randomResultHistory.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => openRandomResultPuzzle(entry.puzzleId)}
                    disabled={entry.puzzleId === puzzle.id}
                    title={`#${entry.puzzleId}`}
                    className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${
                      entry.outcome === 'success'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    } ${entry.puzzleId === puzzle.id ? 'cursor-default ring-2 ring-amber-300/80' : 'cursor-pointer hover:brightness-110'}`}
                  >
                    {entry.outcome === 'success' ? '✓' : '✕'}
                  </button>
                ))}
                <span className="h-7 min-w-[30px] rounded-lg bg-amber-600/90 px-2.5 py-1 text-sm font-semibold text-transparent">
                  0
                </span>
              </div>
            )}
          </div>

          <aside
            className="flex min-h-0 flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1"
            style={{ overflowAnchor: 'none' }}
          >
            <div className="rounded-[28px] border border-primary/20 bg-[linear-gradient(160deg,rgba(92,160,26,0.12),rgba(32,24,19,0.95)_48%,rgba(19,15,12,0.98))] p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-primary-light/90">{t('puzzle.lesson')} #{puzzle.id}</p>
                  <h3 className="mt-2 text-xl font-bold text-text-bright">{translatePuzzleContent(getPublicPuzzleTitle(puzzle.title), t)}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-dim">{translatePuzzleContent(puzzle.description, t)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${getDifficultyBadgeClasses(puzzle.difficulty)}`}>
                  {t(`puzzle.${puzzle.difficulty}`)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {lessonIdentityBadges.map((badge) => (
                  <span key={badge} className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-[11px] text-text-dim">
                    {badge}
                  </span>
                ))}
                <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-[11px] text-text-dim">
                  {t('puzzle.rating_short', { score: puzzle.difficultyScore })}
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${getPuzzleOriginBadgeClasses(puzzle.origin)}`}>
                  {getPuzzleOriginLabel(puzzle, t)}
                </span>
                <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-[11px] text-text-dim">
                  {t('puzzle.to_move', { color: currentTurnLabel })}
                </span>
              </div>
            </div>

            <CoachSection
              label={status === 'playing' ? t('puzzle.move_now_label') : status === 'success' ? t('puzzle.solved_label') : t('puzzle.try_again_label')}
              title={status === 'success' ? t('puzzle.correct') : status === 'failed' ? t('puzzle.wrong') : null}
              body={status === 'failed'
                ? (failureDetail ?? t('puzzle.wrong_desc'))
                : status === 'success'
                  ? (hintUsed ? t('puzzle.solved_hint') : t('puzzle.solved_clean'))
                  : (isSolverTurn
                    ? t('puzzle.find_best', { color: solverColorLabel })
                    : t('puzzle.to_move', { color: currentTurnLabel }))}
              tone={status === 'failed' ? 'danger' : 'primary'}
            >
              {status !== 'playing' && (
                <div className="flex items-center gap-3 mt-3">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-xl font-bold ${
                    status === 'success'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}>
                    {status === 'success' ? '✓' : '✕'}
                  </span>
                  <span className={`text-sm font-medium ${
                    status === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {status === 'success' ? t('puzzle.solved_badge') : t('puzzle.failed_badge')}
                  </span>
                </div>
              )}
              {status === 'playing' ? (
                <p className="text-xs text-text-dim">{t('puzzle.step', { current: currentStep, total: puzzle.solution.length })}</p>
              ) : (
                <p className="text-sm leading-6 text-text">{puzzle.takeaway}</p>
              )}
            </CoachSection>

            <section className="sticky top-2 z-10 rounded-2xl border border-surface-hover bg-surface/95 p-3 backdrop-blur">
              <div className="flex flex-wrap gap-2">
                <button type="button"
                  onClick={handleHint}
                  disabled={status !== 'playing' || isReviewingPosition}
                  className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/50 hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('puzzle.hint')}
                </button>
                <button type="button"
                  onClick={handleRetry}
                  className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-hover"
                >
                  ↺ {t('common.retry')}
                </button>
                {nextPuzzle && (
                  <button type="button"
                    onClick={() => navigate(getPuzzleUrl(nextPuzzle))}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    {t('puzzle.next')} →
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-text-dim">
                {isReviewingPosition
                  ? t('puzzle.review_mode_on')
                  : t('puzzle.review_mode_off')}
              </p>
            </section>

            <MoveHistory
              moves={gameState?.moveHistory ?? []}
              initialBoard={puzzle.board}
              currentMoveIndex={activeMoveIndex}
              onMoveClick={jumpToMove}
            />

            <div className="rounded-2xl border border-surface-hover bg-surface-alt p-3">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs ${getPuzzleOriginBadgeClasses(puzzle.origin)}`}>
                  {getPuzzleOriginLabel(puzzle, t)}
                </span>
                <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                  {getPuzzleSourceLabel(puzzle.source, t)}
                </span>
                {puzzle.sourceLicense && (
                  <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                    {puzzle.sourceLicense}
                  </span>
                )}
                {verificationLabel && (
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary-light">
                    {verificationLabel}
                  </span>
                )}
                {puzzle.sourceGameUrl && (
                  <a
                    href={puzzle.sourceGameUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text hover:text-text-bright"
                  >
                    {t('puzzle.source_game_link')}
                  </a>
                )}
              </div>
            </div>

            <details className="rounded-2xl border border-surface-hover bg-surface-alt p-4">
                <summary className="cursor-pointer text-sm font-semibold text-text-bright">{t('puzzle.more_details')}</summary>
                <div className="mt-3 space-y-3">
                  <p className="text-sm font-semibold text-text">{t('puzzle.scene_label')}</p>
                  <p className="text-sm text-text-dim">{puzzle.whyPositionMatters}</p>
                  <p className="text-sm font-semibold text-text">{t('puzzle.task_label')}</p>
                  <p className="text-sm text-text-dim">{puzzle.objective}</p>
                  <p className="text-sm font-semibold text-text">{t('puzzle.coach_eye_label')}</p>
                  <p className="text-sm text-text-dim">{puzzle.keyIdea}</p>
                  {revealedHints.length > 0 && (
                    <div className="space-y-1">
                      {revealedHints.map((entry) => (
                        <p key={entry.label} className="text-sm text-text-dim">
                          <span className="font-semibold text-text">{entry.label}</span>: {entry.text}
                        </p>
                      ))}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-text">{t('puzzle.tempting_mistake_label')}</p>
                  <p className="text-sm text-text-dim">{puzzle.wrongMoveExplanation}</p>
                  <p className="text-sm font-semibold text-text">{t('puzzle.takeaway_label')}</p>
                  <p className="text-sm text-text-dim">{puzzle.takeaway}</p>
                  <p className="text-sm font-semibold text-text">{t('puzzle.source_evidence_label')}</p>
                  <p className="text-sm text-text-dim">{puzzle.ruleImpact}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                      {t('puzzle.activity_status_label')}: {activityStatusLabel}
                    </span>
                    {progressRecord && (
                      <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                        {t('puzzle.attempts_label')}: {progressRecord.attempts}
                      </span>
                    )}
                    {progressRecord && progressRecord.attempts > 0 && (
                      <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                        {t('puzzle.success_rate')}: {Math.round((progressRecord.successes / progressRecord.attempts) * 100)}%
                      </span>
                    )}
                    {progressRecord?.lastPlayedAt && (
                      <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                        {t('puzzle.activity_last_played', { date: formatActivityDate(progressRecord.lastPlayedAt, lang) })}
                      </span>
                    )}
                    {completedTimestamp !== null && (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary-light">
                        {t('puzzle.activity_completed_on', { date: formatActivityDate(completedTimestamp, lang) })}
                      </span>
                    )}
                  </div>
                  {relatedThemePuzzles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.16em] text-primary/80">{t('puzzle.related_theme_title')}</p>
                      <p className="text-xs text-text-dim">{t('puzzle.related_theme_desc', { theme: t(`theme.${puzzle.theme}`) })}</p>
                      {relatedThemePuzzles.map((relatedPuzzle) => (
                        <button type="button"
                          key={relatedPuzzle.id}
                          onClick={() => navigate(puzzleRoute(String(relatedPuzzle.id)))}
                          className="w-full rounded-xl border border-surface-hover bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-hover"
                        >
                          <div className="text-sm font-medium text-text-bright">
                            #{relatedPuzzle.id} · {getPublicPuzzleTitle(relatedPuzzle.title)}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-text-dim">
                            <span className={getDifficultyTextClasses(relatedPuzzle.difficulty)}>{t(`puzzle.${relatedPuzzle.difficulty}`)}</span>
                            <span>
                              {completedPuzzleSet.has(relatedPuzzle.id) ? t('puzzle.solved_badge') : t('puzzle.new_badge')}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
            </details>

            {status !== 'playing' && (
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {prevPuzzle && (
                <button type="button"
                  onClick={() => navigate(puzzleRoute(String(prevPuzzle)))}
                  className="flex-1 min-w-0 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
                >
                  ← {t('puzzle.previous')}
                </button>
              )}
              <button type="button"
                onClick={() => navigate(routes.lessons)}
                className="flex-1 min-w-0 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
              >
                {t('puzzle.all_lessons')}
              </button>
              {nextPuzzle && (
                <button type="button"
                  onClick={() => navigate(getPuzzleUrl(nextPuzzle))}
                  className="flex-1 min-w-0 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
                >
                  {t('puzzle.next')} →
                </button>
              )}
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
