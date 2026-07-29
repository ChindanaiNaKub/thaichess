import type { Position, Move, GameState } from '@shared/types';
import { makeMove } from '@shared/engine';
import { PUZZLES, type Puzzle } from '@shared/puzzlesRuntime';
import { createGameStateFromPuzzle } from '@shared/puzzleSolver';

export type PuzzleStatus = 'playing' | 'success' | 'failed';
export type PuzzleListFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

export function puzzlesForFilter(difficulty: PuzzleListFilter) {
  return difficulty === 'all'
    ? PUZZLES
    : PUZZLES.filter(p => p.difficulty === difficulty);
}

export function getLastMove(state: GameState | null): Move | null {
  if (!state || state.moveHistory.length === 0) return null;
  return state.moveHistory[state.moveHistory.length - 1];
}

export function getCheckSquare(state: GameState | null): Position | null {
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
}

export type StreakMilestoneTone = 'improving' | 'harder' | null;
const RANDOM_RESULT_HISTORY_STORAGE_KEY = 'thaichess-random-puzzle-result-history';
export const MAX_RANDOM_RESULT_HISTORY = 16;

export type RandomResultEntry = {
  id: string;
  puzzleId: number;
  outcome: 'success' | 'failed';
};

export function readRandomResultHistory(): RandomResultEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(RANDOM_RESULT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((entry, entryIndex): RandomResultEntry[] => {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        typeof (entry as { puzzleId?: unknown }).puzzleId !== 'number' ||
        ((entry as { outcome?: unknown }).outcome !== 'success' &&
          (entry as { outcome?: unknown }).outcome !== 'failed')
      ) {
        return [];
      }

      const puzzleId = (entry as { puzzleId: number }).puzzleId;
      const outcome = (entry as { outcome: 'success' | 'failed' }).outcome;
      const id = typeof (entry as { id?: unknown }).id === 'string'
        ? (entry as { id: string }).id
        : `legacy-${puzzleId}-${outcome}-${entryIndex}`;

      return [{ id, puzzleId, outcome }];
    });
  } catch {
    return [];
  }
}

export function writeRandomResultHistory(history: RandomResultEntry[]): void {
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

export interface StreakFeedback {
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

export function getPuzzleFailureDetail(puzzle: Puzzle, attemptedMove: Pick<Move, 'from' | 'to'> | null): string {
  if (movesMatch(attemptedMove, puzzle.commonWrongMove)) {
    return puzzle.wrongMoveExplanation;
  }

  return `${puzzle.wrongMoveExplanation} ${puzzle.takeaway}`;
}

export const PUZZLE_FILTERS: PuzzleListFilter[] = ['all', 'beginner', 'intermediate', 'advanced'];

export function getPublicPuzzleTitle(title: string): string {
  return title
    .replace(/\s*\([0-9a-f]{8}\s*@\s*ply\s*\d+\)$/i, '')
    .replace(/^Real-Game\s+/i, '')
    .trim();
}

export function translatePuzzleContent(
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

export function getPuzzleSourceLabel(
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

export function getPuzzleOriginLabel(
  puzzle: Puzzle,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (puzzle.origin === 'engine-generated') {
    return t('puzzle.source_generated');
  }

  return t('puzzle.source_community');
}

export function getPuzzleOriginBadgeClasses(origin: Puzzle['origin']): string {
  if (origin === 'engine-generated') {
    return 'border-accent/35 bg-accent/12 text-accent';
  }

  return 'border-primary/35 bg-primary/12 text-primary-light';
}

const activityDateFormatters = {
  th: new Intl.DateTimeFormat('th-TH', { month: 'short', day: 'numeric' }),
  en: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }),
} as const;

export function formatActivityDate(timestamp: number, lang: string): string {
  return (lang === 'th' ? activityDateFormatters.th : activityDateFormatters.en)
    .format(new Date(timestamp * 1000));
}

export function formatPuzzleTag(tag: string): string {
  return tag
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getDifficultyTextClasses(difficulty: Puzzle['difficulty']): string {
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

export function getDifficultyBadgeClasses(difficulty: Puzzle['difficulty']): string {
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

export function getFeedbackClasses(tone: StreakFeedback['tone']): string {
  switch (tone) {
    case 'success':
      return 'border-primary/35 bg-primary/12 text-primary-light';
    case 'failed':
      return 'border-danger/35 bg-danger/12 text-danger';
    default:
      return 'border-accent/25 bg-accent/10 text-text-bright';
  }
}

export function getVerificationLabel(
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

export function getPuzzleIdentityBadges(
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

export function getCompactPuzzleIdentityBadges(
  puzzle: Puzzle,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string[] {
  return [
    t(`theme.${puzzle.theme}`),
    puzzle.motif ? translatePuzzleContent(puzzle.motif, t) : null,
  ].filter((entry): entry is string => Boolean(entry && entry.trim().length > 0));
}

export function buildReplayState(
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
