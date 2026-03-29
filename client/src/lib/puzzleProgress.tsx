import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PUZZLES, type Puzzle } from '@shared/puzzles';
import { useAuth } from './auth';

const LEGACY_COMPLETED_PUZZLES_KEY = 'completedPuzzles';
const GUEST_COMPLETED_PUZZLES_KEY = 'completedPuzzlesGuest';
const GUEST_PUZZLE_PROGRESS_KEY = 'puzzleProgressGuest';

export interface PuzzleProgressRecord {
  puzzleId: number;
  lastPlayedAt: number;
  completedAt: number | null;
}

interface PuzzleProgressContextValue {
  progressRecords: PuzzleProgressRecord[];
  completedPuzzleIds: number[];
  completedPuzzleSet: Set<number>;
  loading: boolean;
  recordPuzzleVisited: (puzzleId: number) => Promise<void>;
  markPuzzleCompleted: (puzzleId: number) => Promise<void>;
}

export interface PuzzleProgressActivity {
  puzzle: Puzzle;
  lastPlayedAt: number;
  completedAt: number | null;
}

export interface PuzzleProgressSummary {
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  nextPuzzle: Puzzle | null;
  continuePuzzle: Puzzle | null;
  favoriteTheme: string | null;
  lastPlayed: PuzzleProgressActivity | null;
  recentCompleted: PuzzleProgressActivity[];
}

const PuzzleProgressContext = createContext<PuzzleProgressContextValue | null>(null);

function getNowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function normalizePuzzleIds(puzzleIds: number[]): number[] {
  return Array.from(
    new Set(
      puzzleIds
        .map(puzzleId => Number(puzzleId))
        .filter(puzzleId => Number.isInteger(puzzleId) && puzzleId > 0),
    ),
  ).sort((a, b) => a - b);
}

function normalizePuzzleProgressRecords(records: PuzzleProgressRecord[]): PuzzleProgressRecord[] {
  const deduped = new Map<number, PuzzleProgressRecord>();

  for (const record of records) {
    const puzzleId = Number(record.puzzleId);
    if (!Number.isInteger(puzzleId) || puzzleId <= 0) continue;

    const lastPlayedAt = Number(record.lastPlayedAt);
    const completedAt = record.completedAt === null || record.completedAt === undefined
      ? null
      : Number(record.completedAt);
    const existing = deduped.get(puzzleId);

    if (!existing) {
      deduped.set(puzzleId, {
        puzzleId,
        lastPlayedAt: Number.isFinite(lastPlayedAt) && lastPlayedAt > 0 ? lastPlayedAt : 0,
        completedAt: Number.isFinite(completedAt ?? NaN) && (completedAt ?? 0) > 0 ? completedAt : null,
      });
      continue;
    }

    deduped.set(puzzleId, {
      puzzleId,
      lastPlayedAt: Math.max(
        existing.lastPlayedAt,
        Number.isFinite(lastPlayedAt) && lastPlayedAt > 0 ? lastPlayedAt : 0,
      ),
      completedAt: existing.completedAt === null
        ? (Number.isFinite(completedAt ?? NaN) && (completedAt ?? 0) > 0 ? completedAt : null)
        : completedAt === null
          ? existing.completedAt
          : Math.max(existing.completedAt, completedAt),
    });
  }

  return Array.from(deduped.values()).sort((a, b) => {
    if (b.lastPlayedAt !== a.lastPlayedAt) return b.lastPlayedAt - a.lastPlayedAt;
    return a.puzzleId - b.puzzleId;
  });
}

function mergePuzzleProgressRecords(...recordSets: PuzzleProgressRecord[][]): PuzzleProgressRecord[] {
  return normalizePuzzleProgressRecords(recordSets.flat());
}

function getCompletedPuzzleIds(records: PuzzleProgressRecord[]): number[] {
  return normalizePuzzleIds(
    records
      .filter(record => record.completedAt !== null)
      .map(record => record.puzzleId),
  );
}

function readStoredPuzzleIds(key: string): number[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    return normalizePuzzleIds(JSON.parse(raw) as number[]);
  } catch {
    return [];
  }
}

function readStoredPuzzleProgressRecords(key: string): PuzzleProgressRecord[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    return normalizePuzzleProgressRecords(JSON.parse(raw) as PuzzleProgressRecord[]);
  } catch {
    return [];
  }
}

function writeGuestPuzzleProgressRecords(records: PuzzleProgressRecord[]): void {
  localStorage.setItem(
    GUEST_PUZZLE_PROGRESS_KEY,
    JSON.stringify(normalizePuzzleProgressRecords(records)),
  );
}

