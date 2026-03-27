import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Board as BoardType, Piece, PieceColor, PieceType } from '@shared/types';
import { PuzzlePlayer } from '../components/PuzzlePage';

const { boardPropsMock, navigateMock, puzzleFixture } = vi.hoisted(() => {
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
  PUZZLES: [puzzleFixture],
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
        default:
          return key;
      }
    },
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

describe('PuzzlePage turn state', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    boardPropsMock.mockReset();
    navigateMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the opponent turn after a checking solver move before the auto-reply runs', async () => {
    renderPuzzlePlayer();

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
