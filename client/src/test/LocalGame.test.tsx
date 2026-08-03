import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LocalGame from '../components/LocalGame';

const {
  navigateMock,
  boardPropsMock,
  shellPropsMock,
  requestPositionAnalysisMock,
  gameOverModalPropsMock,
  gameOverPanelPropsMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  boardPropsMock: vi.fn(),
  shellPropsMock: vi.fn(),
  requestPositionAnalysisMock: vi.fn(),
  gameOverModalPropsMock: vi.fn(),
  gameOverPanelPropsMock: vi.fn(),
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

vi.mock('../lib/analysis', () => ({
  buildInlineAnalysisRoute: () => '/analysis/local',
  requestPositionAnalysis: (...args: unknown[]) => requestPositionAnalysisMock(...args),
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

vi.mock('../components/BoardErrorBoundary', () => ({
  BoardErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../components/Board', () => ({
  default: (props: any) => {
    boardPropsMock(props);
    return <div data-testid="board" />;
  },
}));

vi.mock('../components/Clock', () => ({
  default: (props: any) => <div data-testid="clock">{props.playerName}</div>,
}));

vi.mock('../components/MoveHistory', () => ({
  default: () => <div data-testid="move-history" />,
}));

vi.mock('../components/GameOverModal', () => ({
  default: (props: any) => {
    gameOverModalPropsMock(props);
    return <div data-testid="game-over-modal" />;
  },
}));

vi.mock('../components/GameOverPanel', () => ({
  default: (props: any) => {
    gameOverPanelPropsMock(props);
    return <div data-testid="game-over-panel" />;
  },
}));

vi.mock('../components/InGameShell', () => ({
  default: (props: any) => {
    shellPropsMock(props);
    return (
      <div data-testid="in-game-shell">
        {props.headerMeta}
        {props.topPanel}
        {props.boardNotice}
        {props.board}
        {props.bottomPanel}
        {props.boardActions}
        {props.sidePanel}
      </div>
    );
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </MemoryRouter>
    );
  };
}

function renderLocalGame() {
  const Wrapper = createWrapper();
  return render(<LocalGame />, { wrapper: Wrapper });
}

describe('LocalGame', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    boardPropsMock.mockReset();
    shellPropsMock.mockReset();
    gameOverModalPropsMock.mockReset();
    gameOverPanelPropsMock.mockReset();
    requestPositionAnalysisMock.mockReset();
    requestPositionAnalysisMock.mockResolvedValue({
      evaluation: 0,
      bestMove: null,
      principalVariation: [],
      stats: {
        source: 'local',
        depth: 1,
      },
    });
  });

  it('uses the shared in-game shell and keeps view controls in the side panel', () => {
    renderLocalGame();
    const shellProps = shellPropsMock.mock.calls[0]?.[0];

    expect(screen.getByTestId('in-game-shell')).toBeInTheDocument();
    expect(screen.getAllByTestId('clock')).toHaveLength(2);
    expect(screen.getByTestId('board')).toBeInTheDocument();
    expect(screen.getByText('local.view_as')).toBeInTheDocument();
    expect(shellProps?.toolbar).toBeNull();
    expect(boardPropsMock).toHaveBeenCalledWith(expect.objectContaining({
      draggableColor: 'white',
    }));

    const playOnline = screen.getByTestId('local-play-online');
    expect(playOnline).toHaveTextContent('local.play_online');
    expect(playOnline.className).not.toMatch(/\bbg-primary\b/);
    expect(playOnline.className).toMatch(/underline-offset-4/);
    expect(playOnline.className).not.toMatch(/border-surface-hover/);

    const pieceGuide = screen.getByTestId('piece-guide-side');
    expect(pieceGuide.className).toMatch(/border-surface-hover/);
    expect(pieceGuide.className).not.toMatch(/underline-offset-4/);

    // Shared Operate grammar: mobile thumb resign when not counting (matchMedia defaults <lg)
    expect(screen.getByTestId('game-mobile-actions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /game.resign/i })).toBeInTheDocument();

    const sideMeta = screen.getByTestId('local-side-meta');
    expect(sideMeta.className).toMatch(/bg-surface-alt\/90/);
    expect(sideMeta.className).toMatch(/border-surface-hover\/80/);
    expect(sideMeta.className).not.toMatch(/shadow-/);
  });

  it('keeps hot-seat climax color-victorious even after flipping view-as', () => {
    renderLocalGame();

    fireEvent.click(screen.getByRole('button', { name: 'common.black' }));
    fireEvent.click(screen.getByRole('button', { name: /game.resign/i }));
    fireEvent.click(screen.getByRole('button', { name: 'game.resign_confirm_action' }));

    expect(gameOverModalPropsMock).toHaveBeenCalledWith(expect.objectContaining({
      playerColor: null,
    }));
  });
});
