import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { LessonCoursePage } from '../components/LessonsPage';
import { I18nProvider, preloadDetectedTranslations } from '../lib/i18n';

const lessonProgressState = vi.hoisted(() => ({
  completedLessonSet: new Set<string>(),
  startedLessonSet: new Set<string>(['board-and-battlefield']),
  summary: {
    completedCount: 3,
    totalCount: 20,
    percentComplete: 15,
    nextLesson: {
      id: 'board-and-battlefield',
      title: 'Board and Battlefield',
      objective: 'See how Makruk starts and why the center matters from move one.',
      level: 'beginner',
      estimatedMinutes: 4,
      example: {
        board: Array.from({ length: 8 }, () => Array(8).fill(null)),
        toMove: 'white',
        playerColor: 'white',
      },
    },
  },
}));

vi.mock('../components/Header', () => ({
  default: ({ subtitle, right }: { subtitle?: string; right?: ReactNode }) => (
    <div data-testid="header">
      <span>{subtitle}</span>
      {right}
    </div>
  ),
}));

vi.mock('../components/Board', () => ({
  default: () => <div data-testid="board">Board</div>,
}));

vi.mock('../lib/lessonProgress', () => ({
  useLessonProgress: () => ({
    completedLessonSet: lessonProgressState.completedLessonSet,
    startedLessonSet: lessonProgressState.startedLessonSet,
    visitLesson: vi.fn(),
    completeLesson: vi.fn(),
  }),
  useLessonProgressSummary: () => lessonProgressState.summary,
  isLessonUnlocked: () => true,
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  );
}

describe('LessonCoursePage i18n', () => {
  beforeEach(() => {
    localStorage.setItem('thaichess-lang', 'th');
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('renders the course page chrome in Thai when Thai is selected', async () => {
    await preloadDetectedTranslations();

    render(<LessonCoursePage />, { wrapper });

    expect(screen.getByText('บทเรียนแบบเป็นลำดับ')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'เรียนหมากรุกไทยเหมือนมีโค้ชคอยพาไปทีละขั้น' })).toBeInTheDocument();
    expect(screen.getByText('ความคืบหน้าของคอร์ส')).toBeInTheDocument();
    expect(screen.getByText('สำเร็จแล้ว 15%')).toBeInTheDocument();
    expect(screen.getByText('บทเรียนถัดไป')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เริ่มบทเรียน' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'สตรีคโจทย์' })).toBeInTheDocument();
    expect(screen.getAllByText('เริ่มต้น').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4 นาที').length).toBeGreaterThan(0);
    expect(screen.getByText('บทเรียน 1')).toBeInTheDocument();
    expect(screen.getByText('ทำต่อ')).toBeInTheDocument();
    expect(screen.queryByText('Learn Makruk like a coached course')).not.toBeInTheDocument();
  });
});
