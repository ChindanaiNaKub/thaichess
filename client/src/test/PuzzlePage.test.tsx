import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Board as BoardType, Piece, PieceColor, PieceType } from '@shared/types';
import { PuzzleListPage, PuzzlePlayer } from '../components/PuzzlePage';

const { boardPropsMock, navigateMock, puzzleFixture, puzzleListFixtures, markPuzzleCompletedMock, recordPuzzleVisitedMock, progressState } = vi.hoisted(() => {
  const board: BoardType = Array(8).fill(null).map(() => Array(8).fill(null));
  board[0][0] = { type: 'K', color: 'white' };
  board[6][3] = { type: 'R', color: 'white' };
  board[7][4] = { type: 'K', color: 'black' };

  return {
    boardPropsMock: vi.fn(),
    navigateMock: vi.fn(),
    puzzleFixture: {
      id: 77,
      title: 'Checking Rua',
      description: 'White gives check and Black must respond.',
      explanation: 'After the checking move, the side to move must switch to Black so the defense can be played.',
      source: 'test fixture',
      theme: 'Checkmate' as const,
      difficulty: 'beginner' as const,
      toMove: 'white' as const,
      board,
      solution: [
        { from: { row: 6, col: 3 }, to: { row: 7, col: 3 } },
        { from: { row: 7, col: 4 }, to: { row: 6, col: 5 } },
        { from: { row: 7, col: 3 }, to: { row: 6, col: 3 } },
      ],
    },
    puzzleListFixtures: [
      {
        id: 77,
        title: 'Checking Rua',
        description: 'White gives check and Black must respond.',
        explanation: 'After the checking move, the side to move must switch to Black so the defense can be played.',
        source: 'Starter pack: test fixture',
        theme: 'MateIn1' as const,
        difficulty: 'beginner' as const,
        toMove: 'white' as const,
        board,
        solution: [
          { from: { row: 6, col: 3 }, to: { row: 7, col: 3 } },
        ],
      },
      {
        id: 78,
        title: 'Quiet Fork',
        description: 'A fresh beginner fork.',
        explanation: 'Fork the king and rook.',
        source: 'Starter pack: test fixture',
        theme: 'Fork' as const,
        difficulty: 'beginner' as const,
        toMove: 'black' as const,
        board,
        solution: [
          { from: { row: 6, col: 3 }, to: { row: 7, col: 3 } },
        ],
      },
      {
        id: 79,
        title: 'Pinned Rua',
        description: 'An intermediate pin.',
        explanation: 'Win material through a pin.',
        source: 'Imported candidate batch: test fixture',
        theme: 'Pin' as const,
        difficulty: 'intermediate' as const,
        toMove: 'white' as const,
        board,
        solution: [
          { from: { row: 6, col: 3 }, to: { row: 7, col: 3 } },
        ],
      },
    ],
    markPuzzleCompletedMock: vi.fn(async () => {}),
    recordPuzzleVisitedMock: vi.fn(async () => {}),
    progressState: {
      progressRecords: [] as Array<{ puzzleId: number; lastPlayedAt: number; completedAt: number | null }>,
      completedPuzzleIds: [] as number[],
      loading: false,
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
    getForcingMoves: vi.fn((state: { turn: PieceColor; moveHistory: Array<unknown> }) => {
      if (state.turn === 'white' && state.moveHistory.length === 0) {
        return [puzzleFixture.solution[0]];
      }
      if (state.turn === 'black' && state.moveHistory.length === 1) {
        return [puzzleFixture.solution[1]];
      }
      return [];
    }),
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
    t: (key: string, params?: Record<string, unknown>) => {
      switch (key) {
        case 'common.white':
          return 'White';
        case 'common.black':
          return 'Black';
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
        case 'puzzle.all':
          return 'All';
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
        case 'puzzle.title':
          return 'ThaiChess Puzzles';
        case 'puzzle.desc':
          return 'Sharpen your ThaiChess skills with tactical puzzles. Find the best move!';
        case 'nav.puzzles':
          return 'Puzzles';
        case 'common.back_home':
          return 'Back to Home';
        case 'common.retry':
          return 'Retry';
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
    markPuzzleCompleted: markPuzzleCompletedMock,
  }),
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
      </div>
    );
  },
}));

function renderPuzzlePlayer() {
  return render(
    <MemoryRouter initialEntries={['/puzzle/77']}>
      <Routes>
        <Route path="/puzzle/:id" element={<PuzzlePlayer />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderPuzzleList() {
  return render(
    <MemoryRouter initialEntries={['/puzzles']}>
      <PuzzleListPage />
    </MemoryRouter>
  );
}

describe('PuzzlePage turn state', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    boardPropsMock.mockReset();
    navigateMock.mockReset();
    markPuzzleCompletedMock.mockReset();
    recordPuzzleVisitedMock.mockReset();
    progressState.progressRecords = [];
    progressState.completedPuzzleIds = [];
    progressState.loading = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the opponent turn after a checking solver move before the auto-reply runs', async () => {
    renderPuzzlePlayer();

    expect(recordPuzzleVisitedMock).toHaveBeenCalledWith(77);

    fireEvent.click(screen.getByRole('button', { name: 'from' }));
    fireEvent.click(screen.getByRole('button', { name: 'to' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getAllByText('Black to move')).toHaveLength(2);
    expect(screen.queryByText('Find the best move for White!')).not.toBeInTheDocument();
    expect(screen.getByTestId('board-turn')).toHaveTextContent('false');
    expect(screen.getByTestId('board-disabled')).toHaveTextContent('true');
  });
});

describe('Puzzle list page', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    markPuzzleCompletedMock.mockReset();
    progressState.completedPuzzleIds = [];
    progressState.loading = false;
  });

  it('recommends the first unsolved puzzle in the current track', () => {
    progressState.completedPuzzleIds = [77];

    renderPuzzleList();
    fireEvent.click(screen.getAllByText('Short tactical wins and basic mates.')[0]!.closest('button')!);

    expect(screen.getByText('Next lesson')).toBeInTheDocument();
    expect(screen.getAllByText('#78 · Quiet Fork').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Start here').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1/2 in this track').length).toBeGreaterThan(0);
  });

  it('shows a guide empty state when a track has no puzzles', () => {
    renderPuzzleList();

    fireEvent.click(screen.getByRole('button', { name: /advanced/i }));

    expect(screen.getAllByText('No puzzles in this track yet').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Switch difficulty or come back after more lessons are reviewed.').length).toBeGreaterThan(0);
  });

  it('lets players drill a specific theme inside the current track', () => {
    renderPuzzleList();

    fireEvent.click(screen.getAllByText('Short tactical wins and basic mates.')[0]!.closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /fork 1/i }));

    expect(screen.getAllByText('#78 · Quiet Fork').length).toBeGreaterThan(0);
    expect(screen.queryByText('#77 · Checking Rua')).not.toBeInTheDocument();
    expect(screen.queryByText('No Fork drills here yet')).not.toBeInTheDocument();
  });
});
