import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MAKRUK_LESSONS, getLessonById, type MakrukLesson } from './lessons';

const LESSON_PROGRESS_STORAGE_KEY = 'makrukLessonProgressGuest';

export interface LessonProgressRecord {
  lessonId: string;
  startedAt: number;
  completedAt: number | null;
  lastVisitedAt: number;
}

interface LessonProgressContextValue {
  records: LessonProgressRecord[];
  completedLessonIds: string[];
  completedLessonSet: Set<string>;
  startedLessonSet: Set<string>;
  visitLesson: (lessonId: string) => void;
  completeLesson: (lessonId: string) => void;
}

export interface LessonProgressSummary {
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  nextLesson: MakrukLesson | null;
}

const LessonProgressContext = createContext<LessonProgressContextValue | null>(null);

function getNowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function normalizeLessonRecords(records: LessonProgressRecord[]): LessonProgressRecord[] {
  const deduped = new Map<string, LessonProgressRecord>();

  for (const record of records) {
    const lessonId = String(record.lessonId ?? '').trim();
    if (!lessonId || !getLessonById(lessonId)) continue;

    const existing = deduped.get(lessonId);
    const startedAt = Math.max(0, Number(record.startedAt ?? 0));
    const lastVisitedAt = Math.max(0, Number(record.lastVisitedAt ?? startedAt));
    const completedAt = record.completedAt === null || record.completedAt === undefined
      ? null
      : Math.max(0, Number(record.completedAt));

    if (!existing) {
      deduped.set(lessonId, {
        lessonId,
        startedAt,
        completedAt: completedAt || null,
        lastVisitedAt,
      });
      continue;
    }

    deduped.set(lessonId, {
      lessonId,
      startedAt: Math.min(existing.startedAt || startedAt, startedAt || existing.startedAt),
      completedAt: existing.completedAt === null
        ? (completedAt || null)
        : completedAt === null
          ? existing.completedAt
          : Math.max(existing.completedAt, completedAt),
      lastVisitedAt: Math.max(existing.lastVisitedAt, lastVisitedAt),
    });
  }

  return Array.from(deduped.values()).sort((left, right) => {
    if (right.lastVisitedAt !== left.lastVisitedAt) return right.lastVisitedAt - left.lastVisitedAt;
    return left.lessonId.localeCompare(right.lessonId);
  });
}

function readStoredLessonRecords(): LessonProgressRecord[] {
  const raw = window.localStorage.getItem(LESSON_PROGRESS_STORAGE_KEY);
  if (!raw) return [];

  try {
    return normalizeLessonRecords(JSON.parse(raw) as LessonProgressRecord[]);
  } catch {
    return [];
  }
}

function writeStoredLessonRecords(records: LessonProgressRecord[]): void {
  window.localStorage.setItem(LESSON_PROGRESS_STORAGE_KEY, JSON.stringify(normalizeLessonRecords(records)));
}

function upsertRecord(records: LessonProgressRecord[], nextRecord: LessonProgressRecord): LessonProgressRecord[] {
  const filtered = records.filter(record => record.lessonId !== nextRecord.lessonId);
  return normalizeLessonRecords([...filtered, nextRecord]);
}

export function LessonProgressProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<LessonProgressRecord[]>(() => readStoredLessonRecords());

  useEffect(() => {
    writeStoredLessonRecords(records);
  }, [records]);

  const visitLesson = useCallback((lessonId: string) => {
    const timestamp = getNowSeconds();
    setRecords((current) => {
      const existing = current.find(record => record.lessonId === lessonId);
      return upsertRecord(current, {
        lessonId,
        startedAt: existing?.startedAt ?? timestamp,
        completedAt: existing?.completedAt ?? null,
        lastVisitedAt: timestamp,
      });
    });
  }, []);

  const completeLesson = useCallback((lessonId: string) => {
    const timestamp = getNowSeconds();
    setRecords((current) => {
      const existing = current.find(record => record.lessonId === lessonId);
      return upsertRecord(current, {
        lessonId,
        startedAt: existing?.startedAt ?? timestamp,
        completedAt: existing?.completedAt ?? timestamp,
        lastVisitedAt: timestamp,
      });
    });
  }, []);

  const completedLessonIds = useMemo(
    () => records.filter(record => record.completedAt !== null).map(record => record.lessonId),
    [records],
  );
  const completedLessonSet = useMemo(() => new Set(completedLessonIds), [completedLessonIds]);
  const startedLessonSet = useMemo(() => new Set(records.map(record => record.lessonId)), [records]);

  const value = useMemo<LessonProgressContextValue>(() => ({
    records,
    completedLessonIds,
    completedLessonSet,
    startedLessonSet,
    visitLesson,
    completeLesson,
  }), [completedLessonIds, completedLessonSet, completeLesson, records, startedLessonSet, visitLesson]);

  return (
    <LessonProgressContext.Provider value={value}>
      {children}
    </LessonProgressContext.Provider>
  );
}

export function useLessonProgress(): LessonProgressContextValue {
  const context = useContext(LessonProgressContext);
  if (!context) {
    throw new Error('useLessonProgress must be used within a LessonProgressProvider');
  }
  return context;
}

export function useLessonProgressSummary(): LessonProgressSummary {
  const { completedLessonSet } = useLessonProgress();

  return useMemo(() => {
    const completedCount = completedLessonSet.size;
    const totalCount = MAKRUK_LESSONS.length;
    const nextLesson = MAKRUK_LESSONS.find((lesson, index) => (
      index === 0
        ? !completedLessonSet.has(lesson.id)
        : completedLessonSet.has(MAKRUK_LESSONS[index - 1]!.id) && !completedLessonSet.has(lesson.id)
    )) ?? null;

    return {
      completedCount,
      totalCount,
      percentComplete: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      nextLesson,
    };
  }, [completedLessonSet]);
}

export function isLessonUnlocked(lessonId: string, completedLessonSet: Set<string>): boolean {
  const lessonIndex = MAKRUK_LESSONS.findIndex(lesson => lesson.id === lessonId);
  if (lessonIndex === -1) return false;
  if (lessonIndex === 0) return true;
  return completedLessonSet.has(MAKRUK_LESSONS[lessonIndex - 1]!.id);
}