function readGuestPuzzleProgressRecords(): PuzzleProgressRecord[] {
  const guestRecords = readStoredPuzzleProgressRecords(GUEST_PUZZLE_PROGRESS_KEY);
  const guestIds = readStoredPuzzleIds(GUEST_COMPLETED_PUZZLES_KEY);
  const legacyIds = readStoredPuzzleIds(LEGACY_COMPLETED_PUZZLES_KEY);
  const completedIds = normalizePuzzleIds([...guestIds, ...legacyIds]);

  if (!completedIds.length) {
    return guestRecords;
  }

  const migrationTimestamp = getNowSeconds();
  const mergedRecords = mergePuzzleProgressRecords(
    guestRecords,
    completedIds.map((puzzleId) => ({
      puzzleId,
      lastPlayedAt: migrationTimestamp,
      completedAt: migrationTimestamp,
    })),
  );

  writeGuestPuzzleProgressRecords(mergedRecords);
  localStorage.removeItem(GUEST_COMPLETED_PUZZLES_KEY);
  localStorage.removeItem(LEGACY_COMPLETED_PUZZLES_KEY);
  return mergedRecords;
}

function recordsEqual(a: PuzzleProgressRecord[], b: PuzzleProgressRecord[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((record, index) => {
    const other = b[index];
    return record.puzzleId === other.puzzleId
      && record.lastPlayedAt === other.lastPlayedAt
      && record.completedAt === other.completedAt;
  });
}

async function readJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed.');
  }
  return data;
}

function recordPuzzleVisit(records: PuzzleProgressRecord[], puzzleId: number, timestamp = getNowSeconds()): PuzzleProgressRecord[] {
  const existing = records.find(record => record.puzzleId === puzzleId);
  return mergePuzzleProgressRecords(records, [{
    puzzleId,
    lastPlayedAt: timestamp,
    completedAt: existing?.completedAt ?? null,
  }]);
}

function recordPuzzleCompletion(records: PuzzleProgressRecord[], puzzleId: number, timestamp = getNowSeconds()): PuzzleProgressRecord[] {
  return mergePuzzleProgressRecords(records, [{
    puzzleId,
    lastPlayedAt: timestamp,
    completedAt: timestamp,
  }]);
}

function parseRemoteProgress(data: any): PuzzleProgressRecord[] {
  if (Array.isArray(data?.progressRecords)) {
    return normalizePuzzleProgressRecords(data.progressRecords as PuzzleProgressRecord[]);
  }

  if (Array.isArray(data?.completedPuzzleIds)) {
    const timestamp = getNowSeconds();
    return normalizePuzzleProgressRecords(
      (data.completedPuzzleIds as number[]).map((puzzleId) => ({
        puzzleId: Number(puzzleId),
        lastPlayedAt: timestamp,
        completedAt: timestamp,
      })),
    );
  }

  return [];
}

