import { useCallback, useEffect, useRef, useState } from 'react';
import type { Position, Move, GameState } from '@shared/types';
import { getLastMoveForView, getLegalMoves, makeMove } from '@shared/engine';
import { STREAK_SURFACE_PUZZLES, type Puzzle } from '@shared/puzzlesRuntime';
import { createGameStateFromPuzzle, getForcingMoves, getPliesRemaining, isThemeSatisfied } from '@shared/puzzleSolver';
import {
  getCheckpointFeedbackTone,
  getInitialStreakDifficultyScore,
  getNextStreakDifficultyScore,
  getStreakPoints,
  selectNextStreakPuzzle,
  STREAK_CHECKPOINT_INTERVAL,
} from '../lib/puzzleStreak';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import { usePuzzleProgress, usePuzzleProgressSummary } from '../lib/puzzleProgress';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Header from './Header';
import Board from './Board';
import MoveHistory from './MoveHistory';
import {
  getCompactPuzzleIdentityBadges,
  getFeedbackClasses,
  getPuzzleFailureDetail,
  getPublicPuzzleTitle,
  getPuzzleOriginLabel,
  getPuzzleSourceLabel,
  type PuzzleStatus,
  type StreakFeedback,
  type StreakMilestoneTone,
} from './PuzzleShared';

export function PuzzleStreakPage() {
  return usePuzzleStreakPageScreen();
}

