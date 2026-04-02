import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { LessonPlayerPage } from '../components/LessonsPage';

vi.mock('../components/Header', () => ({
  default: ({ right }: { right?: ReactNode }) => <div data-testid="header">{right}</div>,
}));

vi.mock('../components/Board', () => ({
  default: ({ className }: { className?: string }) => <div data-testid="board" className={className}>Board</div>,
}));

vi.mock('../lib/lessonPuzzles', () => ({
  getRelatedPuzzlesForLesson: () => [],
}));

vi.mock('../lib/lessonProgress', () => ({
  useLessonProgress: () => ({
    completedLessonSet: new Set<string>(),
    startedLessonSet: new Set<string>(),
    visitLesson: vi.fn(),
    completeLesson: vi.fn(),
  }),
  useLessonProgressSummary: () => ({
    completedCount: 0,
    totalCount: 20,
    percentComplete: 0,
    nextLesson: null,
  }),
  isLessonUnlocked: () => true,
}));

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

function TestNavigator() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/lessons/endgame-fundamentals')}>
      Switch lesson
    </button>
  );
}

describe('LessonsPage', () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
      unobserve() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders the updated lesson rule fields from lessons.ts and logs the active lesson payload', () => {
    render(
      <MemoryRouter initialEntries={['/lessons/opening-principles']}>
        <Routes>
          <Route path="/lessons/:id" element={<LessonPlayerPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Opening Principles')).toBeInTheDocument();
    expect(screen.getByText('No counting dependency')).toBeInTheDocument();
    expect(screen.getByText(/opening lessons always begin before any counting rule can exist/i)).toBeInTheDocument();

    expect(console.info).toHaveBeenCalledWith(
      '[LessonsPage] active lesson loaded',
      expect.objectContaining({
        source: 'client/src/lib/lessons.ts',
        id: 'opening-principles',
        dependsOnCounting: false,
        ruleImpact: expect.stringContaining('counting rule'),
      }),
    );
  });

  it('keeps the board in a square frame and refreshes the player when the lesson id changes', () => {
    render(
      <MemoryRouter initialEntries={['/lessons/opening-principles']}>
        <TestNavigator />
        <Routes>
          <Route path="/lessons/:id" element={<LessonPlayerPage />} />
        </Routes>
      </MemoryRouter>
    );

    const boardFrame = screen.getByTestId('lesson-board-frame');
    expect(boardFrame.getAttribute('style')).toContain('aspect-ratio: 1 / 1;');

    fireEvent.click(screen.getByRole('button', { name: 'Switch lesson' }));

    expect(screen.getByText('Endgame Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Counting-aware lesson')).toBeInTheDocument();
    expect(screen.getByText(/sak mak starts automatically at count 3/i)).toBeInTheDocument();
  });
});
