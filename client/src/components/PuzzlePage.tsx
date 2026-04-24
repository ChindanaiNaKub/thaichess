import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Position, Move, GameState } from '@shared/types';
import { getLastMoveForView, getLegalMoves, makeMove } from '@shared/engine';
import { ALL_PUZZLES, PUZZLES, STREAK_SURFACE_PUZZLES, type Puzzle } from '@shared/puzzlesRuntime';
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
import { pickRandomPuzzleId, rememberRandomPuzzleVisit } from '../lib/randomPuzzles';
import { puzzleRoute, routes } from '../lib/routes';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Header from './Header';
import Board from './Board';
import MoveHistory from './MoveHistory';

type PuzzleStatus = 'playing' | 'success' | 'failed';
type PuzzleListFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
type StreakMilestoneTone = 'improving' | 'harder' | null;
const RANDOM_RESULT_HISTORY_STORAGE_KEY = 'thaichess-random-puzzle-result-history';
const MAX_RANDOM_RESULT_HISTORY = 16;

type RandomResultEntry = {
  puzzleId: number;
  outcome: 'success' | 'failed';
};

function readRandomResultHistory(): RandomResultEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(RANDOM_RESULT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is RandomResultEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as { puzzleId?: unknown }).puzzleId === 'number' &&
      ((entry as { outcome?: unknown }).outcome === 'success' || (entry as { outcome?: unknown }).outcome === 'failed'),
    );
  } catch {
    return [];
  }
}

function writeRandomResultHistory(history: RandomResultEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      RANDOM_RESULT_HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(-MAX_RANDOM_RESULT_HISTORY)),
    );
  } catch {
    // Ignore storage errors and keep puzzle flow running.
  }
}

interface StreakFeedback {
  tone: 'neutral' | 'success' | 'failed';
  title: string;
  detail: string;
}

function movesMatch(
  left: Pick<Move, 'from' | 'to'> | null,
  right: Pick<Move, 'from' | 'to'> | null,
): boolean {
  if (!left || !right) return false;

  return left.from.row === right.from.row &&
    left.from.col === right.from.col &&
    left.to.row === right.to.row &&
    left.to.col === right.to.col;
}

function getPuzzleFailureDetail(puzzle: Puzzle, attemptedMove: Pick<Move, 'from' | 'to'> | null): string {
  if (movesMatch(attemptedMove, puzzle.commonWrongMove)) {
    return puzzle.wrongMoveExplanation;
  }

  return `${puzzle.wrongMoveExplanation} ${puzzle.takeaway}`;
}

const PUZZLE_FILTERS: PuzzleListFilter[] = ['all', 'beginner', 'intermediate', 'advanced'];

function getPublicPuzzleTitle(title: string): string {
  return title
    .replace(/\s*\([0-9a-f]{8}\s*@\s*ply\s*\d+\)$/i, '')
    .replace(/^Real-Game\s+/i, '')
    .trim();
}

function translatePuzzleContent(
  text: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (!text) return text;

  // Try exact match first
  const exactKey = `puzzleContent.${text}`;
  const translated = t(exactKey);
  if (translated !== exactKey) {
    return translated;
  }

  // Try partial matches for common patterns (case insensitive)
  const lowerText = text.toLowerCase();

  if (lowerText.includes('win material in 1')) {
    return text.replace(/Win material in 1/i, t('puzzleContent.Win material in 1'));
  }
  if (lowerText.includes('win material in 2')) {
    return text.replace(/Win material in 2/i, t('puzzleContent.Win material in 2'));
  }
  if (lowerText.includes('win material in 3')) {
    return text.replace(/Win material in 3/i, t('puzzleContent.Win material in 3'));
  }
  if (lowerText.includes('create two threats at once')) {
    return t('puzzleContent.Create two threats at once so the defender cannot cover both');
  }
  if (lowerText.includes('editorial training collection')) {
    return text
      .replace(/Editorial training collection/i, t('puzzleContent.Editorial training collection'))
      .replace(/reviewed practical fragment/i, t('puzzleContent.reviewed practical fragment'));
  }
  if (lowerText.includes('beginner double attack')) {
    return t('puzzleContent.Beginner double attack');
  }
  if (lowerText.includes('beginner pin and restriction')) {
    return t('puzzleContent.Beginner pin and restriction');
  }
  if (lowerText.includes('editorial-review')) {
    return text.replace(/editorial-review/i, t('puzzleContent.editorial-review'));
  }

  return text;
}

