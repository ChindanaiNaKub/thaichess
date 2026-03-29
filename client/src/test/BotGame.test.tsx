import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import BotGame from '../components/BotGame';

const {
  navigateMock,
  boardPropsMock,
  clockPropsMock,
  requestBotMoveMock,
  requestLocalBotMoveMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  boardPropsMock: vi.fn(),
  clockPropsMock: vi.fn(),
  requestBotMoveMock: vi.fn(),
  requestLocalBotMoveMock: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../lib/pieceStyle', async () => {
  const actual = await vi.importActual<typeof import('../lib/pieceStyle')>('../lib/pieceStyle');

  return {
    ...actual,
    usePieceStyle: () => ({
      pieceStyle: 'classic',
      setPieceStyle: vi.fn(),
    }),
  };
});

vi.mock('../lib/sounds', () => ({
  playMoveSound: vi.fn(),
  playCaptureSound: vi.fn(),
  playCheckSound: vi.fn(),
  playGameOverSound: vi.fn(),
}));

vi.mock('../lib/analysis', () => ({
  buildInlineAnalysisRoute: vi.fn(() => '/analysis/bot'),
  requestBotMove: (...args: unknown[]) => requestBotMoveMock(...args),
}));

vi.mock('../lib/localBot', () => ({
  requestLocalBotMove: (...args: unknown[]) => requestLocalBotMoveMock(...args),
}));

vi.mock('../components/BoardErrorBoundary', () => ({
  BoardErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../components/Board', () => ({
  default: (props: any) => {
    boardPropsMock(props);
    return <div data-testid="board" />;
  },
}));

vi.mock('../components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock('../components/Clock', () => ({
  default: (props: any) => {
    clockPropsMock(props);
    return <div data-testid="clock">{props.playerName}</div>;
  },
}));

vi.mock('../components/MoveHistory', () => ({
  default: () => <div data-testid="move-history" />,
}));

vi.mock('../components/GameOverModal', () => ({
  default: () => null,
}));

vi.mock('../components/GameOverPanel', () => ({
  default: () => null,
}));

vi.mock('../components/PieceSVG', () => ({
  default: () => <div data-testid="piece-svg" />,
}));

function renderBotGame() {
  return render(
    <MemoryRouter>
      <BotGame />
    </MemoryRouter>
  );
}

describe('BotGame', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    boardPropsMock.mockReset();
    clockPropsMock.mockReset();
    requestBotMoveMock.mockReset();
    requestLocalBotMoveMock.mockReset();
    requestBotMoveMock.mockResolvedValue({
      move: null,
      evaluation: 0,
      bestMove: null,
      principalVariation: [],
      stats: {
        source: 'service',
        depth: 1,
      },
    });
    requestLocalBotMoveMock.mockResolvedValue({
      from: { row: 2, col: 0 },
      to: { row: 3, col: 0 },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the started game with two clocks and without duplicate player badges', () => {
    renderBotGame();

    fireEvent.click(screen.getByRole('button', { name: 'bot.start' }));

    expect(screen.getByTestId('board')).toBeInTheDocument();
    expect(screen.getAllByTestId('clock')).toHaveLength(2);
    expect(screen.getByText('Bot (Level 5)')).toBeInTheDocument();
    expect(screen.getByText('common.you (common.white)')).toBeInTheDocument();
    expect(screen.getAllByText('Bot (Level 5)')).toHaveLength(1);
    expect(screen.getAllByText('common.you (common.white)')).toHaveLength(1);
  });

  it('falls back to a local move when the server returns no bot move', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    renderBotGame();

    fireEvent.click(screen.getByRole('button', { name: 'common.black' }));
    fireEvent.click(screen.getByRole('button', { name: 'bot.start' }));

    await waitFor(() => {
      const lastBoardProps = boardPropsMock.mock.calls.at(-1)?.[0];
      expect(lastBoardProps?.isMyTurn).toBe(true);
    }, { timeout: 2000 });

    expect(requestBotMoveMock).toHaveBeenCalledTimes(1);
    expect(requestLocalBotMoveMock).toHaveBeenCalledTimes(1);
  });
});
