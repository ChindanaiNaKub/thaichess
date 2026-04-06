import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import LocalGame from '../components/LocalGame';

const {
  navigateMock,
  boardPropsMock,
  shellPropsMock,
  requestPositionAnalysisMock,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  boardPropsMock: vi.fn(),
  shellPropsMock: vi.fn(),
  requestPositionAnalysisMock: vi.fn(),
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
  default: () => null,
}));

vi.mock('../components/GameOverPanel', () => ({
  default: () => null,
}));

vi.mock('../components/InGameShell', () => ({
  default: (props: any) => {
    shellPropsMock(props);
    return (
      <div data-testid="in-game-shell">
        {props.headerMeta}
        {props.topPanel}
        {props.board}
        {props.bottomPanel}
        {props.sidePanel}
      </div>
    );
  },
}));

function renderLocalGame() {
  return render(
    <MemoryRouter>
      <LocalGame />
    </MemoryRouter>
  );
}

describe('LocalGame', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    boardPropsMock.mockReset();
    shellPropsMock.mockReset();
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
  });
});