function getPuzzleSourceLabel(
  source: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const ratedGameMatch = source.match(/^Exported rated game [0-9a-f]+ \(ply (\d+)\)$/i);
  if (ratedGameMatch) {
    return t('puzzle.source_real_game_ply', { ply: ratedGameMatch[1] });
  }

  if (source.startsWith('Starter pack:')) {
    return t('puzzle.source_starter_pack');
  }

  if (source.startsWith('Imported candidate batch:')) {
    return t('puzzle.source_review_batch');
  }

  const seedGameMatch = source.match(/^Seed game corpus:\s*[a-z0-9_-]+\s+\(ply (\d+)\)$/i);
  if (seedGameMatch) {
    return t('puzzle.source_seed_game_ply', { ply: seedGameMatch[1] });
  }

  if (source.startsWith('Curated tactic:')) {
    return t('puzzle.source_curated_tactic');
  }

  if (source.startsWith('Tactical motif:')) {
    return t('puzzle.source_tactical_motif');
  }

  return source;
}

function getPuzzleOriginLabel(
  puzzle: Puzzle,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (puzzle.origin === 'engine-generated') {
    return t('puzzle.source_generated');
  }

  return t('puzzle.source_community');
}

function getPuzzleOriginBadgeClasses(origin: Puzzle['origin']): string {
  if (origin === 'engine-generated') {
    return 'border-accent/35 bg-accent/12 text-accent';
  }

  return 'border-primary/35 bg-primary/12 text-primary-light';
}

function formatActivityDate(timestamp: number, lang: string): string {
  return new Intl.DateTimeFormat(lang === 'th' ? 'th-TH' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp * 1000));
}

