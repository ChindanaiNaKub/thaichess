import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Board as BoardType } from '@shared/types';
import { PuzzleListPage, PuzzlePlayer, PuzzleStreakPage } from '../components/PuzzlePage';

const {
  boardPropsMock,
  navigateMock,
  puzzleListFixtures,
  markPuzzleCompletedMock,
  recordPuzzleVisitedMock,
  recordPuzzleFailedMock,
  progressState,
  puzzleSummaryState,
} = vi.hoisted(() => {
  const board: BoardType = Array(8).fill(null).map(() => Array(8).fill(null));
  board[0][0] = { type: 'K', color: 'white' };
  board[6][3] = { type: 'R', color: 'white' };
  board[7][4] = { type: 'K', color: 'black' };

  const solution = [{ from: { row: 6, col: 3 }, to: { row: 7, col: 3 } }];

  return {
    boardPropsMock: vi.fn(),
    navigateMock: vi.fn(),
    puzzleListFixtures: [
      {
        id: 77,
        title: 'Checking Rua',
        description: 'White gives check and Black must respond.',
        explanation: 'Start with the forcing move.',
        source: 'Starter pack: test fixture',
        origin: 'starter-pack' as const,
        sourceGameId: null,
        sourcePly: null,
        theme: 'MateIn1' as const,
        motif: 'Test motif',
        tags: ['mate', 'starter-pack'],
        difficultyScore: 820,
        difficulty: 'beginner' as const,
        toMove: 'white' as const,
        reviewStatus: 'ship' as const,
        reviewChecklist: {
          themeClarity: 'pass' as const,
          teachingValue: 'pass' as const,
          duplicateRisk: 'clear' as const,
          reviewNotes: 'clear',
        },
        board,
        solution,
      },
      {
        id: 78,
        title: 'Quiet Fork',
        description: 'A fresh beginner fork.',
        explanation: 'Fork the king and rook.',
        source: 'Starter pack: test fixture',
        origin: 'starter-pack' as const,
        sourceGameId: null,
        sourcePly: null,
        theme: 'Fork' as const,
        motif: 'Fork motif',
        tags: ['fork', 'tactic'],
        difficultyScore: 960,
        difficulty: 'beginner' as const,
        toMove: 'white' as const,
        reviewStatus: 'ship' as const,
        reviewChecklist: {
          themeClarity: 'pass' as const,
          teachingValue: 'pass' as const,
          duplicateRisk: 'clear' as const,
          reviewNotes: 'clear',
        },
        board,
        solution,
      },
      {
        id: 79,
        title: 'Pinned Rua',
        description: 'An intermediate pin.',
        explanation: 'Win material through a pin.',
        source: 'Imported candidate batch: test fixture',
        origin: 'review-batch' as const,
        sourceGameId: null,
        sourcePly: null,
        theme: 'Pin' as const,
        motif: 'Pin motif',
        tags: ['pin', 'tactic'],
        difficultyScore: 1180,
        difficulty: 'intermediate' as const,
        toMove: 'white' as const,
        reviewStatus: 'ship' as const,
        reviewChecklist: {
          themeClarity: 'pass' as const,
          teachingValue: 'pass' as const,
          duplicateRisk: 'clear' as const,
          reviewNotes: 'clear',
        },
        board,
        solution,
      },
      {
        id: 80,
        title: 'Quiet Mate Follow-up',
        description: 'Another mate in one from the same theme.',
        explanation: 'Keep drilling the same mating pattern.',
        source: 'Starter pack: test fixture',
        origin: 'starter-pack' as const,
        sourceGameId: null,
        sourcePly: null,
        theme: 'MateIn1' as const,
        motif: 'Mate motif',
        tags: ['mate'],
        difficultyScore: 1480,
        difficulty: 'advanced' as const,
        toMove: 'white' as const,
        reviewStatus: 'ship' as const,
        reviewChecklist: {
          themeClarity: 'pass' as const,
          teachingValue: 'pass' as const,
          duplicateRisk: 'clear' as const,
          reviewNotes: 'clear',
        },
        board,
        solution,
      },
    ],
    markPuzzleCompletedMock: vi.fn(async () => {}),
    recordPuzzleVisitedMock: vi.fn(async () => {}),
    recordPuzzleFailedMock: vi.fn(async () => {}),
    progressState: {
      progressRecords: [] as Array<{ puzzleId: number; lastPlayedAt: number; completedAt: number | null; attempts: number; successes: number; failures: number }>,
      completedPuzzleIds: [] as number[],
      loading: false,
    },
    puzzleSummaryState: {
      completedCount: 0,
      totalCount: 4,
      percentComplete: 0,
      attemptCount: 0,
      successRate: 0,
      recommendedDifficultyScore: 980,
      nextPuzzle: null as any,
      continuePuzzle: null as any,
      favoriteTheme: null as string | null,
      lastPlayed: null as any,
      recentCompleted: [] as any[],
    },
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@shared/puzzles', () => ({
  PUZZLES: puzzleListFixtures,
}));

