import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';

const LEGACY_COMPLETED_PUZZLES_KEY = 'completedPuzzles';
const GUEST_COMPLETED_PUZZLES_KEY = 'completedPuzzlesGuest';

interface PuzzleProgressContextValue {
  completedPuzzleIds: number[];
  completedPuzzleSet: Set<number>;
  loading: boolean;
  markPuzzleCompleted: (puzzleId: number) => Promise<void>;
}

const PuzzleProgressContext = createContext<PuzzleProgressContextValue | null>(null);

function normalizePuzzleIds(puzzleIds: number[]): number[] {
  return Array.from(
    new Set(
      puzzleIds
        .map(puzzleId => Number(puzzleId))
        .filter(puzzleId => Number.isInteger(puzzleId) && puzzleId > 0),
    ),
  ).sort((a, b) => a - b);
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

function readGuestPuzzleIds(): number[] {
  const guestIds = readStoredPuzzleIds(GUEST_COMPLETED_PUZZLES_KEY);
  const legacyIds = readStoredPuzzleIds(LEGACY_COMPLETED_PUZZLES_KEY);
  const mergedIds = normalizePuzzleIds([...guestIds, ...legacyIds]);

  if (legacyIds.length > 0) {
    localStorage.setItem(GUEST_COMPLETED_PUZZLES_KEY, JSON.stringify(mergedIds));
    localStorage.removeItem(LEGACY_COMPLETED_PUZZLES_KEY);
  }

  return mergedIds;
}

function writeGuestPuzzleIds(puzzleIds: number[]): void {
  localStorage.setItem(GUEST_COMPLETED_PUZZLES_KEY, JSON.stringify(normalizePuzzleIds(puzzleIds)));
}

async function readJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed.');
  }
  return data;
}

export function PuzzleProgressProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [completedPuzzleIds, setCompletedPuzzleIds] = useState<number[]>(() => readGuestPuzzleIds());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPuzzleProgress() {
      if (authLoading) return;

      if (!user) {
        const guestPuzzleIds = readGuestPuzzleIds();
        if (!cancelled) {
          setCompletedPuzzleIds(guestPuzzleIds);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const guestPuzzleIds = readGuestPuzzleIds();
        const progressResponse = await fetch('/api/puzzle-progress');
        const progressData = await readJsonOrThrow(progressResponse);
        const remotePuzzleIds = normalizePuzzleIds(progressData.completedPuzzleIds ?? []);

        const hasGuestOnlyProgress = guestPuzzleIds.some(puzzleId => !remotePuzzleIds.includes(puzzleId));
        let mergedPuzzleIds = normalizePuzzleIds([...remotePuzzleIds, ...guestPuzzleIds]);

        if (hasGuestOnlyProgress) {
          const syncResponse = await fetch('/api/puzzle-progress/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completedPuzzleIds: guestPuzzleIds }),
          });
          const syncData = await readJsonOrThrow(syncResponse);
          mergedPuzzleIds = normalizePuzzleIds(syncData.completedPuzzleIds ?? mergedPuzzleIds);
        }

        if (!cancelled) {
          setCompletedPuzzleIds(mergedPuzzleIds);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCompletedPuzzleIds([]);
          setLoading(false);
        }
      }
    }

    void loadPuzzleProgress();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  async function markPuzzleCompleted(puzzleId: number) {
    const normalizedPuzzleId = Number(puzzleId);
    if (!Number.isInteger(normalizedPuzzleId) || normalizedPuzzleId <= 0) return;

    const nextPuzzleIds = normalizePuzzleIds([...completedPuzzleIds, normalizedPuzzleId]);
    setCompletedPuzzleIds(nextPuzzleIds);

    if (!user) {
      writeGuestPuzzleIds(nextPuzzleIds);
      return;
    }

    try {
      const response = await fetch('/api/puzzle-progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzleId: normalizedPuzzleId }),
      });
      const data = await readJsonOrThrow(response);
      setCompletedPuzzleIds(normalizePuzzleIds(data.completedPuzzleIds ?? nextPuzzleIds));
    } catch {
      setCompletedPuzzleIds(nextPuzzleIds);
    }
  }

  const value = useMemo<PuzzleProgressContextValue>(() => ({
    completedPuzzleIds,
    completedPuzzleSet: new Set(completedPuzzleIds),
    loading,
    markPuzzleCompleted,
  }), [completedPuzzleIds, loading]);

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