function formatPuzzleTag(tag: string): string {
  return tag
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getDifficultyTextClasses(difficulty: Puzzle['difficulty']): string {
  switch (difficulty) {
    case 'beginner':
      return 'text-green-400';
    case 'intermediate':
      return 'text-yellow-400';
    case 'advanced':
      return 'text-red-400';
    default:
      return 'text-text';
  }
}

function getDifficultyBadgeClasses(difficulty: Puzzle['difficulty']): string {
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

function getFeedbackClasses(tone: StreakFeedback['tone']): string {
  switch (tone) {
    case 'success':
      return 'border-primary/35 bg-primary/12 text-primary-light';
    case 'failed':
      return 'border-danger/35 bg-danger/12 text-danger';
    default:
      return 'border-accent/25 bg-accent/10 text-text-bright';
  }
}

function getVerificationLabel(
  puzzle: Puzzle,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string | null {
  switch (puzzle.verification?.verificationStatus ?? 'unverified') {
    case 'engine_verified':
      return t('puzzle.verification_engine_verified');
    case 'solver_verified':
      return t('puzzle.verification_solver_verified');
    case 'ambiguous':
      return t('puzzle.verification_needs_review');
    case 'count_invalid':
      return t('puzzle.verification_count_sensitive');
    case 'unverified':
    default:
      return null;
  }
}

function getCountCriticalityLabel(
  puzzle: Puzzle,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string | null {
  switch (puzzle.verification?.countCriticality ?? 'none') {
    case 'critical':
      return t('puzzle.count_critical');
    case 'active':
      return t('puzzle.count_active');
    default:
      return null;
  }
}

function getPuzzleIdentityBadges(
  puzzle: Puzzle,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string[] {
  return [
    t(`theme.${puzzle.theme}`),
    puzzle.motif ? translatePuzzleContent(puzzle.motif, t) : null,
    getPuzzleSourceLabel(puzzle.source, t),
    getVerificationLabel(puzzle, t),
    getCountCriticalityLabel(puzzle, t),
  ].filter((entry): entry is string => Boolean(entry && entry.trim().length > 0));
}

function getCompactPuzzleIdentityBadges(
  puzzle: Puzzle,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string[] {
  return [
    t(`theme.${puzzle.theme}`),
    puzzle.motif ? translatePuzzleContent(puzzle.motif, t) : null,
  ].filter((entry): entry is string => Boolean(entry && entry.trim().length > 0));
}

function buildReplayState(
  puzzle: Puzzle,
  liveState: GameState,
  reviewMoveIndex: number | null,
): GameState {
  if (reviewMoveIndex === null) {
    return liveState;
  }

  let replayState = createGameStateFromPuzzle(puzzle);
  if (reviewMoveIndex < 0) {
    return replayState;
  }

  const cappedIndex = Math.min(reviewMoveIndex, liveState.moveHistory.length - 1);
  for (let index = 0; index <= cappedIndex; index += 1) {
    const move = liveState.moveHistory[index];
    const nextState = makeMove(replayState, move.from, move.to);
    if (!nextState) {
      return liveState;
    }

    replayState = nextState;
  }

  return replayState;
}

function CoachSection({
  label,
  title,
  body,
  tone = 'surface',
  children,
}: {
  label: string;
  title?: string | null;
  body: string;
  tone?: 'surface' | 'accent' | 'primary' | 'danger';
  children?: ReactNode;
}) {
  const toneClasses = {
    surface: 'border-surface-hover bg-surface-alt',
    accent: 'border-accent/30 bg-accent/10',
    primary: 'border-primary/30 bg-primary/10',
    danger: 'border-danger/30 bg-danger/10',
  }[tone];

  return (
    <section className={`rounded-2xl border p-4 ${toneClasses}`}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-primary/80">{label}</p>
      {title && <h3 className="mt-2 text-base font-semibold text-text-bright">{title}</h3>}
      <p className="mt-2 text-sm leading-6 text-text-dim">{body}</p>
      {children && <div className="mt-3 border-t border-surface-hover/70 pt-3">{children}</div>}
    </section>
  );
}

function PuzzleLessonsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<PuzzleListFilter>('all');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const { completedPuzzleIds, completedPuzzleSet } = usePuzzleProgress();
  const puzzleSummary = usePuzzleProgressSummary();

  const puzzlesForFilter = (difficulty: PuzzleListFilter) => (
    difficulty === 'all'
      ? PUZZLES
      : PUZZLES.filter(p => p.difficulty === difficulty)
  );

  const difficultyFilteredPuzzles = puzzlesForFilter(filter);
  const availableThemes = Array.from(
    difficultyFilteredPuzzles.reduce((themes, puzzle) => {
      themes.set(puzzle.theme, (themes.get(puzzle.theme) ?? 0) + 1);
      return themes;
    }, new Map<string, number>()),
  )
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });

  useEffect(() => {
    if (themeFilter === 'all') return;
    const themeStillVisible = availableThemes.some(([theme]) => theme === themeFilter);
    if (!themeStillVisible) {
      setThemeFilter('all');
    }
  }, [availableThemes, themeFilter]);

  const filteredPuzzles = themeFilter === 'all'
    ? difficultyFilteredPuzzles
    : difficultyFilteredPuzzles.filter(puzzle => puzzle.theme === themeFilter);
  const completedInFilter = filteredPuzzles.filter(puzzle => completedPuzzleSet.has(puzzle.id));
  const unsolvedInFilter = filteredPuzzles.filter(puzzle => !completedPuzzleSet.has(puzzle.id));
  const sortedFilteredPuzzles = [...unsolvedInFilter, ...completedInFilter];
  const recommendedPuzzle = puzzleSummary.nextPuzzle && filteredPuzzles.some(candidate => candidate.id === puzzleSummary.nextPuzzle?.id)
    ? puzzleSummary.nextPuzzle
    : unsolvedInFilter[0] ?? filteredPuzzles[0] ?? null;
  const filterCompletionPercent = filteredPuzzles.length > 0
    ? Math.round((completedInFilter.length / filteredPuzzles.length) * 100)
    : 0;

  const filterThemeSummary = Array.from(
    filteredPuzzles.reduce((themes, puzzle) => {
      themes.set(puzzle.theme, (themes.get(puzzle.theme) ?? 0) + 1);
      return themes;
    }, new Map<string, number>()),
  )
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 3);

  const filterLabels: Record<PuzzleListFilter, string> = {
    all: t('puzzle.all_lessons'),
    beginner: t('puzzle.beginner'),
    intermediate: t('puzzle.intermediate'),
    advanced: t('puzzle.advanced'),
  };

  const filterDescriptions: Record<PuzzleListFilter, string> = {
    all: t('puzzle.filter_all_desc'),
    beginner: t('puzzle.filter_beginner_desc'),
    intermediate: t('puzzle.filter_intermediate_desc'),
    advanced: t('puzzle.filter_advanced_desc'),
  };

  const selectionLabel = themeFilter === 'all'
    ? filterLabels[filter]
    : `${filterLabels[filter]} · ${t(`theme.${themeFilter}`)}`;

  const emptyTitle = themeFilter === 'all'
    ? t('puzzle.empty_title')
    : t('puzzle.empty_theme_title', { theme: t(`theme.${themeFilter}`) });

  const emptyDesc = themeFilter === 'all'
    ? t('puzzle.empty_desc')
    : t('puzzle.empty_theme_desc', { theme: t(`theme.${themeFilter}`), track: filterLabels[filter] });

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:h-screen lg:overflow-hidden">
      <Header
        active="puzzles"
        subtitle={t('puzzle.lessons_nav')}
      />

      <main id="main-content" className="flex-1 px-4 py-6 sm:py-8 max-w-5xl mx-auto w-full">
        <div className="grid gap-4 mb-6 sm:mb-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
          <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-alt to-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary/80 mb-2">{t('puzzle.lessons_eyebrow')}</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-text-bright mb-2">{t('puzzle.lessons_title')}</h2>
                <p className="text-text-dim text-sm sm:text-base max-w-2xl">
                  {t('puzzle.lessons_desc')}
                </p>
              </div>
              <div className="rounded-xl border border-primary/25 bg-surface/80 px-4 py-3 min-w-[168px]">
                <p className="text-xs uppercase tracking-[0.18em] text-text-dim mb-1">{t('puzzle.completed_summary')}</p>
                <p className="text-xl font-semibold text-text-bright">
                  {t('puzzle.completed', { done: completedPuzzleIds.length, total: PUZZLES.length })}
                </p>
                <p className="text-xs text-text-dim mt-1">{t('puzzle.progress_hint')}</p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="text-text-bright font-medium">
                  {t('puzzle.track_progress', { track: selectionLabel })}
                </p>
                <p className="text-text-dim">
                  {t('puzzle.track_completed', { done: completedInFilter.length, total: filteredPuzzles.length })}
                </p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${filterCompletionPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-surface-hover bg-surface/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-dim mb-1">{t('puzzle.filter_label')}</p>
                <p className="font-semibold text-text-bright">{selectionLabel}</p>
                <p className="text-xs text-text-dim mt-1">{filterDescriptions[filter]}</p>
              </div>
              <div className="rounded-xl border border-surface-hover bg-surface/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-dim mb-1">{t('puzzle.remaining_label')}</p>
                <p className="font-semibold text-text-bright">{unsolvedInFilter.length}</p>
                <p className="text-xs text-text-dim mt-1">{t('puzzle.remaining_desc')}</p>
              </div>
              <div className="rounded-xl border border-surface-hover bg-surface/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-text-dim mb-1">{t('puzzle.focus_label')}</p>
                <p className="font-semibold text-text-bright">
                  {filterThemeSummary.length > 0
                    ? filterThemeSummary.map(([theme]) => t(`theme.${theme}`)).join(' · ')
                    : t('puzzle.focus_empty')}
                </p>
                <p className="text-xs text-text-dim mt-1">{t('puzzle.focus_desc')}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-surface-hover bg-surface-alt p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-primary/80 mb-2">{t('puzzle.next_up')}</p>
            {recommendedPuzzle ? (
              <>
                <h3 className="text-xl font-semibold text-text-bright">
                  #{recommendedPuzzle.id} · {getPublicPuzzleTitle(recommendedPuzzle.title)}
                </h3>
                <p className="text-sm text-text-dim mt-2">{recommendedPuzzle.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className={`text-xs px-2 py-1 rounded border ${getDifficultyBadgeClasses(recommendedPuzzle.difficulty)}`}>
                    {t(`puzzle.${recommendedPuzzle.difficulty}`)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-surface border border-surface-hover text-text-dim">
                    {t(`theme.${recommendedPuzzle.theme}`)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-surface border border-surface-hover text-text-dim">
                    {t('puzzle.rating_short', { score: recommendedPuzzle.difficultyScore })}
                  </span>
                </div>
                <p className="text-xs text-text-dim mt-4">
                  {completedPuzzleSet.has(recommendedPuzzle.id)
                    ? t('puzzle.next_up_review')
                    : t('puzzle.next_up_fresh')}
                </p>
                <button
                  onClick={() => navigate(puzzleRoute(String(recommendedPuzzle.id)))}
                  className="mt-4 w-full rounded-xl bg-primary hover:bg-primary-light text-white font-semibold px-4 py-3 transition-colors"
                >
                  {completedPuzzleSet.has(recommendedPuzzle.id) ? t('common.retry') : t('puzzle.start_here')}
                </button>
              </>
            ) : (
              <div className="rounded-xl border border-surface-hover bg-surface/70 px-4 py-4">
                <h3 className="text-lg font-semibold text-text-bright">{emptyTitle}</h3>
                <p className="text-sm text-text-dim mt-2">{emptyDesc}</p>
              </div>
            )}
          </aside>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-text-bright">{t('puzzle.lessons_tracks_title')}</h3>
            <p className="text-sm text-text-dim mt-1">{t('puzzle.lessons_tracks_desc')}</p>
          </div>
          <button
            onClick={() => navigate(routes.puzzleStreak)}
            className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/15"
          >
            {t('puzzle.play_streak')}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 sm:grid-cols-4">
          {PUZZLE_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl border px-3 py-3 text-left transition-all ${
                filter === f
                  ? 'bg-primary/15 border-primary/40 text-text-bright shadow-lg shadow-primary/10'
                  : 'bg-surface-alt hover:bg-surface-hover text-text border-surface-hover'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{filterLabels[f]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  filter === f ? 'border-primary/40 text-primary-light' : 'border-surface-hover text-text-dim'
                }`}>
                  {puzzlesForFilter(f).length}
                </span>
              </div>
              <p className={`mt-1 text-xs ${filter === f ? 'text-text' : 'text-text-dim'}`}>
                {filterDescriptions[f]}
              </p>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-text-bright">{t('puzzle.theme_drill_title')}</h3>
              <p className="text-sm text-text-dim mt-1">{t('puzzle.theme_drill_desc')}</p>
            </div>
            <p className="text-sm text-text-dim">
              {t('puzzle.theme_drill_count', { count: availableThemes.length })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setThemeFilter('all')}
              className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                themeFilter === 'all'
                  ? 'bg-primary/15 border-primary/40 text-text-bright'
                  : 'bg-surface-alt border-surface-hover text-text hover:bg-surface-hover'
              }`}
            >
              {t('puzzle.theme_all')}
            </button>
            {availableThemes.map(([theme, count]) => (
              <button
                key={theme}
                onClick={() => setThemeFilter(theme)}
                className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                  themeFilter === theme
                    ? 'bg-primary/15 border-primary/40 text-text-bright'
                    : 'bg-surface-alt border-surface-hover text-text hover:bg-surface-hover'
                }`}
              >
                {t(`theme.${theme}`)} <span className="text-text-dim">{count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-text-bright">{t('puzzle.practice_title')}</h3>
            <p className="text-sm text-text-dim mt-1">{t('puzzle.practice_desc')}</p>
          </div>
          {filteredPuzzles.length > 0 && (
            <p className="text-sm text-text-dim">
              {t('puzzle.track_completed', { done: completedInFilter.length, total: filteredPuzzles.length })}
            </p>
          )}
        </div>

        {filteredPuzzles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-surface-hover bg-surface-alt p-8 text-center">
            <h3 className="text-xl font-semibold text-text-bright">{emptyTitle}</h3>
            <p className="text-sm text-text-dim mt-2">{emptyDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedFilteredPuzzles.map((puzzle, index) => {
              const isCompleted = completedPuzzleSet.has(puzzle.id);
              const isRecommended = recommendedPuzzle?.id === puzzle.id && !isCompleted && index === 0;

              return (
                <button
                  key={puzzle.id}
                  onClick={() => navigate(puzzleRoute(String(puzzle.id)))}
                  className={`rounded-2xl p-4 sm:p-5 text-left transition-all group border ${
                    isRecommended
                      ? 'bg-primary/10 border-primary/35 hover:border-primary/55 shadow-lg shadow-primary/10'
                      : isCompleted
                        ? 'bg-surface-alt/80 border-surface-hover hover:border-primary/35'
                        : 'bg-surface-alt border-surface-hover hover:border-primary/50 hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {isRecommended && (
                          <span className="text-[11px] uppercase tracking-[0.18em] text-primary-light bg-primary/15 border border-primary/30 rounded-full px-2 py-1">
                            {t('puzzle.start_here')}
                          </span>
                        )}
                        <span className={`text-[11px] uppercase tracking-[0.18em] rounded-full px-2 py-1 border ${
                          isCompleted
                            ? 'text-primary border-primary/30 bg-primary/10'
                            : 'text-text-dim border-surface-hover bg-surface'
                        }`}>
                          {isCompleted ? t('puzzle.solved_badge') : t('puzzle.new_badge')}
                        </span>
                      </div>
                      <h3 className="font-semibold text-text-bright group-hover:text-primary-light transition-colors text-sm sm:text-base">
                        #{puzzle.id} · {getPublicPuzzleTitle(puzzle.title)}
                      </h3>
                    </div>
                    {isCompleted && (
                      <span className="text-primary text-sm font-bold">✓</span>
                    )}
                  </div>
                  <p className="text-text-dim text-xs sm:text-sm mb-3">{puzzle.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border ${getDifficultyBadgeClasses(puzzle.difficulty)}`}>
                      {t(`puzzle.${puzzle.difficulty}`)}
                    </span>
                    <span className="text-xs text-text-dim px-2 py-0.5 rounded bg-surface border border-surface-hover">
                      {t(`theme.${puzzle.theme}`)}
                    </span>
                    <span className="text-xs text-text-dim px-2 py-0.5 rounded bg-surface border border-surface-hover">
                      {t('puzzle.rating_short', { score: puzzle.difficultyScore })}
                    </span>
                    {puzzle.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs text-text-dim px-2 py-0.5 rounded bg-surface border border-surface-hover">
                        {formatPuzzleTag(tag)}
                      </span>
                    ))}
                    <span className={`text-xs px-2 py-0.5 rounded border ${getPuzzleOriginBadgeClasses(puzzle.origin)}`}>
                      {getPuzzleOriginLabel(puzzle, t)}
                    </span>
                    <span className="text-xs text-text-dim px-2 py-0.5 rounded bg-surface border border-surface-hover">
                      {getPuzzleSourceLabel(puzzle.source, t)}
                    </span>
                    <span className="text-xs text-text-dim ml-auto">
                      {t('puzzle.to_move', { color: puzzle.sideToMove === 'white' ? t('common.white') : t('common.black') })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function PuzzleStreakPage() {
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
                className="rounded-2xl border border-primary/20 bg-[linear-gradient(155deg,rgba(92,160,26,0.14),rgba(39,30,24,0.92)_45%,rgba(22,18,14,0.98))] p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-primary-light/90">{t('puzzle.streak_eyebrow')}</p>
                    <h2 className="text-lg font-bold text-text-bright">{t('puzzle.streak_title')}</h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-text-dim">{t('puzzle.streak_desc')}</p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="relative min-w-0 rounded-xl border border-primary/20 bg-surface/80 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-dim">{t('puzzle.streak_score_label')}</p>
                    <p className="mt-1 text-xl font-bold text-text-bright sm:text-2xl">{score}</p>
                    {scoreFlash && (
                      <span className="pointer-events-none absolute right-3 -top-4 text-sm font-semibold text-primary-light animate-scoreFloat">
                        {scoreFlash}
                      </span>
                    )}
                  </div>
                  <div className={`min-w-0 rounded-xl border border-surface-hover bg-surface/80 px-3 py-2 ${isStreakPulsing ? 'animate-streakPulse' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-text-dim">{t('puzzle.streak_label')}</p>
                      {streakPulseIcon && (
                        <span
                          aria-label={`Streak pulse: ${milestoneMessage}`}
                          className="pointer-events-none inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-sm leading-none text-primary-light"
                        >
                          {streakPulseIcon}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xl font-bold text-text-bright sm:text-2xl">{streak}</p>
                  </div>
                  <div className="min-w-0 rounded-xl border border-surface-hover bg-surface/80 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-text-dim">{t('puzzle.streak_session_label')}</p>
                    <p className="mt-1 text-xl font-bold text-text-bright sm:text-2xl">{solvedCount}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-surface-hover bg-surface/75 px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="font-medium text-text-bright">{t('puzzle.streak_checkpoint_label')}</span>
                      <span className="text-text-dim">
                        {t('puzzle.streak_checkpoint_progress', {
                          current: solvedCount % STREAK_CHECKPOINT_INTERVAL,
                          total: STREAK_CHECKPOINT_INTERVAL,
                        })}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${checkpointProgress}%` }} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-surface-hover bg-surface/75 px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="font-medium text-text-bright">{t('puzzle.streak_flow_label')}</span>
                      <span className="text-text-dim">{t('puzzle.streak_flow_desc')}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${adaptiveProgress}%` }} />
                    </div>
                  </div>
                </div>
              </section>

              <div className={`rounded-2xl border p-4 ${getFeedbackClasses(feedback.tone)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-text-dim">
                      {t('puzzle.streak_puzzle_label', { number: currentPuzzle?.id ?? solvedCount + 1 })}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-text-bright">{streakTitle}</h3>
                    <p className="mt-1 text-sm text-text-dim">{feedback.title}</p>
                  </div>
                  <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-[11px] text-text-dim">
                    {t('puzzle.to_move', { color: currentTurnLabel })}
                  </span>
                </div>
                {streakIdentityBadges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {streakIdentityBadges.map((badge) => (
                      <span key={badge} className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-[11px] text-text-dim">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 border-t border-surface-hover/70 pt-3">
                  <p className="text-sm leading-6 text-text-dim">{streakMessage}</p>

                  {streakSubMessage && (
                    <div className="mt-3 rounded-xl border border-surface-hover/80 bg-surface/65 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-text-dim">
                        {feedback.tone === 'failed' ? t('puzzle.try_this_instead_label') : t('puzzle.position_label')}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-text-dim">{streakSubMessage}</p>
                    </div>
                  )}

                  {currentPuzzle && (
                    <div className="mt-3 rounded-xl border border-surface-hover/80 bg-surface/65 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-text-dim">{t('puzzle.source_evidence_label')}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${getPuzzleOriginBadgeClasses(currentPuzzle.origin)}`}>
                          {getPuzzleOriginLabel(currentPuzzle, t)}
                        </span>
                        <span className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text-dim">
                          {getPuzzleSourceLabel(currentPuzzle.source, t)}
                        </span>
                        {currentPuzzle.sourceGameUrl && (
                          <a
                            href={currentPuzzle.sourceGameUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-surface-hover bg-surface px-2.5 py-1 text-xs text-text hover:text-text-bright"
                          >
                            {t('puzzle.source_game_link')}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 rounded-xl border border-surface-hover/80 bg-surface/65 p-2.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleStreakHint}
                        disabled={status !== 'playing' || !currentPuzzle}
                        className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/50 hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {t('puzzle.hint')}
                      </button>
                      <button
                        onClick={handleRestartStreak}
                        className="rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-hover"
                      >
                        ↺ {t('common.new_game')}
                      </button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-text-dim">
                      {activeHint ? `${t('puzzle.hint')} ${hintStage}` : t('puzzle.hint_nudge')}
                    </p>
                  </div>
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

function PuzzlePlayer() {
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
      setHintStage(0);
      setShowHint(false);
      setFailureDetail(null);
      setReviewMoveIndex(null);
    }
  };

  const handleHint = () => {
    if (!puzzle || status !== 'playing') return;
    const nextHintStage = Math.min(3, hintStage + 1);
    setHintUsed(true);
    setHintStage(nextHintStage);
    setShowHint(true);
    window.setTimeout(() => setShowHint(false), 3000);
  };

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

  const getLastMove = (state: GameState | null): Move | null => {
    if (!state || state.moveHistory.length === 0) return null;
    return state.moveHistory[state.moveHistory.length - 1];
  };

  const getCheckSquare = (state: GameState | null): Position | null => {
    if (!state?.isCheck) return null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        if (piece && piece.type === 'K' && piece.color === state.turn) {
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
  const nextPuzzle = getNextPuzzle();
  const prevPuzzle = getPrevPuzzle();
  const solverColorLabel = puzzle.sideToMove === 'white' ? t('common.white') : t('common.black');
  const currentTurnLabel = puzzle.sideToMove === 'white' ? t('common.white') : t('common.black');
  const isSolverTurn = status === 'playing' && gameState?.turn === puzzle.sideToMove;
  const currentStep = gameState ? Math.min(gameState.moveHistory.length + 1, puzzle.solution.length) : 1;
  const activeGameState = useMemo(
    () => (gameState ? buildReplayState(puzzle, gameState, reviewMoveIndex) : null),
    [gameState, puzzle, reviewMoveIndex],
  );
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

  useEffect(() => {
    if (!isRandomMode || status === 'playing' || !puzzle) return;
    if (resolvedPuzzleIdRef.current !== puzzle.id) return;
    const outcomeKey = `${puzzle.id}:${status}`;
    if (recordedOutcomeRef.current === outcomeKey) return;

    const entry: RandomResultEntry = {
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
  }, [getPuzzleUrl, handleHint, handleRetry, navigate, nextPuzzle, stepReviewBy]);

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
                {randomResultHistory.map((entry, index) => (
                  <button
                    key={`${entry.puzzleId}-${index}`}
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
                <button
                  onClick={handleHint}
                  disabled={status !== 'playing' || isReviewingPosition}
                  className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/50 hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {t('puzzle.hint')}
                </button>
                <button
                  onClick={handleRetry}
                  className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-hover"
                >
                  ↺ {t('common.retry')}
                </button>
                {nextPuzzle && (
                  <button
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
                        <button
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
                <button
                  onClick={() => navigate(puzzleRoute(String(prevPuzzle)))}
                  className="flex-1 min-w-0 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
                >
                  ← {t('puzzle.previous')}
                </button>
              )}
              <button
                onClick={() => navigate(routes.lessons)}
                className="flex-1 min-w-0 py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors"
              >
                {t('puzzle.all_lessons')}
              </button>
              {nextPuzzle && (
                <button
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

const PuzzleListPage = PuzzleLessonsPage;

export { PuzzleLessonsPage, PuzzleListPage, PuzzlePlayer, PuzzleStreakPage };
export default PuzzleStreakPage;
