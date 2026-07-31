import { useEffect, useMemo, useState } from 'react';
import { getLastMoveForView, getLegalMoves, makeMove } from '@shared/engine';
import type { GameState, Position } from '@shared/types';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonRoute, puzzleRoute, routes } from '../lib/routes';
import {
  getLessonById,
  getNextLessonId,
  getPreviousLessonId,
  type LessonPracticeTask,
  type LessonStep,
} from '../lib/lessons';
import { getRelatedPuzzlesForLesson } from '../lib/lessonPuzzles';
import { useLessonProgress } from '../lib/lessonProgress';
import { useTranslation } from '../lib/i18n';
import Header from './Header';
import Board from './Board';
import { useSquareFitSize } from '../hooks/useSquareFitSize';
import {
  createLessonGameState,
  formatMoveLabel,
  getPublicPuzzleTitle,
  shouldLogLessonDebug,
} from '../lib/lessonSharedUtils';

function StructuredLessonPlayer() {
  return useStructuredLessonPlayerScreen();
}

function useStructuredLessonPlayerScreen() {
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
          <button type="button"
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
    ? 'border-accent/35 bg-accent/12 text-text-bright'
    : feedback?.tone === 'error'
      ? 'border-danger/35 bg-danger/12 text-danger'
      : 'border-surface-hover bg-surface-alt text-text-dim';

  const activePanelTitle = activeStep && 'title' in activeStep ? activeStep.title : t('lessons.player.practice_task');
  const progressLabel = phase === 'guided'
    ? t('lessons.player.step_of', { current: guidedIndex + 1, total: lesson.guidedSteps.length })
    : t('lessons.player.task_of', { current: practiceIndex + 1, total: lesson.practiceTasks.length });

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-surface">
      <Header
        active="lessons"
        subtitle={t('lessons.player.header_subtitle', { title: lesson.title })}
        right={(
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(routes.coursePath)}
              className="text-sm text-text-dim transition-colors hover:text-text-bright"
            >
              {t('lessons.player.course_path')}
            </button>
            <button
              type="button"
              onClick={() => navigate(routes.puzzles)}
              className="text-sm text-text-dim transition-colors hover:text-text-bright"
            >
              {t('nav.puzzles')}
            </button>
          </div>
        )}
      />

      <main id="main-content" className="flex-1 overflow-hidden px-3 py-3 sm:px-4 sm:py-4">
        <div className="mx-auto grid h-full max-w-[1400px] grid-rows-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-3 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-1">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-[0.9rem] border border-surface-hover/70 bg-surface-alt/60 p-3 sm:p-4">
            <header className="shrink-0 border-b border-surface-hover/60 pb-3">
              <h1 className="text-xl font-bold tracking-tight text-text-bright sm:text-2xl">
                {lesson.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-text-dim">{lesson.objective}</p>
              <p className="mt-2 text-sm text-text-dim">
                {t(`puzzle.${lesson.level}`)}
                {' · '}
                {t('lessons.course.lesson_label', { order: lesson.order })}
                {' · '}
                {progressLabel}
              </p>
            </header>

            <div className="min-h-0 flex-1 pt-3 sm:pt-4">
              <div
                ref={boardStageRef}
                data-testid="lesson-board-stage"
                className="flex h-full min-h-0 items-center justify-center overflow-hidden"
              >
                <div
                  data-testid="lesson-board-frame"
                  className="max-h-full max-w-full shrink-0"
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
                      lastMove={getLastMoveForView(gameState)}
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
          </section>

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[0.9rem] border border-surface-hover/70 bg-surface-alt/80">
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <h2 className="text-xl font-bold tracking-tight text-text-bright">{activePanelTitle}</h2>
              <p className="mt-1 text-sm text-text-dim">{progressLabel}</p>

              {activeStep && (
                <p className="mt-4 text-sm leading-relaxed text-text-bright">
                  {'instruction' in activeStep ? activeStep.instruction : activeStep.prompt}
                </p>
              )}

              {activeStep?.coachTip && (
                <p className="mt-3 text-sm leading-relaxed text-text-dim">{activeStep.coachTip}</p>
              )}

              <p className="mt-5 text-sm leading-relaxed text-text-dim">{lesson.conceptExplanation}</p>

              {lesson.ruleImpact && (
                <p className="mt-3 text-sm leading-relaxed text-text-dim">{lesson.ruleImpact}</p>
              )}

              {phase === 'practice' && activeStep && 'teaching' in activeStep && (
                <div className="mt-5 space-y-3 text-sm">
                  <p className="leading-relaxed text-text-dim">
                    <span className="font-medium text-text-bright">{t('lessons.player.problem')}: </span>
                    {activeStep.teaching.problem}
                  </p>
                  <p className="leading-relaxed text-text-dim">
                    <span className="font-medium text-text-bright">{t('lessons.player.what_it_fixes')}: </span>
                    {activeStep.teaching.fix}
                  </p>
                  <p className="leading-relaxed text-text-dim">
                    <span className="font-medium text-text-bright">{t('lessons.player.new_threat')}: </span>
                    {activeStep.teaching.threat}
                  </p>
                  <ul className="space-y-2 text-text-dim">
                    {activeStep.teaching.visibleOutcomes.map((outcome) => (
                      <li key={outcome} className="leading-relaxed">— {outcome}</li>
                    ))}
                  </ul>
                </div>
              )}

              {phase === 'practice' && activeStep && 'candidateMoves' in activeStep && (
                <ul className="mt-5 divide-y divide-surface-hover/70 border-y border-surface-hover/70">
                  {activeStep.candidateMoves.map((candidate) => (
                    <li
                      key={`${candidate.move.from.row}${candidate.move.from.col}-${candidate.move.to.row}${candidate.move.to.col}`}
                      className="py-3"
                    >
                      <p className="text-sm font-semibold text-text-bright">
                        {formatMoveLabel(candidate.move)}
                        <span className="ml-2 font-medium text-text-dim">
                          {candidate.verdict === 'correct' ? t('lessons.player.best_move') : t('lessons.player.tempting_move')}
                        </span>
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-text-dim">{candidate.explanation}</p>
                    </li>
                  ))}
                </ul>
              )}

              {feedback && (
                <p className={`mt-4 rounded-[0.6rem] border px-3 py-2.5 text-sm ${feedbackClasses}`}>
                  {feedback.message}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {phase === 'guided' && !expectsMove && (
                  <button
                    type="button"
                    onClick={goForward}
                    className="button-accent-contrast rounded-[0.6rem] px-4 py-2.5 text-sm font-bold"
                  >
                    {guidedIndex === lesson.guidedSteps.length - 1
                      ? t('lessons.player.start_mini_practice')
                      : t('lessons.player.next_step')}
                  </button>
                )}
                {expectsMove && resolved && (
                  <button
                    type="button"
                    onClick={goForward}
                    className="button-accent-contrast rounded-[0.6rem] px-4 py-2.5 text-sm font-bold"
                  >
                    {phase === 'guided'
                      ? (guidedIndex === lesson.guidedSteps.length - 1
                        ? t('lessons.player.start_mini_practice')
                        : t('lessons.player.next_step'))
                      : (practiceIndex === lesson.practiceTasks.length - 1
                        ? t('lessons.player.review_summary')
                        : t('lessons.player.next_task'))}
                  </button>
                )}
                {phase === 'practice' && lessonCompleted && practiceIndex === lesson.practiceTasks.length - 1 && (
                  <button
                    type="button"
                    onClick={() => (nextLessonId ? navigate(lessonRoute(nextLessonId)) : navigate(routes.coursePath))}
                    className="ui-btn-secondary px-4 py-2.5 text-sm"
                  >
                    {nextLessonId ? t('lessons.player.next_lesson') : t('lessons.player.back_to_course')}
                  </button>
                )}
              </div>

              <p className="mt-8 text-sm leading-relaxed text-text-dim">{lesson.summary}</p>

              <section className="mt-8">
                  <h3 className="text-base font-semibold text-text-bright">
                    {t('lessons.player.puzzles_reinforce')}
                  </h3>
                  <p className="mt-1 text-sm text-text-dim">{t('lessons.player.puzzles_reinforce_desc')}</p>
                  {relatedPuzzles.length > 0 ? (
                    <ul className="mt-3 divide-y divide-surface-hover/70 border-y border-surface-hover/70">
                      {relatedPuzzles.map((puzzle) => (
                        <li key={puzzle.id}>
                          <button
                            type="button"
                            onClick={() => navigate(puzzleRoute(String(puzzle.id)))}
                            className="flex w-full flex-col gap-1 py-3 text-left transition-colors hover:bg-surface-hover/40"
                          >
                            <span className="font-medium text-text-bright">
                              #{puzzle.id} · {getPublicPuzzleTitle(puzzle.title)}
                            </span>
                            <span className="text-sm text-text-dim">{puzzle.description}</span>
                            <span className="text-xs text-text-dim">{t(`puzzle.${puzzle.difficulty}`)}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-text-dim">{t('lessons.player.more_puzzles_coming')}</p>
                  )}
                </section>
            </div>

            <div className="shrink-0 border-t border-surface-hover/60 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap gap-2">
                {previousLessonId && (
                  <button
                    type="button"
                    onClick={() => navigate(lessonRoute(previousLessonId))}
                    className="ui-btn-secondary min-w-0 flex-1 px-3 py-2.5 text-sm"
                  >
                    {t('lessons.player.previous_lesson')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(routes.coursePath)}
                  className="ui-btn-secondary min-w-0 flex-1 px-3 py-2.5 text-sm"
                >
                  {t('lessons.player.course_path')}
                </button>
                {nextLessonId && (
                  <button
                    type="button"
                    onClick={() => navigate(lessonRoute(nextLessonId))}
                    className="ui-btn-secondary min-w-0 flex-1 px-3 py-2.5 text-sm"
                  >
                    {t('lessons.player.next_lesson')}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}


export default function LessonPlayerPage() {
  return <StructuredLessonPlayer />;
}