vi.mock('@shared/puzzleSolver', async () => {
  const actual = await vi.importActual<typeof import('@shared/puzzleSolver')>('@shared/puzzleSolver');

  return {
    ...actual,
    getForcingMoves: vi.fn((state: { moveHistory: Array<unknown> }, puzzle: { solution: Array<unknown> }) => (
      state.moveHistory.length < puzzle.solution.length
        ? [puzzle.solution[state.moveHistory.length]]
        : []
    )),
    getPliesRemaining: vi.fn((puzzle: { solution: Array<unknown> }, state: { moveHistory: Array<unknown> }) => (
      Math.max(0, puzzle.solution.length - state.moveHistory.length)
    )),
    isThemeSatisfied: vi.fn((puzzle: { solution: Array<unknown> }, state: { moveHistory: Array<unknown> }) => (
      state.moveHistory.length >= puzzle.solution.length
    )),
  };
});

vi.mock('../lib/sounds', () => ({
  playMoveSound: vi.fn(),
  playCaptureSound: vi.fn(),
  playCheckSound: vi.fn(),
  playGameOverSound: vi.fn(),
}));

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    lang: 'en',
    t: (key: string, params?: Record<string, unknown>) => {
      switch (key) {
        case 'common.white':
          return 'White';
        case 'common.black':
          return 'Black';
        case 'common.new_game':
          return 'New Game';
        case 'common.retry':
          return 'Retry';
        case 'puzzle.to_move':
          return `${params?.color} to move`;
        case 'puzzle.find_best':
          return `Find the best move for ${params?.color}!`;
        case 'puzzle.step':
          return `Step ${params?.current} of ${params?.total}`;
        case 'puzzle.completed':
          return `${params?.done}/${params?.total} completed`;
        case 'puzzle.track_progress':
          return `${params?.track} progress`;
        case 'puzzle.track_completed':
          return `${params?.done}/${params?.total} in this track`;
        case 'puzzle.theme_drill_title':
          return 'Theme drills';
        case 'puzzle.theme_drill_desc':
          return 'Narrow the queue to one tactical idea when you want repetition.';
        case 'puzzle.theme_drill_count':
          return `${params?.count} themes in this track`;
        case 'puzzle.theme_all':
          return 'All ideas';
        case 'puzzle.source_starter_pack':
          return 'Starter pack';
        case 'puzzle.source_review_batch':
          return 'Review batch';
        case 'puzzle.source_real_game_ply':
          return `Real game · ply ${params?.ply}`;
        case 'puzzle.activity_title':
          return 'Session activity';
        case 'puzzle.activity_status_label':
          return 'Status';
        case 'puzzle.activity_status_new':
          return 'New';
        case 'puzzle.activity_status_in_progress':
          return 'In progress';
        case 'puzzle.activity_status_solved':
          return 'Solved';
        case 'puzzle.activity_last_played':
          return `Last played ${params?.date}`;
        case 'puzzle.activity_completed_on':
          return `Solved ${params?.date}`;
        case 'puzzle.related_theme_title':
          return 'More in this theme';
        case 'puzzle.related_theme_desc':
          return `Keep drilling ${params?.theme} with these follow-ups.`;
        case 'puzzle.related_theme_empty':
          return `No other ${params?.theme} puzzles yet.`;
        case 'puzzle.all':
          return 'All';
        case 'puzzle.all_lessons':
          return 'All Lessons';
        case 'puzzle.beginner':
          return 'Beginner';
        case 'puzzle.intermediate':
          return 'Intermediate';
        case 'puzzle.advanced':
          return 'Advanced';
        case 'puzzle.filter_all_desc':
          return 'Mix every shipped lesson in one queue.';
        case 'puzzle.filter_beginner_desc':
          return 'Short tactical wins and basic mates.';
        case 'puzzle.filter_intermediate_desc':
          return 'Two-step ideas that punish weak defense.';
        case 'puzzle.filter_advanced_desc':
          return 'Tougher calculation once the catalog grows.';
        case 'puzzle.next_up':
          return 'Next lesson';
        case 'puzzle.next_up_fresh':
          return 'Start with the first unsolved puzzle in this track.';
        case 'puzzle.start_here':
          return 'Start here';
        case 'puzzle.practice_title':
          return 'Practice queue';
        case 'puzzle.practice_desc':
          return 'Fresh puzzles come first, solved ones stay available for review.';
        case 'puzzle.new_badge':
          return 'Fresh';
        case 'puzzle.solved_badge':
          return 'Solved';
        case 'puzzle.empty_title':
          return 'No puzzles in this track yet';
        case 'puzzle.empty_desc':
          return 'Switch difficulty or come back after more lessons are reviewed.';
        case 'puzzle.empty_theme_title':
          return `No ${params?.theme} drills here yet`;
        case 'puzzle.empty_theme_desc':
          return `Try another idea or switch out of ${params?.track} to find more ${params?.theme} puzzles.`;
        case 'puzzle.completed_summary':
          return 'Overall progress';
        case 'puzzle.progress_hint':
          return 'Solved puzzles stay checked on this device.';
        case 'puzzle.filter_label':
          return 'Current track';
        case 'puzzle.remaining_label':
          return 'Still fresh';
        case 'puzzle.remaining_desc':
          return 'Unsolved puzzles are listed first.';
        case 'puzzle.focus_label':
          return 'Theme focus';
        case 'puzzle.focus_desc':
          return 'Use this to pick what idea you want to drill next.';
        case 'puzzle.focus_empty':
          return 'No themes yet';
        case 'puzzle.lessons_nav':
          return 'Lessons';
        case 'puzzle.lessons_eyebrow':
          return 'Lesson Mode';
        case 'puzzle.lessons_title':
          return 'Lessons';
        case 'puzzle.lessons_desc':
          return 'Use the existing puzzle catalog as structured study tracks.';
        case 'puzzle.lessons_tracks_title':
          return 'Learning tracks';
        case 'puzzle.lessons_tracks_desc':
          return 'Beginner, Intermediate, and Advanced stay here as deliberate study paths.';
        case 'puzzle.play_streak':
          return 'Play Streak';
        case 'puzzle.streak_nav':
          return 'Puzzle Streak';
        case 'puzzle.streak_eyebrow':
          return 'Primary Mode';
        case 'puzzle.streak_title':
          return 'Puzzle Streak';
        case 'puzzle.streak_desc':
          return 'Solve continuously, build your streak, and let the system quietly raise or lower the challenge.';
        case 'puzzle.streak_prompt_title':
          return 'Keep the streak alive';
        case 'puzzle.streak_prompt_desc':
          return 'Correct moves score immediately and the next puzzle loads right away.';
        case 'puzzle.streak_score_label':
          return 'Score';
        case 'puzzle.streak_label':
          return 'Streak';
        case 'puzzle.streak_session_label':
          return 'Solved';
        case 'puzzle.streak_checkpoint_label':
          return 'Checkpoint';
        case 'puzzle.streak_checkpoint_progress':
          return `${params?.current}/${params?.total} to the next pulse`;
        case 'puzzle.streak_flow_label':
          return 'Flow';
        case 'puzzle.streak_flow_desc':
          return 'Adaptive pacing';
        case 'puzzle.streak_puzzle_label':
          return `Puzzle ${params?.number}`;
        case 'puzzle.streak_points':
          return `+${params?.points} points`;
        case 'puzzle.streak_focus_title':
          return 'Current puzzle';
        case 'puzzle.streak_focus_keep':
          return 'Breathe, reset, and go again.';
        case 'puzzle.streak_focus_desc':
          return 'Difficulty stays hidden here so the rhythm feels fast and frictionless.';
        case 'puzzle.streak_session_title':
          return 'Session';
        case 'puzzle.streak_best_label':
          return 'Best streak';
        case 'puzzle.streak_end_title':
          return 'Streak ended';
        case 'puzzle.streak_end_desc':
          return 'One mistake breaks the run, but your lesson progress stays saved.';
        case 'puzzle.streak_ended_at':
          return `Streak ended at ${params?.streak}`;
        case 'puzzle.streak_end_summary':
          return `Final streak ${params?.streak} · session score ${params?.score}`;
        case 'puzzle.retry_puzzle':
          return 'Retry puzzle';
        case 'puzzle.streak_try_again':
          return 'Start a new streak';
        case 'puzzle.streak_milestone_improving':
          return 'You’re improving. Keep the flow going.';
        case 'puzzle.streak_milestone_harder':
          return 'Now facing harder puzzles. Stay sharp.';
        case 'puzzle.correct':
          return 'Correct!';
        case 'puzzle.wrong':
          return 'Not quite!';
        case 'puzzle.wrong_desc':
          return "That wasn't the best move. Try again!";
        case 'puzzle.hint':
          return 'Hint';
        case 'puzzle.next':
          return 'Next Puzzle';
        case 'puzzle.previous':
          return 'Previous';
        case 'puzzle.back_to_lessons':
          return 'Back to Lessons';
        case 'puzzle.lesson':
          return 'Lesson';
        case 'puzzle.rating_short':
          return `Rating ${params?.score}`;
        case 'puzzle.success_rate':
          return 'Success rate';
        case 'puzzle.attempts_label':
          return 'Attempts';
        case 'theme.MateIn1':
          return 'Mate in 1';
        case 'theme.Fork':
          return 'Fork';
        case 'theme.Pin':
          return 'Pin';
        default:
          return key;
      }
    },
  }),
}));

