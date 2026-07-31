import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { captureProductEvent } from './analytics';
import { useAuth } from './auth';
import {
  getPuzzleProgressSummary,
  normalizePuzzleProgressRecords,
  type PuzzleProgressRecord,
  type PuzzleProgressSummary,
} from './puzzleProgressSummary';

export type { PuzzleProgressActivity, PuzzleProgressRecord, PuzzleProgressSummary } from './puzzleProgressSummary';

const LEGACY_COMPLETED_PUZZLES_KEY = 'completedPuzzles';
const GUEST_COMPLETED_PUZZLES_KEY = 'completedPuzzlesGuest';
const LEGACY_GUEST_PUZZLE_PROGRESS_KEY = 'puzzleProgressGuest';
const GUEST_PUZZLE_PROGRESS_KEY = 'puzzleProgressGuest:v1';

interface PuzzleProgressContextValue {
  progressRecords: PuzzleProgressRecord[];
  completedPuzzleIds: number[];
  completedPuzzleSet: Set<number>;
  loading: boolean;
  recordPuzzleVisited: (puzzleId: number) => Promise<void>;
  recordPuzzleFailed: (puzzleId: number) => Promise<void>;
  markPuzzleCompleted: (puzzleId: number) => Promise<void>;
}

const PuzzleProgressContext = createContext<PuzzleProgressContextValue | null>(null);
const EMPTY_PROGRESS_RECORDS: PuzzleProgressRecord[] = [];

function getNowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function normalizePuzzleIds(puzzleIds: number[]): number[] {
  const normalized: number[] = [];
  for (const puzzleId of puzzleIds) {
    const value = Number(puzzleId);
    if (Number.isInteger(value) && value > 0) {
      normalized.push(value);
    }
  }
  return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

function mergePuzzleProgressRecords(...recordSets: PuzzleProgressRecord[][]): PuzzleProgressRecord[] {
  return normalizePuzzleProgressRecords(recordSets.flat());
}

function getCompletedPuzzleIds(records: PuzzleProgressRecord[]): number[] {
  const completedIds: number[] = [];
  for (const record of records) {
    if (record.completedAt !== null) {
      completedIds.push(record.puzzleId);
    }
  }
  return normalizePuzzleIds(completedIds);
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

function clearGuestPuzzleProgressRecords(): void {
  localStorage.removeItem(GUEST_PUZZLE_PROGRESS_KEY);
  localStorage.removeItem(LEGACY_GUEST_PUZZLE_PROGRESS_KEY);
  localStorage.removeItem(GUEST_COMPLETED_PUZZLES_KEY);
  localStorage.removeItem(LEGACY_COMPLETED_PUZZLES_KEY);
}

function readGuestPuzzleProgressRecords(): PuzzleProgressRecord[] {
  let guestRecords = readStoredPuzzleProgressRecords(GUEST_PUZZLE_PROGRESS_KEY);
  if (!guestRecords.length) {
    const legacyRecords = readStoredPuzzleProgressRecords(LEGACY_GUEST_PUZZLE_PROGRESS_KEY);
    if (legacyRecords.length) {
      writeGuestPuzzleProgressRecords(legacyRecords);
      localStorage.removeItem(LEGACY_GUEST_PUZZLE_PROGRESS_KEY);
      guestRecords = legacyRecords;
    }
  }

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
      attempts: 1,
      successes: 1,
      failures: 0,
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
      && record.completedAt === other.completedAt
      && record.attempts === other.attempts
      && record.successes === other.successes
      && record.failures === other.failures;
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
    attempts: 0,
    successes: 0,
    failures: 0,
  }]);
}

function recordPuzzleCompletion(records: PuzzleProgressRecord[], puzzleId: number, timestamp = getNowSeconds()): PuzzleProgressRecord[] {
  return mergePuzzleProgressRecords(records, [{
    puzzleId,
    lastPlayedAt: timestamp,
    completedAt: timestamp,
    attempts: 1,
    successes: 1,
    failures: 0,
  }]);
}

function recordPuzzleFailure(records: PuzzleProgressRecord[], puzzleId: number, timestamp = getNowSeconds()): PuzzleProgressRecord[] {
  const existing = records.find(record => record.puzzleId === puzzleId);
  return mergePuzzleProgressRecords(records, [{
    puzzleId,
    lastPlayedAt: timestamp,
    completedAt: existing?.completedAt ?? null,
    attempts: 1,
    successes: 0,
    failures: 1,
  }]);
}