export function PuzzleProgressProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [progressRecords, setProgressRecords] = useState<PuzzleProgressRecord[]>(() => readGuestPuzzleProgressRecords());
  const [loading, setLoading] = useState(true);
  const progressRecordsRef = useRef(progressRecords);

  useEffect(() => {
    progressRecordsRef.current = progressRecords;
  }, [progressRecords]);

  useEffect(() => {
    let cancelled = false;

    async function loadPuzzleProgress() {
      if (authLoading) return;

      if (!user) {
        const guestRecords = readGuestPuzzleProgressRecords();
        if (!cancelled) {
          setProgressRecords(guestRecords);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const guestRecords = readGuestPuzzleProgressRecords();
        const progressResponse = await fetch('/api/puzzle-progress');
        const progressData = await readJsonOrThrow(progressResponse);
        const remoteRecords = parseRemoteProgress(progressData);

        let mergedRecords = mergePuzzleProgressRecords(remoteRecords, guestRecords);
        const shouldSyncGuestProgress = guestRecords.length > 0 && !recordsEqual(remoteRecords, mergedRecords);

        if (shouldSyncGuestProgress) {
          const syncResponse = await fetch('/api/puzzle-progress/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progressRecords: guestRecords }),
          });
          const syncData = await readJsonOrThrow(syncResponse);
          mergedRecords = parseRemoteProgress(syncData);
        }

        if (!cancelled) {
          setProgressRecords(mergedRecords);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setProgressRecords([]);
          setLoading(false);
        }
      }
    }

    void loadPuzzleProgress();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const recordPuzzleVisited = useCallback(async (puzzleId: number) => {
    const normalizedPuzzleId = Number(puzzleId);
    if (!Number.isInteger(normalizedPuzzleId) || normalizedPuzzleId <= 0) return;

    const nextRecords = recordPuzzleVisit(progressRecordsRef.current, normalizedPuzzleId);
    setProgressRecords(nextRecords);
    progressRecordsRef.current = nextRecords;

    if (!user) {
      writeGuestPuzzleProgressRecords(nextRecords);
      return;
    }

    try {
      const response = await fetch('/api/puzzle-progress/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: normalizedPuzzleId }),
      });
      const data = await readJsonOrThrow(response);
      const remoteRecords = parseRemoteProgress(data);
      setProgressRecords(remoteRecords);
      progressRecordsRef.current = remoteRecords;
    } catch {
      setProgressRecords(nextRecords);
      progressRecordsRef.current = nextRecords;
    }
  }, [user]);

  const markPuzzleCompleted = useCallback(async (puzzleId: number) => {
    const normalizedPuzzleId = Number(puzzleId);
    if (!Number.isInteger(normalizedPuzzleId) || normalizedPuzzleId <= 0) return;

    const nextRecords = recordPuzzleCompletion(progressRecordsRef.current, normalizedPuzzleId);
    setProgressRecords(nextRecords);
    progressRecordsRef.current = nextRecords;

    if (!user) {
      writeGuestPuzzleProgressRecords(nextRecords);
      return;
    }

    try {
      const response = await fetch('/api/puzzle-progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: normalizedPuzzleId }),
      });
      const data = await readJsonOrThrow(response);
      const remoteRecords = parseRemoteProgress(data);
      setProgressRecords(remoteRecords);
      progressRecordsRef.current = remoteRecords;
    } catch {
      setProgressRecords(nextRecords);
      progressRecordsRef.current = nextRecords;
    }
  }, [user]);

  const completedPuzzleIds = useMemo(() => getCompletedPuzzleIds(progressRecords), [progressRecords]);

  const value = useMemo<PuzzleProgressContextValue>(() => ({
    progressRecords,
    completedPuzzleIds,
    completedPuzzleSet: new Set(completedPuzzleIds),
    loading,
    recordPuzzleVisited,
    markPuzzleCompleted,
  }), [completedPuzzleIds, loading, markPuzzleCompleted, progressRecords, recordPuzzleVisited]);

  return (
    <PuzzleProgressContext.Provider value={value}>
      {children}
    </PuzzleProgressContext.Provider>
  );
}

export function usePuzzleProgress() {
  const context = useContext(PuzzleProgressContext);
  if (!context) {
    throw new Error('usePuzzleProgress must be used within a PuzzleProgressProvider');
  }
  return context;
}

export function getPuzzleProgressSummary(progressRecords: PuzzleProgressRecord[]): PuzzleProgressSummary {
  const normalizedRecords = normalizePuzzleProgressRecords(progressRecords);
  const shippedPuzzlesById = new Map(PUZZLES.map(puzzle => [puzzle.id, puzzle]));
  const activity = normalizedRecords
    .map((record) => {
      const puzzle = shippedPuzzlesById.get(record.puzzleId);
      if (!puzzle) return null;
      return {
        puzzle,
        lastPlayedAt: record.lastPlayedAt,
        completedAt: record.completedAt,
      } satisfies PuzzleProgressActivity;
    })
    .filter((record): record is PuzzleProgressActivity => record !== null);

  const completedActivity = activity.filter(record => record.completedAt !== null);
  const completedSet = new Set(completedActivity.map(record => record.puzzle.id));
  const completedCount = completedActivity.length;
  const totalCount = PUZZLES.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const nextPuzzle = PUZZLES.find(puzzle => !completedSet.has(puzzle.id)) ?? PUZZLES[0] ?? null;
  const lastPlayed = activity[0] ?? null;
  const continuePuzzle = lastPlayed && lastPlayed.completedAt === null
    ? lastPlayed.puzzle
    : nextPuzzle;

  const favoriteTheme = Array.from(
    completedActivity.reduce((themes, record) => {
      themes.set(record.puzzle.theme, (themes.get(record.puzzle.theme) ?? 0) + 1);
      return themes;
    }, new Map<string, number>()),
  )
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })[0]?.[0] ?? null;

  const recentCompleted = [...completedActivity]
    .sort((a, b) => {
      const aCompletedAt = a.completedAt ?? 0;
      const bCompletedAt = b.completedAt ?? 0;
      if (bCompletedAt !== aCompletedAt) return bCompletedAt - aCompletedAt;
      return a.puzzle.id - b.puzzle.id;
    })
    .slice(0, 3);

  return {
    completedCount,
    totalCount,
    percentComplete,
    nextPuzzle,
    continuePuzzle,
    favoriteTheme,
    lastPlayed,
    recentCompleted,
  };
}

export function usePuzzleProgressSummary(): PuzzleProgressSummary {
  const { progressRecords } = usePuzzleProgress();
  return useMemo(() => getPuzzleProgressSummary(progressRecords), [progressRecords]);
}