vi.mock('../lib/puzzleProgress', () => ({
  usePuzzleProgress: () => ({
    progressRecords: progressState.progressRecords,
    completedPuzzleIds: progressState.completedPuzzleIds,
    completedPuzzleSet: new Set(progressState.completedPuzzleIds),
    loading: progressState.loading,
    recordPuzzleVisited: recordPuzzleVisitedMock,
    recordPuzzleFailed: recordPuzzleFailedMock,
    markPuzzleCompleted: markPuzzleCompletedMock,
  }),
  usePuzzleProgressSummary: () => puzzleSummaryState,
}));

vi.mock('../components/Header', () => ({
  default: ({ right }: { right?: ReactNode }) => <div data-testid="header">{right}</div>,
}));

vi.mock('../components/BoardErrorBoundary', () => ({
  BoardErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../components/Board', () => ({
  default: (props: any) => {
    boardPropsMock(props);
    return (
      <div data-testid="board">
        <div data-testid="board-turn">{String(props.isMyTurn)}</div>
        <div data-testid="board-disabled">{String(props.disabled)}</div>
        <button onClick={() => props.onSquareClick({ row: 6, col: 3 })}>from</button>
        <button onClick={() => props.onSquareClick({ row: 7, col: 3 })}>to</button>
        <button onClick={() => props.onSquareClick({ row: 6, col: 4 })}>wrong-to</button>
      </div>
    );
  },
}));