function parseRemoteProgress(data: unknown): PuzzleProgressRecord[] {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.progressRecords)) {
      return normalizePuzzleProgressRecords(obj.progressRecords as PuzzleProgressRecord[]);
    }

    if (Array.isArray(obj.completedPuzzleIds)) {
      const timestamp = getNowSeconds();
      return normalizePuzzleProgressRecords(
        (obj.completedPuzzleIds as number[]).map((puzzleId) => ({
          puzzleId: Number(puzzleId),
          lastPlayedAt: timestamp,
          completedAt: timestamp,
          attempts: 1,
          successes: 1,
          failures: 0,
        })),
      );
    }
  }

  return [];
}

function puzzleProgressQueryKey(userId: string) {
  return ['puzzleProgress', userId] as const;
}

async function loadAuthenticatedPuzzleProgress(): Promise<PuzzleProgressRecord[]> {
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
    clearGuestPuzzleProgressRecords();
  }

  return mergedRecords;
}

export function PuzzleProgressProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [guestRecords, setGuestRecords] = useState<PuzzleProgressRecord[]>(() => readGuestPuzzleProgressRecords());

  const remoteQuery = useQuery({
    queryKey: puzzleProgressQueryKey(user?.id ?? ''),
    enabled: !authLoading && Boolean(user?.id),
    queryFn: loadAuthenticatedPuzzleProgress,
    staleTime: 30_000,
  });

  const progressRecords = !user
    ? guestRecords
    : (remoteQuery.data ?? (remoteQuery.isPending ? guestRecords : EMPTY_PROGRESS_RECORDS));
  const loading = authLoading || (Boolean(user) && remoteQuery.isPending);
  const progressRecordsRef = useRef(progressRecords);

  useEffect(() => {
    progressRecordsRef.current = progressRecords;
  }, [progressRecords]);

  const applyRecords = useCallback((nextRecords: PuzzleProgressRecord[]) => {
    progressRecordsRef.current = nextRecords;
    if (user?.id) {
      queryClient.setQueryData(puzzleProgressQueryKey(user.id), nextRecords);
      return;
    }
    setGuestRecords(nextRecords);
  }, [queryClient, user]);

  const recordPuzzleVisited = useCallback(async (puzzleId: number) => {
    const normalizedPuzzleId = Number(puzzleId);
    if (!Number.isInteger(normalizedPuzzleId) || normalizedPuzzleId <= 0) return;

    const nextRecords = recordPuzzleVisit(progressRecordsRef.current, normalizedPuzzleId);
    applyRecords(nextRecords);

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
      applyRecords(parseRemoteProgress(data));
    } catch {
      applyRecords(nextRecords);
    }
  }, [applyRecords, user]);

  const markPuzzleCompleted = useCallback(async (puzzleId: number) => {
    const normalizedPuzzleId = Number(puzzleId);
    if (!Number.isInteger(normalizedPuzzleId) || normalizedPuzzleId <= 0) return;

    const nextRecords = recordPuzzleCompletion(progressRecordsRef.current, normalizedPuzzleId);
    applyRecords(nextRecords);
    captureProductEvent('puzzle_complete', { puzzle_id: normalizedPuzzleId });

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
      applyRecords(parseRemoteProgress(data));
    } catch {
      applyRecords(nextRecords);
    }
  }, [applyRecords, user]);

  const recordPuzzleFailed = useCallback(async (puzzleId: number) => {
    const normalizedPuzzleId = Number(puzzleId);
    if (!Number.isInteger(normalizedPuzzleId) || normalizedPuzzleId <= 0) return;

    const nextRecords = recordPuzzleFailure(progressRecordsRef.current, normalizedPuzzleId);
    applyRecords(nextRecords);

    if (!user) {
      writeGuestPuzzleProgressRecords(nextRecords);
      return;
    }

    try {
      const response = await fetch('/api/puzzle-progress/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: normalizedPuzzleId, succeeded: false }),
      });
      const data = await readJsonOrThrow(response);
      applyRecords(parseRemoteProgress(data));
    } catch {
      applyRecords(nextRecords);
    }
  }, [applyRecords, user]);

  const completedPuzzleIds = useMemo(() => getCompletedPuzzleIds(progressRecords), [progressRecords]);

  const value = useMemo<PuzzleProgressContextValue>(() => ({
    progressRecords,
    completedPuzzleIds,
    completedPuzzleSet: new Set(completedPuzzleIds),
    loading,
    recordPuzzleVisited,
    recordPuzzleFailed,
    markPuzzleCompleted,
  }), [completedPuzzleIds, loading, markPuzzleCompleted, progressRecords, recordPuzzleFailed, recordPuzzleVisited]);

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

export function usePuzzleProgressSummary(): PuzzleProgressSummary {
  const { progressRecords } = usePuzzleProgress();
  return useMemo(() => getPuzzleProgressSummary(progressRecords), [progressRecords]);
}
