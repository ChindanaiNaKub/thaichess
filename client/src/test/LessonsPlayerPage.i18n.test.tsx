import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LessonPlayerPage } from '../components/LessonsPage';
import { I18nProvider, preloadDetectedTranslations } from '../lib/i18n';

vi.mock('../components/Header', () => ({
  default: ({ subtitle, right }: { subtitle?: string; right?: ReactNode }) => (
    <div data-testid="header">
      <span>{subtitle}</span>
      {right}
    </div>
  ),
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

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/lessons/opening-principles']}>
      <I18nProvider>{children}</I18nProvider>
    </MemoryRouter>
  );
}

describe('LessonPlayerPage i18n', () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
      unobserve() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    localStorage.setItem('thaichess-lang', 'th');
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  it('renders lesson player chrome in Thai when Thai is selected', async () => {
    await preloadDetectedTranslations();

    render(
      <Routes>
        <Route path="/lessons/:id" element={<LessonPlayerPage />} />
      </Routes>,
      { wrapper },
    );

    expect(screen.getByText('บทเรียน · Opening Principles')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'เส้นทางคอร์ส' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'ปริศนา' })).toBeInTheDocument();
    expect(screen.getByText('ปานกลาง · บทเรียน 9')).toBeInTheDocument();
    expect(screen.getByText('ไม่ขึ้นกับกฎการนับ')).toBeInTheDocument();
    expect(screen.getAllByText('ขั้นนำทาง').length).toBeGreaterThan(0);
    expect(screen.getByText('ลำดับบทเรียน')).toBeInTheDocument();
    expect(screen.getByText('ขั้น 1 จาก 2')).toBeInTheDocument();
    expect(screen.getByText('นำทาง')).toBeInTheDocument();
    expect(screen.getByText('คำอธิบายแนวคิด')).toBeInTheDocument();
    expect(screen.getByText('ผลของกฎ')).toBeInTheDocument();
    expect(screen.getByText('กฎการนับไม่กระทบบทเรียนนี้')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ขั้นถัดไป' })).toBeInTheDocument();
    expect(screen.getByText('สรุป')).toBeInTheDocument();
    expect(screen.getByText('ปริศนาไว้ตอกย้ำบทเรียนนี้')).toBeInTheDocument();
    expect(screen.getByText('ลิงก์ปริศนาเพิ่มเติมจะมาแสดงตรงนี้เมื่อชุดโจทย์ของแนวคิดนี้ขยายขึ้น')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'บทเรียนก่อนหน้า' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'บทเรียนถัดไป' })).toBeInTheDocument();
    expect(screen.queryByText('Course path')).not.toBeInTheDocument();
    expect(screen.queryByText('Lesson flow')).not.toBeInTheDocument();
  });
});
