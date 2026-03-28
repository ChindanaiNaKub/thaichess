import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import BotGame from '../components/BotGame';

const {
  navigateMock,
  boardPropsMock,
  clockPropsMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  boardPropsMock: vi.fn(),
  clockPropsMock: vi.fn(),
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

vi.mock('../lib/pieceStyle', () => ({
  usePieceStyle: () => ({
    pieceStyle: 'classic',
    setPieceStyle: vi.fn(),
  }),
}));

vi.mock('../lib/sounds', () => ({
  playMoveSound: vi.fn(),
  playCaptureSound: vi.fn(),
  playCheckSound: vi.fn(),
  playGameOverSound: vi.fn(),
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
  });

  it('renders the started game with two clocks and without duplicate player badges', () => {
    renderBotGame();

    fireEvent.click(screen.getByRole('button', { name: 'bot.start' }));

    expect(screen.getByTestId('board')).toBeInTheDocument();
    expect(screen.getAllByTestId('clock')).toHaveLength(2);
    expect(screen.getByText('Bot (bot.medium)')).toBeInTheDocument();
    expect(screen.getByText('common.you (common.white)')).toBeInTheDocument();
    expect(screen.getAllByText('Bot (bot.medium)')).toHaveLength(1);
    expect(screen.getAllByText('common.you (common.white)')).toHaveLength(1);
  });
});