function usePuzzleStreakPageScreen() {
  const { t } = useTranslation();
  const { recordPuzzleVisited, recordPuzzleFailed, markPuzzleCompleted } = usePuzzleProgress();
  const { recommendedDifficultyScore, attemptCount } = usePuzzleProgressSummary();
  const autoReplyTimeoutRef = useRef<number | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);
  const scoreFlashTimeoutRef = useRef<number | null>(null);
  const milestoneTimeoutRef = useRef<number | null>(null);
  const streakPulseTimeoutRef = useRef<number | null>(null);

  const createStartingPuzzle = useCallback(() => {
    const startingDifficultyScore = getInitialStreakDifficultyScore(
      recommendedDifficultyScore,
      attemptCount,
    );
    const featuredDraft = STREAK_SURFACE_PUZZLES.find((candidate) =>
      candidate.reviewStatus !== 'ship' && candidate.tags.includes('candidate-from-photo'),
    );

    return {
      startingDifficultyScore,
      puzzle: featuredDraft ?? selectNextStreakPuzzle({
        adaptiveDifficultyScore: startingDifficultyScore,
        solvedCount: 0,
        recentPuzzleIds: [],
      }),
    };
  }, [attemptCount, recommendedDifficultyScore]);

  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(() => createStartingPuzzle().puzzle);
  const [gameState, setGameState] = useState<GameState | null>(() => (
    currentPuzzle ? createGameStateFromPuzzle(currentPuzzle) : null
  ));
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [status, setStatus] = useState<PuzzleStatus>('playing');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [recentPuzzleIds, setRecentPuzzleIds] = useState<number[]>([]);
  const [adaptiveDifficultyScore, setAdaptiveDifficultyScore] = useState(() => createStartingPuzzle().startingDifficultyScore);
  const [feedback, setFeedback] = useState<StreakFeedback>(() => ({
    tone: 'neutral',
    title: t('puzzle.streak_prompt_title'),
    detail: t('puzzle.streak_prompt_desc'),
  }));
  const [scoreFlash, setScoreFlash] = useState<string | null>(null);
  const [milestoneTone, setMilestoneTone] = useState<StreakMilestoneTone>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isStreakPulsing, setIsStreakPulsing] = useState(false);
  const [_hintUsed, setHintUsed] = useState(false);
  const [hintStage, setHintStage] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const clearAutoReplyTimeout = useCallback(() => {
    if (autoReplyTimeoutRef.current !== null) {
      window.clearTimeout(autoReplyTimeoutRef.current);
      autoReplyTimeoutRef.current = null;
    }
  }, []);

  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const clearTransientTimeouts = useCallback(() => {
    if (scoreFlashTimeoutRef.current !== null) {
      window.clearTimeout(scoreFlashTimeoutRef.current);
      scoreFlashTimeoutRef.current = null;
    }

    if (milestoneTimeoutRef.current !== null) {
      window.clearTimeout(milestoneTimeoutRef.current);
      milestoneTimeoutRef.current = null;
    }

    if (streakPulseTimeoutRef.current !== null) {
      window.clearTimeout(streakPulseTimeoutRef.current);
      streakPulseTimeoutRef.current = null;
    }
  }, []);

  const loadPuzzle = useCallback((nextPuzzle: Puzzle) => {
    setCurrentPuzzle(nextPuzzle);
    setGameState(createGameStateFromPuzzle(nextPuzzle));
    setSelectedSquare(null);
    setLegalMoves([]);
    setStatus('playing');
    setIsTransitioning(false);
    setHintUsed(false);
    setHintStage(0);
    setShowHint(false);
    setFeedback({
      tone: 'neutral',
      title: t('puzzle.streak_prompt_title'),
      detail: t('puzzle.streak_prompt_desc'),
    });
  }, [t]);

  useEffect(() => {
    return () => {
      clearAutoReplyTimeout();
      clearAdvanceTimeout();
      clearTransientTimeouts();
    };
  }, [clearAdvanceTimeout, clearAutoReplyTimeout, clearTransientTimeouts]);

  useEffect(() => {
    if (!currentPuzzle) return;
    void recordPuzzleVisited(currentPuzzle.id);
  }, [currentPuzzle, recordPuzzleVisited]);

  const showScoreFlash = useCallback((points: number) => {
    if (scoreFlashTimeoutRef.current !== null) {
      window.clearTimeout(scoreFlashTimeoutRef.current);
    }

    setScoreFlash(`+${points}`);
    scoreFlashTimeoutRef.current = window.setTimeout(() => {
      setScoreFlash(null);
      scoreFlashTimeoutRef.current = null;
    }, 850);
  }, []);

  const showMilestone = useCallback((tone: StreakMilestoneTone) => {
    if (!tone) return;

    if (milestoneTimeoutRef.current !== null) {
      window.clearTimeout(milestoneTimeoutRef.current);
    }

    setMilestoneTone(tone);
    milestoneTimeoutRef.current = window.setTimeout(() => {
      setMilestoneTone(null);
      milestoneTimeoutRef.current = null;
    }, 2600);
  }, []);

  const showStreakPulse = useCallback(() => {
    if (streakPulseTimeoutRef.current !== null) {
      window.clearTimeout(streakPulseTimeoutRef.current);
    }

    setIsStreakPulsing(true);
    streakPulseTimeoutRef.current = window.setTimeout(() => {
      setIsStreakPulsing(false);
      streakPulseTimeoutRef.current = null;
    }, 520);
  }, []);

  const restartStreakState = useCallback(() => {
    clearAutoReplyTimeout();
    clearAdvanceTimeout();
    clearTransientTimeouts();

    const nextStart = createStartingPuzzle();
    setScore(0);
    setStreak(0);
    setSolvedCount(0);
    setRecentPuzzleIds([]);
    setAdaptiveDifficultyScore(nextStart.startingDifficultyScore);
    setScoreFlash(null);
    setMilestoneTone(null);
    setIsStreakPulsing(false);
    loadPuzzle(nextStart.puzzle);
  }, [clearAdvanceTimeout, clearAutoReplyTimeout, clearTransientTimeouts, createStartingPuzzle, loadPuzzle]);

  const endStreak = useCallback((attemptedMove: Pick<Move, 'from' | 'to'> | null = null) => {
    if (!currentPuzzle) return;

    clearAutoReplyTimeout();
    clearAdvanceTimeout();
    clearTransientTimeouts();

    const nextDifficultyScore = getNextStreakDifficultyScore(adaptiveDifficultyScore, 'failed', streak);
    setAdaptiveDifficultyScore(nextDifficultyScore);
    setStatus('failed');
    setIsTransitioning(false);
    setFeedback({
      tone: 'failed',
      title: t('puzzle.wrong'),
      detail: getPuzzleFailureDetail(currentPuzzle, attemptedMove),
    });
    void recordPuzzleFailed(currentPuzzle.id);
  }, [adaptiveDifficultyScore, clearAdvanceTimeout, clearAutoReplyTimeout, clearTransientTimeouts, currentPuzzle, recordPuzzleFailed, streak, t]);

  const registerWrongStreakAttempt = useCallback((attemptedMove: Pick<Move, 'from' | 'to'> | null = null) => {
    if (!currentPuzzle) return;

    clearAutoReplyTimeout();
    clearAdvanceTimeout();
    clearTransientTimeouts();

    setStatus('playing');
    setIsTransitioning(false);
    setScoreFlash(null);
    setMilestoneTone(null);
    setIsStreakPulsing(false);
    setFeedback({
      tone: 'failed',
      title: t('puzzle.wrong'),
      detail: getPuzzleFailureDetail(currentPuzzle, attemptedMove),
    });
    void recordPuzzleFailed(currentPuzzle.id);
  }, [clearAdvanceTimeout, clearAutoReplyTimeout, clearTransientTimeouts, currentPuzzle, recordPuzzleFailed, t]);

  const finishStreakPuzzle = useCallback(() => {
    if (!currentPuzzle) return;

    clearAdvanceTimeout();

    const nextStreak = streak + 1;
    const pointsEarned = getStreakPoints(currentPuzzle, nextStreak);
    const nextScore = score + pointsEarned;
    const nextSolvedCount = solvedCount + 1;
    const nextDifficultyScore = getNextStreakDifficultyScore(adaptiveDifficultyScore, 'success', nextStreak);
    const nextRecentPuzzleIds = [...recentPuzzleIds, currentPuzzle.id];
    const nextPuzzle = selectNextStreakPuzzle({
      currentPuzzleId: currentPuzzle.id,
      adaptiveDifficultyScore: nextDifficultyScore,
      recentPuzzleIds: nextRecentPuzzleIds,
      solvedCount: nextSolvedCount,
    });

    setStatus('success');
    setScore(nextScore);
    setStreak(nextStreak);
    setSolvedCount(nextSolvedCount);
    setAdaptiveDifficultyScore(nextDifficultyScore);
    setRecentPuzzleIds(nextRecentPuzzleIds);
    setFeedback({
      tone: 'success',
      title: t('puzzle.correct'),
      detail: t('puzzle.streak_points', { points: pointsEarned }),
    });
    setIsTransitioning(true);
    showScoreFlash(pointsEarned);
    showStreakPulse();
    showMilestone(getCheckpointFeedbackTone(nextSolvedCount, adaptiveDifficultyScore, nextDifficultyScore));
    playGameOverSound();
    void markPuzzleCompleted(currentPuzzle.id);

    advanceTimeoutRef.current = window.setTimeout(() => {
      loadPuzzle(nextPuzzle);
      advanceTimeoutRef.current = null;
    }, 420);
  }, [
    adaptiveDifficultyScore,
    clearAdvanceTimeout,
    currentPuzzle,
    loadPuzzle,
    markPuzzleCompleted,
    recentPuzzleIds,
    score,
    showMilestone,
    showScoreFlash,
    showStreakPulse,
    solvedCount,
    streak,
    t,
  ]);

  const queueOpponentReply = useCallback((stateAfterPlayerMove: GameState) => {
    if (!currentPuzzle) return;

    if (isThemeSatisfied(currentPuzzle, stateAfterPlayerMove)) {
      finishStreakPuzzle();
      return;
    }

    const replyMoves = getForcingMoves(stateAfterPlayerMove, currentPuzzle);
    if (!replyMoves.length) {
      endStreak();
      return;
    }

    const canonicalReply = currentPuzzle.solution[stateAfterPlayerMove.moveHistory.length];
    const replyMove = canonicalReply
      ? replyMoves.find(move =>
        move.from.row === canonicalReply.from.row &&
        move.from.col === canonicalReply.from.col &&
        move.to.row === canonicalReply.to.row &&
        move.to.col === canonicalReply.to.col,
      ) ?? replyMoves[0]
      : replyMoves[0];

    clearAutoReplyTimeout();
    autoReplyTimeoutRef.current = window.setTimeout(() => {
      const replyState = makeMove(stateAfterPlayerMove, replyMove.from, replyMove.to);
      autoReplyTimeoutRef.current = null;

      if (!replyState) {
        endStreak();
        return;
      }

      setGameState(replyState);

      const lastMove = replyState.moveHistory[replyState.moveHistory.length - 1];
      if (replyState.isCheck) playCheckSound();
      else if (lastMove.captured) playCaptureSound();
      else playMoveSound();

      if (isThemeSatisfied(currentPuzzle, replyState)) {
        finishStreakPuzzle();
      } else {
        const nextSolverMoves = getForcingMoves(replyState, currentPuzzle);
        if (!nextSolverMoves.length && getPliesRemaining(currentPuzzle, replyState) > 0) {
          endStreak();
        }
      }
    }, 260);
  }, [clearAutoReplyTimeout, currentPuzzle, endStreak, finishStreakPuzzle]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (!gameState || !currentPuzzle || status !== 'playing') return;
    if (gameState.turn !== currentPuzzle.sideToMove) return;

    const piece = gameState.board[pos.row][pos.col];
    const playerColor = currentPuzzle.sideToMove;

    if (selectedSquare) {
      const isLegal = legalMoves.some(m => m.row === pos.row && m.col === pos.col);
      if (isLegal) {
        const forcingMoves = getForcingMoves(gameState, currentPuzzle);
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
          setSelectedSquare(null);
          setLegalMoves([]);
          registerWrongStreakAttempt({ from: selectedSquare, to: pos });
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
  }, [currentPuzzle, gameState, legalMoves, queueOpponentReply, registerWrongStreakAttempt, selectedSquare, status]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    if (!gameState || !currentPuzzle || status !== 'playing') return;
    if (gameState.turn !== currentPuzzle.sideToMove) return;
    const piece = gameState.board[from.row][from.col];
    if (!piece || piece.color !== currentPuzzle.sideToMove) return;

    const legal = getLegalMoves(gameState.board, from);
    if (!legal.some(m => m.row === to.row && m.col === to.col)) return;

    const forcingMoves = getForcingMoves(gameState, currentPuzzle);
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
      setSelectedSquare(null);
      setLegalMoves([]);
      registerWrongStreakAttempt({ from, to });
    }
  }, [currentPuzzle, gameState, queueOpponentReply, registerWrongStreakAttempt, status]);

  const handleRestartStreak = useCallback(() => {
    restartStreakState();
  }, [restartStreakState]);

  const handleStreakHint = useCallback(() => {
    if (!currentPuzzle || status !== 'playing') return;

    const nextHintStage = Math.min(3, hintStage + 1);
    setHintUsed(true);
    setHintStage(nextHintStage);
    setShowHint(true);
    window.setTimeout(() => setShowHint(false), 3000);
  }, [currentPuzzle, hintStage, status]);

  const getLastMove = (): Move | null => {
    return getLastMoveForView(gameState);
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

  const currentTurnLabel = (currentPuzzle?.sideToMove ?? 'white') === 'white' ? t('common.white') : t('common.black');
  const hintMove = currentPuzzle && gameState && gameState.turn === currentPuzzle.sideToMove
    ? getForcingMoves(gameState, currentPuzzle)[0]
    : undefined;
  const hintSquare = showHint && hintMove ? hintMove.from : null;
  const revealedHints = currentPuzzle ? [
    hintStage >= 1 ? { label: t('puzzle.hint_label_1'), text: currentPuzzle.hint1 } : null,
    hintStage >= 2 ? { label: t('puzzle.hint_label_2'), text: currentPuzzle.hint2 } : null,
    hintStage >= 3 ? { label: t('puzzle.key_idea_label'), text: currentPuzzle.keyIdea } : null,
  ].filter((entry): entry is { label: string; text: string } => Boolean(entry && (entry.text ?? '').trim().length > 0)) : [];
  const checkpointProgress = ((solvedCount % STREAK_CHECKPOINT_INTERVAL) / STREAK_CHECKPOINT_INTERVAL) * 100;
  const adaptiveProgress = Math.max(10, Math.min(100, ((adaptiveDifficultyScore - 780) / (2200 - 780)) * 100));
  const milestoneMessage = milestoneTone === 'harder'
    ? t('puzzle.streak_milestone_harder')
    : milestoneTone === 'improving'
      ? t('puzzle.streak_milestone_improving')
      : null;
  const streakPulseIcon = milestoneTone === 'harder' ? '🔥' : milestoneTone === 'improving' ? '⚡' : null;
  const streakTitle = currentPuzzle ? getPublicPuzzleTitle(currentPuzzle.title) : feedback.title;
  const streakIdentityBadges = currentPuzzle ? getCompactPuzzleIdentityBadges(currentPuzzle, t) : [];
  const streakTask = currentPuzzle?.objective ?? t('puzzle.find_best', { color: currentTurnLabel });
  const activeHint = revealedHints[revealedHints.length - 1]?.text ?? null;
  const streakMessage = feedback.tone === 'failed'
    ? feedback.detail
    : activeHint ?? streakTask;
  const streakSubMessage = feedback.tone === 'failed'
    ? streakTask
    : currentPuzzle?.whyPositionMatters ?? null;
  return (
    <div className="bg-surface flex min-h-screen flex-col lg:h-dvh lg:overflow-hidden">
      <Header
        active="puzzles"
        subtitle={t('puzzle.streak_nav')}
      />

      <main id="main-content" className="flex-1 min-h-0 px-4 py-3 sm:py-4 lg:overflow-hidden">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1360px] flex-col gap-2.5">
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 lg:grid lg:grid-cols-[minmax(0,1fr)_352px] xl:grid-cols-[minmax(0,1fr)_376px] lg:items-stretch">
            <div className={`flex min-h-0 flex-1 flex-col items-center justify-center transition-opacity duration-200 lg:overflow-hidden ${isTransitioning ? 'opacity-70' : 'opacity-100'}`}>
              {currentPuzzle && gameState && (
                <div
                  data-testid="puzzle-board-frame"
                  className="w-full lg:w-[min(100%,calc(100dvh-10rem))] xl:w-[min(100%,calc(100dvh-9.25rem))]"
                >
                  <BoardErrorBoundary onRetry={handleRestartStreak}>
                    <Board
                      key={currentPuzzle.id}
                      board={gameState.board}
                      className="mx-auto w-full"
                      playerColor={currentPuzzle.sideToMove}
                      isMyTurn={status === 'playing' && gameState.turn === currentPuzzle.sideToMove}
                      legalMoves={legalMoves}
                      selectedSquare={selectedSquare || hintSquare}
                      lastMove={getLastMove()}
                      isCheck={gameState.isCheck}
                      checkSquare={getCheckSquare()}
                      onSquareClick={handleSquareClick}
                      onPieceDrop={handlePieceDrop}
                      disabled={status !== 'playing' || gameState.turn !== currentPuzzle.sideToMove}
                    />
                  </BoardErrorBoundary>
                </div>
              )}
            </div>

            <aside
              className="flex w-full max-w-[720px] min-h-0 flex-col gap-2.5 lg:h-full lg:max-h-full lg:max-w-none lg:overflow-y-auto lg:pr-1"
              style={{ overflowAnchor: 'none' }}
            >
              <section
                data-testid="streak-sidebar-summary"
                className="ui-card p-4"
              >
                <h2 className="text-lg font-bold tracking-tight text-text-bright">{t('puzzle.streak_title')}</h2>
                <p className="mt-1 text-sm leading-relaxed text-text-dim">{t('puzzle.streak_desc')}</p>

                <p className={`relative mt-4 text-sm text-text-dim ${isStreakPulsing ? 'animate-streakPulse' : ''}`}>
                  <span className="font-semibold text-text-bright">{t('puzzle.streak_score_label')}: {score}</span>
                  {scoreFlash && (
                    <span className="pointer-events-none absolute -top-4 right-0 text-sm font-semibold text-accent animate-scoreFloat">
                      {scoreFlash}
                    </span>
                  )}
                  {' · '}
                  <span className="font-semibold text-text-bright">{t('puzzle.streak_label')}: {streak}</span>
                  {streakPulseIcon && (
                    <span
                      aria-label={`Streak pulse: ${milestoneMessage}`}
                      className="ml-1 inline-block text-accent"
                    >
                      {streakPulseIcon}
                    </span>
                  )}
                  {' · '}
                  <span className="font-semibold text-text-bright">{t('puzzle.streak_session_label')}: {solvedCount}</span>
                </p>

                <p className="mt-3 text-sm text-text-dim">
                  {t('puzzle.streak_checkpoint_label')}
                  {': '}
                  {t('puzzle.streak_checkpoint_progress', {
                    current: solvedCount % STREAK_CHECKPOINT_INTERVAL,
                    total: STREAK_CHECKPOINT_INTERVAL,
                  })}
                  {' · '}
                  {t('puzzle.streak_flow_label')}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${Math.max(checkpointProgress, adaptiveProgress)}%` }} />
                </div>
              </section>

                <div className={`ui-card p-4 ${getFeedbackClasses(feedback.tone)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-text-bright">{streakTitle}</h3>
                    <p className="mt-1 text-sm text-text-dim">
                      {t('puzzle.streak_puzzle_label', { number: currentPuzzle?.id ?? solvedCount + 1 })}
                      {' · '}
                      {feedback.title}
                      {' · '}
                      {t('puzzle.to_move', { color: currentTurnLabel })}
                    </p>
                  </div>
                </div>
                {streakIdentityBadges.length > 0 && (
                  <p className="mt-2 text-xs text-text-dim">
                    {streakIdentityBadges.join(' · ')}
                  </p>
                )}
                <div className="mt-3 border-t border-surface-hover/70 pt-3">
                  <p className="text-sm leading-relaxed text-text-dim">{streakMessage}</p>

                  {streakSubMessage && (
                    <p className="mt-3 text-xs leading-relaxed text-text-dim">
                      <span className="font-medium text-text-bright">
                        {feedback.tone === 'failed' ? t('puzzle.try_this_instead_label') : t('puzzle.position_label')}
                        {': '}
                      </span>
                      {streakSubMessage}
                    </p>
                  )}

                  {currentPuzzle && (
                    <p className="mt-3 text-xs text-text-dim">
                      {getPuzzleOriginLabel(currentPuzzle, t)}
                      {' · '}
                      {getPuzzleSourceLabel(currentPuzzle.source, t)}
                      {currentPuzzle.sourceGameUrl && (
                        <>
                          {' · '}
                          <a
                            href={currentPuzzle.sourceGameUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-text hover:text-text-bright underline underline-offset-2"
                          >
                            {t('puzzle.source_game_link')}
                          </a>
                        </>
                      )}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button"
                      onClick={handleStreakHint}
                      disabled={status !== 'playing' || !currentPuzzle}
                      className="button-accent-contrast rounded-[0.6rem] px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {t('puzzle.hint')}
                    </button>
                    <button type="button"
                      onClick={handleRestartStreak}
                      className="ui-btn-secondary px-3 py-2 text-sm"
                    >
                      ↺ {t('common.new_game')}
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-text-dim">
                    {activeHint ? `${t('puzzle.hint')} ${hintStage}` : t('puzzle.hint_nudge')}
                  </p>
                </div>
              </div>

              {currentPuzzle && gameState && (
                <MoveHistory
                  moves={gameState.moveHistory}
                  initialBoard={currentPuzzle.board}
                />
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
