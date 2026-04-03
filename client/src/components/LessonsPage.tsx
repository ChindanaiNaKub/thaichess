import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getLegalMoves, isInCheck, makeMove } from '@shared/engine';
import type { GameState, Position } from '@shared/types';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonRoute, puzzleRoute, routes } from '../lib/routes';
import {
  LESSON_MODULES,
  MAKRUK_LESSONS,
  getLessonById,
  getNextLessonId,
  getPreviousLessonId,
  type LessonPracticeTask,
  type LessonScene,
  type LessonStep,
  type MakrukLesson,
} from '../lib/lessons';
import { getRelatedPuzzlesForLesson } from '../lib/lessonPuzzles';
import { isLessonUnlocked, useLessonProgress, useLessonProgressSummary } from '../lib/lessonProgress';
import { useTranslation } from '../lib/i18n';
import Header from './Header';
import Board from './Board';

function shouldLogLessonDebug(): boolean {
  if (typeof window === 'undefined') return false;
  return import.meta.env.DEV || window.location.hostname === 'localhost';
}

function useSquareFitSize<T extends HTMLElement>() {
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

function createLessonGameState(scene: LessonScene): GameState {
  const board = scene.board.map(row => row.map(piece => (piece ? { ...piece } : null)));
  return {
    board,
    turn: scene.toMove,
    moveHistory: [],
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

function getPublicPuzzleTitle(title: string): string {
  return title
    .replace(/\s*\([0-9a-f]{8}\s*@\s*ply\s*\d+\)$/i, '')
    .replace(/^Real-Game\s+/i, '')
    .trim();
}

function formatConceptLabel(value: string): string {
  return value
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatMoveLabel(move: { from: Position; to: Position }): string {
  const toSquare = (pos: Position) => `${String.fromCharCode(97 + pos.col)}${pos.row + 1}`;
  return `${toSquare(move.from)}-${toSquare(move.to)}`;
}

function getDifficultyBadgeClasses(difficulty: 'beginner' | 'intermediate' | 'advanced'): string {
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

function CoursePreviewBoard({ scene }: { scene: LessonScene }) {
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

function LessonCoursePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { completedLessonSet, startedLessonSet } = useLessonProgress();
  const lessonSummary = useLessonProgressSummary();
  const nextLesson = lessonSummary.nextLesson ?? MAKRUK_LESSONS[0] ?? null;

  useEffect(() => {
    if (!shouldLogLessonDebug()) return;
    console.info('[LessonsPage] lesson catalog loaded', {
      source: 'client/src/lib/lessons.ts',
      moduleCount: LESSON_MODULES.length,
      lessonCount: MAKRUK_LESSONS.length,
      sampleLesson: MAKRUK_LESSONS[0]
        ? {
            id: MAKRUK_LESSONS[0].id,
            title: MAKRUK_LESSONS[0].title,
            dependsOnCounting: MAKRUK_LESSONS[0].dependsOnCounting,
            ruleImpact: MAKRUK_LESSONS[0].ruleImpact,
          }
        : null,
    });
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        active="lessons"
        subtitle={t('nav.lessons')}
        right={(
          <button
            onClick={() => navigate(routes.puzzles)}
            className="text-sm text-text-dim hover:text-text-bright transition-colors"
          >
            {t('puzzle.streak_nav')}
          </button>
        )}
      />

      <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 sm:py-8 max-w-6xl mx-auto w-full">
        <section className="rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_top_left,_rgba(121,181,62,0.18),_transparent_38%),linear-gradient(135deg,rgba(25,31,20,0.96),rgba(18,16,13,0.92))] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_320px]">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-primary-light/80">{t('lessons.course.eyebrow')}</p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-text-bright">{t('lessons.course.title')}</h1>
              <p className="mt-3 max-w-3xl text-sm sm:text-base text-text-dim leading-relaxed">
                {t('lessons.course.desc')}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-surface-hover bg-surface/70 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('lessons.course.stats.progress')}</div>
                  <div className="mt-2 text-2xl font-bold text-text-bright">
                    {lessonSummary.completedCount}/{lessonSummary.totalCount}
                  </div>
                  <div className="mt-1 text-sm text-text-dim">{t('lessons.course.stats.completed')}</div>
                </div>
                <div className="rounded-2xl border border-surface-hover bg-surface/70 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('lessons.course.stats.shape')}</div>
                  <div className="mt-2 text-2xl font-bold text-text-bright">3</div>
                  <div className="mt-1 text-sm text-text-dim">{t('lessons.course.stats.shape_desc')}</div>
                </div>
                <div className="rounded-2xl border border-surface-hover bg-surface/70 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-text-dim">{t('lessons.course.stats.format')}</div>
                  <div className="mt-2 text-2xl font-bold text-text-bright">{t('lessons.course.stats.format_value')}</div>
                  <div className="mt-1 text-sm text-text-dim">{t('lessons.course.stats.format_desc')}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-text-bright font-medium">{t('lessons.course.progress_label')}</span>
                  <span className="text-text-dim">{t('lessons.course.progress_value', { percent: lessonSummary.percentComplete })}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${lessonSummary.percentComplete}%` }}
                  />
                </div>
              </div>
            </div>

            <aside className="rounded-2xl border border-primary/25 bg-surface/75 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-primary-light/80">{t('lessons.course.next_lesson')}</p>
              {nextLesson ? (
                <>
                  <h2 className="mt-2 text-2xl font-semibold text-text-bright">{nextLesson.title}</h2>
                  <p className="mt-2 text-sm text-text-dim leading-relaxed">{nextLesson.objective}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-[0.14em] ${getDifficultyBadgeClasses(nextLesson.level)}`}>
                      {t(`puzzle.${nextLesson.level}`)}
                    </span>
                    <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                      {t('lessons.course.minutes', { minutes: nextLesson.estimatedMinutes })}
                    </span>
                  </div>
                  <div className="mt-4">
                    <CoursePreviewBoard scene={nextLesson.example} />
                  </div>
                  <button
                    onClick={() => navigate(lessonRoute(nextLesson.id))}
                    className="mt-5 w-full rounded-xl bg-primary hover:bg-primary-light text-white font-semibold px-4 py-3 transition-colors"
                  >
                    {t('lessons.course.start_lesson')}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="mt-2 text-2xl font-semibold text-text-bright">{t('lessons.course.complete_title')}</h2>
                  <p className="mt-2 text-sm text-text-dim leading-relaxed">
                    {t('lessons.course.complete_desc')}
                  </p>
                  <button
                    onClick={() => navigate(routes.puzzles)}
                    className="mt-5 w-full rounded-xl border border-surface-hover bg-surface px-4 py-3 text-text-bright font-semibold transition-colors hover:bg-surface-hover"
                  >
                    {t('lessons.course.go_to_puzzles')}
                  </button>
                </>
              )}
            </aside>
          </div>
        </section>

        <section className="mt-8 space-y-5">
          {LESSON_MODULES.map((module) => {
            const completedInModule = module.lessons.filter(lesson => completedLessonSet.has(lesson.id)).length;

            return (
              <div key={module.id} className="rounded-3xl border border-surface-hover bg-surface-alt/85 p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-primary-light/80">{t(`puzzle.${module.level}`)}</div>
                    <h2 className="mt-2 text-2xl font-semibold text-text-bright">{module.title}</h2>
                    <p className="mt-2 text-sm text-text-dim max-w-3xl">{module.description}</p>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-sm font-medium text-text-bright">{t('lessons.course.module_progress', { done: completedInModule, total: module.lessons.length })}</div>
                    <div className="mt-2 h-2 w-full sm:w-40 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.round((completedInModule / module.lessons.length) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {module.lessons.map((lesson) => {
                    const completed = completedLessonSet.has(lesson.id);
                    const unlocked = isLessonUnlocked(lesson.id, completedLessonSet);
                    const started = startedLessonSet.has(lesson.id);
                    const cardClasses = completed
                      ? 'border-primary/35 bg-primary/10'
                      : unlocked
                        ? 'border-surface-hover bg-surface hover:border-primary/40 hover:bg-surface-hover'
                        : 'border-surface-hover/50 bg-surface/45 opacity-70';

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => unlocked && navigate(lessonRoute(lesson.id))}
                        disabled={!unlocked}
                        className={`rounded-2xl border p-4 text-left transition-all ${cardClasses}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.18em] text-text-dim">
                              {t('lessons.course.lesson_label', { order: lesson.order })}
                            </div>
                            <h3 className="mt-1 text-lg font-semibold text-text-bright">{lesson.title}</h3>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
                            completed
                              ? 'border-primary/35 bg-primary/10 text-primary-light'
                              : unlocked
                                ? 'border-surface-hover bg-surface text-text-dim'
                                : 'border-surface-hover/60 bg-surface/60 text-text-dim'
                          }`}>
                            {completed
                              ? t('lessons.course.status.completed')
                              : unlocked
                                ? (started ? t('lessons.course.status.resume') : t('lessons.course.status.unlocked'))
                                : t('lessons.course.status.locked')}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-text-dim leading-relaxed">{lesson.objective}</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${getDifficultyBadgeClasses(lesson.level)}`}>
                            {t(`puzzle.${lesson.level}`)}
                          </span>
                          <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-[11px] text-text-dim">
                            {t('lessons.course.minutes', { minutes: lesson.estimatedMinutes })}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {lesson.concepts.slice(0, 3).map((concept) => (
                            <span key={concept} className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                              {formatConceptLabel(concept)}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function StructuredLessonPlayer() {
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const lesson = getLessonById(id);
  const { completedLessonSet, visitLesson, completeLesson } = useLessonProgress();
  const { t } = useTranslation();
  const { ref: boardStageRef, size: boardStageSize } = useSquareFitSize<HTMLDivElement>();
  const [phase, setPhase] = useState<'guided' | 'practice'>('guided');
  const [guidedIndex, setGuidedIndex] = useState(0);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [feedback, setFeedback] = useState<{ tone: 'neutral' | 'success' | 'error'; message: string } | null>(null);
  const [resolved, setResolved] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(lesson ? createLessonGameState(lesson.guidedSteps[0]?.scene ?? lesson.example) : null);

  useEffect(() => {
    if (!lesson) return;
    visitLesson(lesson.id);
  }, [lesson, visitLesson]);

  useEffect(() => {
    if (!lesson) return;
    setPhase('guided');
    setGuidedIndex(0);
    setPracticeIndex(0);
    setSelectedSquare(null);
    setLegalMoves([]);
    setFeedback(null);
    setResolved(false);
    setGameState(createLessonGameState(lesson.guidedSteps[0]?.scene ?? lesson.example));
  }, [lesson]);

  useEffect(() => {
    if (!lesson || !shouldLogLessonDebug()) return;
    console.info('[LessonsPage] active lesson loaded', {
      source: 'client/src/lib/lessons.ts',
      id: lesson.id,
      title: lesson.title,
      objective: lesson.objective,
      dependsOnCounting: lesson.dependsOnCounting,
      ruleImpact: lesson.ruleImpact,
      guidedStepIds: lesson.guidedSteps.map(step => step.id),
      practiceTaskIds: lesson.practiceTasks.map(task => task.id),
    });
  }, [lesson]);

  const guidedStep = lesson?.guidedSteps[guidedIndex] ?? null;
  const practiceTask = lesson?.practiceTasks[practiceIndex] ?? null;
  const activeStep: LessonStep | LessonPracticeTask | null = phase === 'guided' ? guidedStep : practiceTask;
  const activeScene = activeStep?.scene ?? lesson?.example ?? null;
  const expectsMove = Boolean(activeStep && 'expectedMove' in activeStep && activeStep.expectedMove);
  const lessonCompleted = lesson ? completedLessonSet.has(lesson.id) : false;
  const nextLessonId = lesson ? getNextLessonId(lesson.id) : null;
  const previousLessonId = lesson ? getPreviousLessonId(lesson.id) : null;
  const relatedPuzzles = useMemo(() => (lesson ? getRelatedPuzzlesForLesson(lesson) : []), [lesson]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, []);

  useEffect(() => {
    if (!activeScene) return;
    setGameState(createLessonGameState(activeScene));
    setSelectedSquare(null);
    setLegalMoves([]);
    setFeedback(null);
    setResolved(false);
  }, [activeScene, phase, guidedIndex, practiceIndex]);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-bright mb-4">{t('lessons.player.not_found')}</h2>
          <button
            onClick={() => navigate(routes.coursePath)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            {t('lessons.player.back_to_course')}
          </button>
        </div>
      </div>
    );
  }

  const handleMoveAttempt = (from: Position, to: Position) => {
    if (!activeStep || !activeScene || !gameState || !expectsMove) return;
    const expectedMove = activeStep.expectedMove;
    if (!expectedMove) return;

    if (
      from.row === expectedMove.from.row &&
      from.col === expectedMove.from.col &&
      to.row === expectedMove.to.row &&
      to.col === expectedMove.to.col
    ) {
      const nextState = makeMove(gameState, from, to);
      setGameState(nextState);
      setFeedback({
        tone: 'success',
        message: ('successMessage' in activeStep && activeStep.successMessage) ? activeStep.successMessage : t('lessons.player.default_correct'),
      });
      setSelectedSquare(null);
      setLegalMoves([]);
      setResolved(true);

      if (phase === 'practice' && practiceIndex === lesson.practiceTasks.length - 1) {
        completeLesson(lesson.id);
      }

      return;
    }

    setFeedback({
      tone: 'error',
      message: ('wrongMoveMessage' in activeStep && activeStep.wrongMoveMessage)
        ? activeStep.wrongMoveMessage
        : t('lessons.player.default_wrong'),
    });
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const handleSquareClick = (pos: Position) => {
    if (!gameState || !activeStep || !expectsMove || resolved) return;

    if (selectedSquare) {
      const isLegal = legalMoves.some(move => move.row === pos.row && move.col === pos.col);
      if (isLegal) {
        handleMoveAttempt(selectedSquare, pos);
        return;
      }
    }

    const piece = gameState.board[pos.row]?.[pos.col];
    if (!piece || piece.color !== gameState.turn) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    setSelectedSquare(pos);
    setLegalMoves(getLegalMoves(gameState.board, pos));
    setFeedback(null);
  };

  const handlePieceDrop = (from: Position, to: Position) => {
    handleMoveAttempt(from, to);
  };

  const goForward = () => {
    if (phase === 'guided') {
      if (guidedIndex < lesson.guidedSteps.length - 1) {
        setGuidedIndex(current => current + 1);
        return;
      }
      setPhase('practice');
      return;
    }

    if (practiceIndex < lesson.practiceTasks.length - 1) {
      setPracticeIndex(current => current + 1);
      return;
    }
  };

  const feedbackClasses = feedback?.tone === 'success'
    ? 'border-primary/35 bg-primary/12 text-primary-light'
    : feedback?.tone === 'error'
      ? 'border-danger/35 bg-danger/12 text-danger'
      : 'border-surface-hover bg-surface-alt text-text-dim';

  const activePanelTitle = activeStep && 'title' in activeStep ? activeStep.title : t('lessons.player.practice_task');
  const phaseLabel = phase === 'guided' ? t('lessons.player.guided_step') : t('lessons.player.mini_practice');
  const phaseStatusLabel = lessonCompleted
    ? t('lessons.player.status.completed')
    : phase === 'guided'
      ? t('lessons.player.status.guided')
      : t('lessons.player.status.practice');

  return (
    <div className="h-[100dvh] bg-surface flex flex-col overflow-hidden">
      <Header
        active="lessons"
        subtitle={t('lessons.player.header_subtitle', { title: lesson.title })}
        right={(
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(routes.coursePath)}
              className="text-text-dim hover:text-text-bright transition-colors text-sm"
            >
              {t('lessons.player.course_path')}
            </button>
            <button
              onClick={() => navigate(routes.puzzles)}
              className="text-text-dim hover:text-text-bright transition-colors text-sm"
            >
              {t('nav.puzzles')}
            </button>
          </div>
        )}
      />

      <main id="main-content" className="flex-1 overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
        <div className="mx-auto grid h-full max-w-[1400px] grid-rows-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-1">
          <section className="min-h-0 overflow-hidden rounded-3xl border border-primary/18 bg-[radial-gradient(circle_at_top_left,_rgba(121,181,62,0.12),_transparent_34%),linear-gradient(180deg,rgba(31,28,22,0.96),rgba(22,18,14,0.96))] p-3 sm:p-4">
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-hover/70 pb-3">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-primary-light/80">
                    {t('lessons.player.level_and_order', { level: t(`puzzle.${lesson.level}`), order: lesson.order })}
                  </div>
                  <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-text-bright">{lesson.title}</h1>
                  <p className="mt-1 text-sm text-text-dim max-w-2xl">{lesson.objective}</p>
                  <div className="mt-3">
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
                      lesson.dependsOnCounting
                        ? 'border-amber-400/35 bg-amber-400/10 text-amber-200'
                        : 'border-surface-hover bg-surface text-text-dim'
                    }`}>
                      {lesson.dependsOnCounting ? t('lessons.player.counting_aware') : t('lessons.player.no_counting_dependency')}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 rounded-2xl border border-surface-hover/70 bg-surface/75 px-3 py-2 text-right">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-text-dim">
                    {phaseLabel}
                  </div>
                  <div className="mt-1 text-lg font-semibold text-text-bright">
                    {phase === 'guided'
                      ? `${guidedIndex + 1}/${lesson.guidedSteps.length}`
                      : `${practiceIndex + 1}/${lesson.practiceTasks.length}`}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 pt-3 sm:pt-4">
                <div
                  ref={boardStageRef}
                  data-testid="lesson-board-stage"
                  className="flex h-full min-h-0 items-center justify-center overflow-hidden"
                >
                  <div
                    data-testid="lesson-board-frame"
                    className="max-w-full max-h-full shrink-0"
                    style={{
                      width: boardStageSize ? `${boardStageSize}px` : '100%',
                      height: boardStageSize ? `${boardStageSize}px` : undefined,
                      aspectRatio: '1 / 1',
                    }}
                  >
                    {gameState && activeScene && (
                      <Board
                        board={gameState.board}
                        playerColor={activeScene.playerColor}
                        isMyTurn={expectsMove && !resolved}
                        legalMoves={legalMoves}
                        selectedSquare={selectedSquare}
                        lastMove={gameState.moveHistory[gameState.moveHistory.length - 1] ?? null}
                        isCheck={gameState.isCheck}
                        checkSquare={null}
                        onSquareClick={handleSquareClick}
                        onPieceDrop={handlePieceDrop}
                        disabled={!expectsMove || resolved}
                        squareHighlights={activeScene.highlights}
                        squareAnnotations={activeScene.annotations}
                        arrows={activeScene.arrows}
                        className="h-full w-full"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="min-h-0 overflow-hidden rounded-3xl border border-surface-hover bg-surface-alt/95">
            <div className="flex h-full flex-col">
              <div className="shrink-0 border-b border-surface-hover/70 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-primary-light/80">{t('lessons.player.lesson_flow')}</div>
                    <div className="mt-1 text-lg font-semibold text-text-bright">{activePanelTitle}</div>
                    <div className="mt-1 text-sm text-text-dim">
                      {phase === 'guided'
                        ? t('lessons.player.step_of', { current: guidedIndex + 1, total: lesson.guidedSteps.length })
                        : t('lessons.player.task_of', { current: practiceIndex + 1, total: lesson.practiceTasks.length })}
                    </div>
                  </div>
                  <div className="shrink-0 rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-text-dim">
                    {phaseStatusLabel}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                <div className="space-y-5">
                  <section>
                    <div className="text-xs uppercase tracking-[0.2em] text-primary-light/80">{t('lessons.player.concept_explanation')}</div>
                    <p className="mt-3 text-sm leading-relaxed text-text">{lesson.conceptExplanation}</p>
                  </section>

                  <section className={`rounded-2xl border p-4 ${
                    lesson.dependsOnCounting
                      ? 'border-amber-400/25 bg-amber-400/8'
                      : 'border-surface-hover/70 bg-surface/65'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs uppercase tracking-[0.2em] text-primary-light/80">{t('lessons.player.rule_impact')}</div>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
                        lesson.dependsOnCounting
                          ? 'border-amber-400/35 bg-amber-400/10 text-amber-200'
                          : 'border-surface-hover bg-surface text-text-dim'
                      }`}>
                        {lesson.dependsOnCounting ? t('lessons.player.counting_changes_evaluation') : t('lessons.player.counting_not_relevant')}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-text">{lesson.ruleImpact}</p>
                  </section>

                  <section className="rounded-2xl border border-surface-hover/70 bg-surface/65 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-[0.18em] text-primary-light/80">
                          {phaseLabel}
                        </div>
                        {activeStep && (
                          <>
                            <h2 className="mt-2 text-xl font-semibold text-text-bright">
                              {'title' in activeStep ? activeStep.title : t('lessons.player.practice_task')}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-text">
                              {'instruction' in activeStep ? activeStep.instruction : activeStep.prompt}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="hidden sm:block shrink-0">
                        <CoursePreviewBoard scene={lesson.example} />
                      </div>
                    </div>

                    {activeStep?.coachTip && (
                      <div className="mt-3 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-text">
                        {activeStep.coachTip}
                      </div>
                    )}

                    {phase === 'practice' && activeStep && 'teaching' in activeStep && (
                      <div className="mt-3 rounded-2xl border border-surface-hover/70 bg-surface-alt/70 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-primary-light/80">{t('lessons.player.why_this_move_works')}</div>
                        <div className="mt-3 space-y-3 text-sm text-text">
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.14em] text-text-dim">{t('lessons.player.problem')}</div>
                            <p className="mt-1 leading-relaxed text-text-bright">{activeStep.teaching.problem}</p>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.14em] text-text-dim">{t('lessons.player.what_it_fixes')}</div>
                            <p className="mt-1 leading-relaxed text-text-bright">{activeStep.teaching.fix}</p>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-[0.14em] text-text-dim">{t('lessons.player.new_threat')}</div>
                            <p className="mt-1 leading-relaxed text-text-bright">{activeStep.teaching.threat}</p>
                          </div>
                        </div>
                        <div className="mt-4 rounded-2xl border border-surface-hover/70 bg-surface/70 p-3">
                          <div className="text-[11px] uppercase tracking-[0.14em] text-text-dim">{t('lessons.player.after_the_move')}</div>
                          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-text-bright">
                            {activeStep.teaching.visibleOutcomes.map((outcome, index) => (
                              <li key={`${outcome}-${index}`} className="flex gap-2">
                                <span className="mt-[2px] text-primary-light">•</span>
                                <span>{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {phase === 'practice' && activeStep && 'candidateMoves' in activeStep && (
                      <div className="mt-3 rounded-2xl border border-surface-hover/70 bg-surface-alt/70 p-4">
                        <div className="text-xs uppercase tracking-[0.18em] text-primary-light/80">{t('lessons.player.compare_moves')}</div>
                        <div className="mt-3 space-y-3">
                          {activeStep.candidateMoves.map((candidate, index) => (
                            <div key={`${formatMoveLabel(candidate.move)}-${index}`} className="rounded-2xl border border-surface-hover/70 bg-surface/70 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-sm font-semibold text-text-bright">{formatMoveLabel(candidate.move)}</div>
                                <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
                                  candidate.verdict === 'correct'
                                    ? 'border-primary/35 bg-primary/10 text-primary-light'
                                    : 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300'
                                }`}>
                                  {candidate.verdict === 'correct' ? t('lessons.player.best_move') : t('lessons.player.tempting_move')}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-relaxed text-text-dim">{candidate.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {feedback && (
                      <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${feedbackClasses}`}>
                        {feedback.message}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {phase === 'guided' && lesson.guidedSteps.map((step, index) => (
                        <span
                          key={step.id}
                          className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
                            index === guidedIndex
                              ? 'border-primary/35 bg-primary/10 text-primary-light'
                              : 'border-surface-hover bg-surface text-text-dim'
                          }`}
                        >
                          {t('lessons.player.step_badge', { number: index + 1 })}
                        </span>
                      ))}
                      {phase === 'practice' && lesson.practiceTasks.map((task, index) => (
                        <span
                          key={task.id}
                          className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${
                            index === practiceIndex
                              ? 'border-primary/35 bg-primary/10 text-primary-light'
                              : index < practiceIndex || lessonCompleted
                                ? 'border-primary/25 bg-primary/8 text-primary-light'
                                : 'border-surface-hover bg-surface text-text-dim'
                          }`}
                        >
                          {t('lessons.player.task_badge', { number: index + 1 })}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {phase === 'guided' && !expectsMove && (
                        <button
                          onClick={goForward}
                          className="rounded-xl bg-primary hover:bg-primary-light text-white font-semibold px-4 py-2.5 transition-colors"
                        >
                          {guidedIndex === lesson.guidedSteps.length - 1 ? t('lessons.player.start_mini_practice') : t('lessons.player.next_step')}
                        </button>
                      )}
                      {expectsMove && resolved && (
                        <button
                          onClick={goForward}
                          className="rounded-xl bg-primary hover:bg-primary-light text-white font-semibold px-4 py-2.5 transition-colors"
                        >
                          {phase === 'guided'
                            ? (guidedIndex === lesson.guidedSteps.length - 1 ? t('lessons.player.start_mini_practice') : t('lessons.player.next_step'))
                            : (practiceIndex === lesson.practiceTasks.length - 1 ? t('lessons.player.review_summary') : t('lessons.player.next_task'))}
                        </button>
                      )}
                      {phase === 'practice' && lessonCompleted && practiceIndex === lesson.practiceTasks.length - 1 && (
                        <button
                          onClick={() => nextLessonId ? navigate(lessonRoute(nextLessonId)) : navigate(routes.coursePath)}
                          className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-primary-light font-semibold transition-colors hover:bg-primary/15"
                        >
                          {nextLessonId ? t('lessons.player.next_lesson') : t('lessons.player.back_to_course')}
                        </button>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className="text-xs uppercase tracking-[0.2em] text-primary-light/80">{t('lessons.player.summary')}</div>
                    <p className="mt-3 text-sm leading-relaxed text-text">{lesson.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lesson.concepts.map((concept) => (
                        <span key={concept} className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                          {formatConceptLabel(concept)}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="text-xs uppercase tracking-[0.2em] text-primary-light/80">{t('lessons.player.puzzles_reinforce')}</div>
                    <p className="mt-2 text-sm text-text-dim">
                      {t('lessons.player.puzzles_reinforce_desc')}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lesson.puzzleConcepts.map((concept) => (
                        <span key={concept} className="rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-xs text-primary-light">
                          {formatConceptLabel(concept)}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      {relatedPuzzles.length > 0 ? relatedPuzzles.map((puzzle) => (
                        <button
                          key={puzzle.id}
                          onClick={() => navigate(puzzleRoute(String(puzzle.id)))}
                          className="w-full rounded-2xl border border-surface-hover bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-hover"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-text-bright">#{puzzle.id} · {getPublicPuzzleTitle(puzzle.title)}</div>
                              <div className="mt-1 text-sm text-text-dim">{puzzle.description}</div>
                            </div>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] ${getDifficultyBadgeClasses(puzzle.difficulty)}`}>
                              {t(`puzzle.${puzzle.difficulty}`)}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {puzzle.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded-full border border-surface-hover bg-surface-alt px-2.5 py-1 text-xs text-text-dim">
                                {formatConceptLabel(tag)}
                              </span>
                            ))}
                          </div>
                        </button>
                      )) : (
                        <div className="rounded-2xl border border-dashed border-surface-hover bg-surface px-4 py-4 text-sm text-text-dim">
                          {t('lessons.player.more_puzzles_coming')}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="shrink-0 border-t border-surface-hover/70 px-4 py-3 sm:px-5">
                <div className="flex gap-2 flex-wrap">
                  {previousLessonId && (
                    <button
                      onClick={() => navigate(lessonRoute(previousLessonId))}
                      className="flex-1 min-w-0 py-2.5 px-3 bg-surface hover:bg-surface-hover text-text text-sm rounded-xl border border-surface-hover transition-colors"
                    >
                      {t('lessons.player.previous_lesson')}
                    </button>
                  )}
                  <button
                    onClick={() => navigate(routes.coursePath)}
                    className="flex-1 min-w-0 py-2.5 px-3 bg-surface hover:bg-surface-hover text-text text-sm rounded-xl border border-surface-hover transition-colors"
                  >
                    {t('lessons.player.course_path')}
                  </button>
                  {nextLessonId && (
                    <button
                      onClick={() => navigate(lessonRoute(nextLessonId))}
                      className="flex-1 min-w-0 py-2.5 px-3 bg-surface hover:bg-surface-hover text-text text-sm rounded-xl border border-surface-hover transition-colors"
                    >
                      {t('lessons.player.next_lesson')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function LessonPlayerPage() {
  return <StructuredLessonPlayer />;
}

export { LessonCoursePage, LessonPlayerPage };
export default LessonCoursePage;
