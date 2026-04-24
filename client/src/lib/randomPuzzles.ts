import type { Puzzle } from '@shared/puzzlesRuntime';

const RANDOM_HISTORY_STORAGE_KEY = 'thaichess-random-puzzle-history';

type RandomPuzzleCandidate = Pick<Puzzle, 'id' | 'origin'>;

export function readRandomPuzzleHistory(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(RANDOM_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is number => typeof value === 'number');
  } catch {
    return [];
  }
}

export function writeRandomPuzzleHistory(history: number[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(RANDOM_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors and keep navigation functional.
  }
}

export function rememberRandomPuzzleVisit(puzzleId: number, maxHistory: number): void {
  const history = readRandomPuzzleHistory();
  const nextHistory = history.includes(puzzleId)
    ? history.slice(-maxHistory)
    : [...history, puzzleId].slice(-maxHistory);
  writeRandomPuzzleHistory(nextHistory);
}

export function pickRandomPuzzleId(
  puzzles: RandomPuzzleCandidate[],
  currentPuzzleId: number | null = null,
): number | null {
  if (puzzles.length === 0) return null;
  const uniquePuzzles = Array.from(new Map(puzzles.map((puzzle) => [puzzle.id, puzzle])).values());
  const baseCandidates = uniquePuzzles.filter((puzzle) => puzzle.id !== currentPuzzleId);
  const candidates = baseCandidates.length > 0 ? baseCandidates : uniquePuzzles;
  const history = readRandomPuzzleHistory();
  const historySet = new Set(history);
  let pool = candidates.filter((puzzle) => !historySet.has(puzzle.id));

  if (pool.length === 0) {
    // Restart the cycle only after all candidates were seen.
    writeRandomPuzzleHistory(currentPuzzleId === null ? [] : [currentPuzzleId]);
    pool = candidates;
  }

  const unseenCommunityPool = pool.filter((puzzle) => puzzle.origin === 'curated-manual');
  if (unseenCommunityPool.length > 0) {
    const recentWindow = history.slice(-6);
    const puzzleById = new Map(uniquePuzzles.map((puzzle) => [puzzle.id, puzzle]));
    const recentlySawCommunity = recentWindow.some((id) => puzzleById.get(id)?.origin === 'curated-manual');
    if (!recentlySawCommunity) {
      pool = unseenCommunityPool;
    }
  }

  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked?.id ?? null;
}