function renderStreakPage() {
  return render(
    <MemoryRouter initialEntries={['/puzzles']}>
      <PuzzleStreakPage />
    </MemoryRouter>
  );
}

function renderLessonsPage() {
  return render(
    <MemoryRouter initialEntries={['/lessons']}>
      <PuzzleListPage />
    </MemoryRouter>
  );
}

function renderLessonPlayer() {
  return render(
    <MemoryRouter initialEntries={['/puzzle/77']}>
      <Routes>
        <Route path="/puzzle/:id" element={<PuzzlePlayer />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Puzzle surfaces', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    boardPropsMock.mockReset();
    navigateMock.mockReset();
    markPuzzleCompletedMock.mockReset();
    recordPuzzleVisitedMock.mockReset();
    recordPuzzleFailedMock.mockReset();
    progressState.progressRecords = [];
    progressState.completedPuzzleIds = [];
    progressState.loading = false;
    puzzleSummaryState.nextPuzzle = puzzleListFixtures[1] as any;
    puzzleSummaryState.continuePuzzle = puzzleListFixtures[1] as any;
    puzzleSummaryState.favoriteTheme = 'Fork';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses streak mode as the default experience, hides difficulty labels, and auto-advances with score', async () => {
    renderStreakPage();

    expect(screen.getByText('Puzzle Streak')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.queryByText('Open Lessons')).not.toBeInTheDocument();
    expect(screen.queryByText('All Lessons')).not.toBeInTheDocument();
    expect(screen.queryByText('Lessons')).not.toBeInTheDocument();
    expect(screen.queryByText('Beginner')).not.toBeInTheDocument();
    expect(recordPuzzleVisitedMock).toHaveBeenCalledWith(77);

    fireEvent.click(screen.getByRole('button', { name: 'from' }));
    fireEvent.click(screen.getByRole('button', { name: 'to' }));

    await act(async () => {
      vi.advanceTimersByTime(750);
    });

    expect(markPuzzleCompletedMock).toHaveBeenCalledWith(77);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(recordPuzzleVisitedMock).toHaveBeenCalledWith(78);
  });

  it('ends the streak on a wrong move and offers retry or a fresh streak', () => {
    renderStreakPage();

    fireEvent.click(screen.getByRole('button', { name: 'from' }));
    fireEvent.click(screen.getByRole('button', { name: 'wrong-to' }));

    expect(recordPuzzleFailedMock).toHaveBeenCalledWith(77);
    expect(screen.getAllByText('Streak ended').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Streak ended at 0').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Retry puzzle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start a new streak' })).toBeInTheDocument();
  });

  it('keeps the categorized lesson tracks on a separate lessons page', () => {
    progressState.completedPuzzleIds = [77];

    renderLessonsPage();

    expect(screen.getAllByText('Lessons').length).toBeGreaterThan(0);
    expect(screen.getByText('Learning tracks')).toBeInTheDocument();
    expect(screen.getAllByText('Beginner').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Intermediate').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Advanced').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Play Streak' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByText('Start here')[0]!);
    expect(navigateMock).toHaveBeenCalledWith('/puzzle/78');
  });

  it('still exposes lesson player details separately from streak mode', () => {
    progressState.progressRecords = [{
      puzzleId: 77,
      lastPlayedAt: 1711600000,
      completedAt: null,
      attempts: 1,
      successes: 0,
      failures: 1,
    }];

    renderLessonPlayer();

    expect(recordPuzzleVisitedMock).toHaveBeenCalledWith(77);
    expect(screen.getByText('#77 · Checking Rua')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('More in this theme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play Streak' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'All Lessons' }).length).toBeGreaterThan(0);
  });
});
