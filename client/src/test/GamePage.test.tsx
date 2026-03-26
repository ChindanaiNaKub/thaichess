import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createInitialGameState } from '@shared/engine';
import type { ClientGameState, Move, PieceColor } from '@shared/types';
import GamePage from '../components/GamePage';

const {
  navigateMock,
  connectSocketMock,
  playMoveSoundMock,
  playCaptureSoundMock,
  playCheckSoundMock,
  playGameOverSoundMock,
  playGameStartSoundMock,
  getLegalMovesMock,
  interactionState,
  boardPropsMock,
  moveHistoryPropsMock,
  gameOverModalPropsMock,
  gameOverPanelPropsMock,
  pieceGuidePropsMock,
  socketMock,
  pieceStyleState,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  connectSocketMock: vi.fn(),
  playMoveSoundMock: vi.fn(),
  playCaptureSoundMock: vi.fn(),
  playCheckSoundMock: vi.fn(),
  playGameOverSoundMock: vi.fn(),
  playGameStartSoundMock: vi.fn(),
  getLegalMovesMock: vi.fn(),
  interactionState: {
    selectedSquare: null,
    legalMoves: [],
    premove: null,
    handleSquareClick: vi.fn(),
    handlePieceDrop: vi.fn(),
    cancelPremove: vi.fn(),
    clearSelection: vi.fn(),
  },
  boardPropsMock: vi.fn(),
  moveHistoryPropsMock: vi.fn(),
  gameOverModalPropsMock: vi.fn(),
  gameOverPanelPropsMock: vi.fn(),
  pieceGuidePropsMock: vi.fn(),
  socketMock: {
    connected: false,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
  pieceStyleState: {
    pieceStyle: 'classic',
    setPieceStyle: vi.fn(),
  },
}));

type EventHandler = (...args: any[]) => void;

const listeners = new Map<string, Set<EventHandler>>();

function addListener(event: string, handler: EventHandler) {
  const handlers = listeners.get(event) ?? new Set<EventHandler>();
  handlers.add(handler);
  listeners.set(event, handlers);
}

function removeListener(event: string, handler: EventHandler) {
  listeners.get(event)?.delete(handler);
}

function emitSocketEvent(event: string, payload?: unknown) {
  listeners.get(event)?.forEach((handler) => handler(payload));
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@shared/engine', async () => {
  const actual = await vi.importActual<typeof import('@shared/engine')>('@shared/engine');

  return {
    ...actual,
    getLegalMoves: (...args: Parameters<typeof actual.getLegalMoves>) => getLegalMovesMock(...args),
  };
});

vi.mock('../lib/socket', () => ({
  socket: socketMock,
  connectSocket: connectSocketMock,
}));

vi.mock('../lib/sounds', () => ({
  playMoveSound: playMoveSoundMock,
  playCaptureSound: playCaptureSoundMock,
  playCheckSound: playCheckSoundMock,
  playGameOverSound: playGameOverSoundMock,
  playGameStartSound: playGameStartSoundMock,
}));

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (!params) return key;
      return `${key}:${JSON.stringify(params)}`;
    },
  }),
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock('../lib/pieceStyle', () => ({
  usePieceStyle: () => pieceStyleState,
}));

vi.mock('../hooks/useGameInteraction', () => ({
  useGameInteraction: () => interactionState,
}));

vi.mock('../components/BoardErrorBoundary', () => ({
  BoardErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../components/Board', () => ({
  default: (props: any) => {
    boardPropsMock(props);
    return (
      <div data-testid="board">
        <span data-testid="board-disabled">{String(props.disabled)}</span>
        <span data-testid="board-is-check">{String(props.isCheck)}</span>
        <button onClick={() => props.onArrowsChange?.([{ from: { row: 0, col: 0 }, to: { row: 1, col: 1 } }])}>
          set arrows
        </button>
      </div>
    );
  },
}));

vi.mock('../components/Clock', () => ({
  default: (props: any) => <div data-testid="clock">{props.playerName}</div>,
}));

vi.mock('../components/MoveHistory', () => ({
  default: (props: any) => {
    moveHistoryPropsMock(props);
    return (
      <div data-testid="move-history">
        <button onClick={() => props.onMoveClick?.(0)}>jump-first-move</button>
      </div>
    );
  },
}));

vi.mock('../components/GameOverModal', () => ({
  default: (props: any) => {
    gameOverModalPropsMock(props);
    return (
      <div data-testid="game-over-modal">
        <button onClick={props.onClose}>close-modal</button>
        <button onClick={props.onRematch}>modal-rematch</button>
        <button onClick={props.onNewGame}>modal-new-game</button>
        {props.onAnalyze && <button onClick={props.onAnalyze}>modal-analyze</button>}
      </div>
    );
  },
}));

vi.mock('../components/GameOverPanel', () => ({
  default: (props: any) => {
    gameOverPanelPropsMock(props);
    return (
      <div data-testid="game-over-panel">
        <button onClick={props.onRematch}>panel-rematch</button>
        <button onClick={props.onNewGame}>panel-new-game</button>
        {props.onAnalyze && <button onClick={props.onAnalyze}>panel-analyze</button>}
      </div>
    );
  },
}));

vi.mock('../components/PieceGuide', () => ({
  default: (props: any) => {
    pieceGuidePropsMock(props);
    return props.show ? <div data-testid="piece-guide">piece-guide-open</div> : null;
  },
}));

vi.mock('../components/ConnectionStatus', () => ({
  default: () => null,
}));

vi.mock('../components/PieceSVG', () => ({
  default: () => <div data-testid="piece-svg" />,
}));

vi.mock('../components/Header', () => ({
  default: () => <div data-testid="header" />,
}));

vi.mock('../components/CapturedPiecesPanel', () => ({
  default: () => null,
}));

function renderGamePage(initialRoute = '/game/reconnect-room') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/game/:gameId" element={<GamePage />} />
      </Routes>
    </MemoryRouter>
  );
}

function makeGameState(overrides: Partial<ClientGameState> = {}): ClientGameState {
  const base = createInitialGameState(300_000, 300_000);
  return {
    ...base,
    gameId: 'room-123',
    gameMode: 'private',
    rated: false,
    status: 'playing',
    playerColor: 'white',
    whitePlayerName: 'White Player',
    blackPlayerName: 'Black Player',
    moveHistory: [],
    gameOver: false,
    winner: null,
    drawOffer: null,
    isCheck: false,
    counting: null,
    ...overrides,
  };
}

function joinPayload(overrides: Partial<ClientGameState> = {}, color: PieceColor = 'white') {
  return {
    color,
    gameState: makeGameState(overrides),
  };
}

describe('GamePage', () => {
  beforeEach(() => {
    listeners.clear();
    navigateMock.mockReset();
    connectSocketMock.mockReset();
    playMoveSoundMock.mockReset();
    playCaptureSoundMock.mockReset();
    playCheckSoundMock.mockReset();
    playGameOverSoundMock.mockReset();
    playGameStartSoundMock.mockReset();
    getLegalMovesMock.mockReset();
    boardPropsMock.mockReset();
    moveHistoryPropsMock.mockReset();
    gameOverModalPropsMock.mockReset();
    gameOverPanelPropsMock.mockReset();
    pieceGuidePropsMock.mockReset();
    interactionState.selectedSquare = null;
    interactionState.legalMoves = [];
    interactionState.premove = null;
    interactionState.handleSquareClick.mockReset();
    interactionState.handlePieceDrop.mockReset();
    interactionState.cancelPremove.mockReset();
    interactionState.clearSelection.mockReset();
    socketMock.connected = false;
    socketMock.emit.mockReset();
    pieceStyleState.pieceStyle = 'classic';
    pieceStyleState.setPieceStyle.mockReset();
    socketMock.on.mockImplementation((event: string, handler: EventHandler) => {
      addListener(event, handler);
      return socketMock;
    });
    socketMock.off.mockImplementation((event: string, handler: EventHandler) => {
      removeListener(event, handler);
      return socketMock;
    });
    getLegalMovesMock.mockReturnValue([]);
    vi.stubGlobal('confirm', vi.fn(() => true));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('rejoins the game after a disconnect and reconnect', async () => {
    renderGamePage();

    await act(async () => {
      emitSocketEvent('connect');
    });

    expect(connectSocketMock).toHaveBeenCalledTimes(1);
    expect(socketMock.emit).toHaveBeenCalledTimes(1);
    expect(socketMock.emit).toHaveBeenLastCalledWith('join_game', { gameId: 'reconnect-room' });

    await act(async () => {
      emitSocketEvent('disconnect');
      emitSocketEvent('connect');
    });

    expect(socketMock.emit).toHaveBeenCalledTimes(2);
    expect(socketMock.emit).toHaveBeenLastCalledWith('join_game', { gameId: 'reconnect-room' });
  });

  it('joins immediately on mount when the socket is already connected', () => {
    socketMock.connected = true;

    renderGamePage('/game/connected-room');

    expect(connectSocketMock).toHaveBeenCalledTimes(1);
    expect(socketMock.emit).toHaveBeenCalledWith('join_game', { gameId: 'connected-room' });
  });

  it('shows the opponent username from game state when available', async () => {
    renderGamePage('/game/names-room');

    await act(async () => {
      emitSocketEvent('game_joined', joinPayload({
        whitePlayerName: 'MifiAndPrab',
        blackPlayerName: 'RivalPlayer',
      }));
    });

    expect(screen.getByText('MifiAndPrab')).toBeInTheDocument();
    expect(screen.getByText('RivalPlayer')).toBeInTheDocument();
    expect(screen.queryByText('game.opponent')).not.toBeInTheDocument();
  });

  it('renders waiting-room state, copies the invite link, and plays the start sound on transition to playing', async () => {
    renderGamePage('/game/waiting-room');

    await act(async () => {
      emitSocketEvent('game_joined', joinPayload({ status: 'waiting' }));
    });

    expect(screen.getByText('game.waiting_title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'game.copy' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'game.copy' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
    });

    await act(async () => {
      emitSocketEvent('game_state', makeGameState({ status: 'playing' }));
    });

    expect(playGameStartSoundMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('game.waiting_title')).not.toBeInTheDocument();
    expect(screen.getByTestId('board')).toBeInTheDocument();
  });

  it('leaves a waiting private room when returning home', async () => {
    renderGamePage('/game/waiting-room');

    await act(async () => {
      emitSocketEvent('game_joined', joinPayload({ gameId: 'waiting-room', status: 'waiting' }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'common.back_home' }));

    expect(socketMock.emit).toHaveBeenCalledWith('leave_game', { gameId: 'waiting-room' });
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('handles move sounds, draw flow, and active controls during play', async () => {
    renderGamePage('/game/live-room');

    await act(async () => {
      emitSocketEvent('game_joined', joinPayload({
        counting: {
          active: false,
          type: 'board_honor',
          countingColor: 'white',
          strongerColor: 'black',
          currentCount: 0,
          limit: 64,
          finalAttackPending: false,
        },
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'set arrows' }));

    await act(async () => {
      emitSocketEvent('move_made', {
        move: { from: { row: 6, col: 4 }, to: { row: 5, col: 4 }, captured: false },
        gameState: makeGameState({ moveHistory: [{ from: { row: 6, col: 4 }, to: { row: 5, col: 4 } } as Move] }),
      });
    });

    expect(playMoveSoundMock).toHaveBeenCalledTimes(1);
    expect(interactionState.clearSelection).toHaveBeenCalledTimes(1);
    expect(boardPropsMock.mock.lastCall?.[0].arrows).toEqual([]);

    await act(async () => {
      emitSocketEvent('move_made', {
        move: { from: { row: 1, col: 4 }, to: { row: 2, col: 4 }, captured: true },
        gameState: makeGameState({
          moveHistory: [{
            from: { row: 1, col: 4 },
            to: { row: 2, col: 4 },
            captured: { type: 'P', color: 'white' },
          } as Move],
        }),
      });
    });
    expect(playCaptureSoundMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      emitSocketEvent('move_made', {
        move: { from: { row: 0, col: 4 }, to: { row: 1, col: 4 }, captured: false },
        gameState: makeGameState({ isCheck: true }),
      });
    });
    expect(playCheckSoundMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      emitSocketEvent('draw_offered');
      emitSocketEvent('opponent_disconnected');
    });

    expect(screen.getByText('game.draw_offer_received')).toBeInTheDocument();
    expect(screen.getByText('game.opponent_dc')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'game.accept' }));
    expect(socketMock.emit).toHaveBeenCalledWith('respond_draw', { accept: true });

    fireEvent.click(screen.getByRole('button', { name: 'game.offer_draw' }));
    expect(socketMock.emit).toHaveBeenCalledWith('offer_draw');

    fireEvent.click(screen.getByRole('button', { name: 'game.resign' }));
    expect(socketMock.emit).toHaveBeenCalledWith('resign');
  });

  it('updates clocks, clears banners, and supports both counting actions', async () => {
    renderGamePage('/game/counting-room');

    await act(async () => {
      emitSocketEvent('game_joined', joinPayload({
        counting: {
          active: false,
          type: 'board_honor',
          countingColor: 'white',
          strongerColor: 'black',
          currentCount: 0,
          limit: 64,
          finalAttackPending: false,
        },
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'game.counting_start' }));
    expect(socketMock.emit).toHaveBeenCalledWith('start_counting');

    await act(async () => {
      emitSocketEvent('clock_update', { whiteTime: 111_000, blackTime: 222_000 });
      emitSocketEvent('draw_offered');
      emitSocketEvent('opponent_disconnected');
      emitSocketEvent('draw_declined');
      emitSocketEvent('opponent_reconnected');
      emitSocketEvent('game_state', makeGameState({
        whiteTime: 111_000,
        blackTime: 222_000,
        counting: {
          active: true,
          type: 'pieces_honor',
          countingColor: 'white',
          strongerColor: 'black',
          currentCount: 5,
          limit: 64,
          finalAttackPending: false,
        },
      }));
    });

    expect(screen.queryByText('game.draw_offer_received')).not.toBeInTheDocument();
    expect(screen.queryByText('game.opponent_dc')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'game.counting_stop' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'game.counting_stop' }));
    expect(socketMock.emit).toHaveBeenCalledWith('stop_counting');
    expect(boardPropsMock.mock.lastCall?.[0].isMyTurn).toBe(true);
  });

  it('auto-executes a legal premove when the turn changes and allows manual premove cancellation', async () => {
    getLegalMovesMock.mockReturnValue([{ row: 5, col: 4 }]);
    interactionState.premove = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } } as any;

    renderGamePage('/game/premove-room');

    const state = makeGameState();
    const board = state.board.map((row) => [...row]);
    board[6][4] = { type: 'P', color: 'white' };

    await act(async () => {
      emitSocketEvent('game_joined', {
        color: 'white',
        gameState: {
          ...state,
          board,
          turn: 'black',
        },
      });
    });

    expect(screen.getByText('game.premove_set')).toBeInTheDocument();

    await act(async () => {
      emitSocketEvent('game_state', {
        ...state,
        board,
        turn: 'white',
      });
    });

    expect(socketMock.emit).toHaveBeenCalledWith('make_move', {
      from: { row: 6, col: 4 },
      to: { row: 5, col: 4 },
    });
    expect(interactionState.cancelPremove).toHaveBeenCalled();
    expect(interactionState.clearSelection).toHaveBeenCalled();

    fireEvent.click(screen.getByText('common.cancel'));
    expect(interactionState.cancelPremove).toHaveBeenCalled();
    expect(interactionState.clearSelection).toHaveBeenCalled();
  });

  it('shows game-over UI, supports history navigation, and routes follow-up actions', async () => {
    const moveHistory = [
      { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } } as Move,
      { from: { row: 1, col: 4 }, to: { row: 2, col: 4 } } as Move,
    ];

    renderGamePage('/game/endgame-room');

    await act(async () => {
      emitSocketEvent('game_joined', joinPayload({
        moveHistory,
        gameOver: true,
      }));
    });

    interactionState.premove = { from: { row: 6, col: 4 }, to: { row: 5, col: 4 } } as any;

    await act(async () => {
      emitSocketEvent('game_over', {
        reason: 'checkmate',
        winner: 'white',
        ratingChange: {
          whiteBefore: 1500,
          blackBefore: 1500,
          whiteAfter: 1512,
          blackAfter: 1488,
        },
        gameState: makeGameState({
          moveHistory,
          gameOver: true,
        }),
      });
    });

    expect(screen.getByTestId('game-over-panel')).toBeInTheDocument();
    expect(screen.getByTestId('game-over-modal')).toBeInTheDocument();
    expect(playGameOverSoundMock).toHaveBeenCalledTimes(1);
    expect(interactionState.cancelPremove).toHaveBeenCalled();
    expect(gameOverPanelPropsMock.mock.lastCall?.[0].rated).toBe(false);
    expect(gameOverPanelPropsMock.mock.lastCall?.[0].ratingChange).toEqual({
      whiteBefore: 1500,
      blackBefore: 1500,
      whiteAfter: 1512,
      blackAfter: 1488,
    });

    fireEvent.click(screen.getByText('close-modal'));
    expect(screen.queryByTestId('game-over-modal')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(boardPropsMock.mock.lastCall?.[0].disabled).toBe(true);
    expect(boardPropsMock.mock.lastCall?.[0].isCheck).toBe(false);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'Home' });
    expect(moveHistoryPropsMock.mock.lastCall?.[0].currentMoveIndex).toBe(-1);

    fireEvent.keyDown(window, { key: 'End' });
    expect(moveHistoryPropsMock.mock.lastCall?.[0].currentMoveIndex).toBe(1);

    fireEvent.click(screen.getByText('jump-first-move'));
    expect(moveHistoryPropsMock.mock.lastCall?.[0].currentMoveIndex).toBe(0);

    fireEvent.click(screen.getByText('panel-analyze'));
    expect(navigateMock).toHaveBeenCalledWith('/analysis/endgame-room');

    fireEvent.click(screen.getByText('panel-rematch'));
    expect(socketMock.emit).toHaveBeenCalledWith('request_rematch');
    expect(gameOverPanelPropsMock.mock.lastCall?.[0].rematchDisabled).toBe(true);
    expect(gameOverPanelPropsMock.mock.lastCall?.[0].rematchLabel).toBe('gameover.rematch_sent');

    await act(async () => {
      emitSocketEvent('rematch_offered', { by: 'black' });
    });

    expect(gameOverPanelPropsMock.mock.lastCall?.[0].rematchNotice).toBe('gameover.rematch_waiting');

    fireEvent.click(screen.getByText('panel-new-game'));
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('leaves finished games on unmount so stale post-game state is cleaned up', async () => {
    const view = renderGamePage('/game/finished-room');

    await act(async () => {
      emitSocketEvent('game_joined', joinPayload({
        gameOver: true,
        gameId: 'finished-room',
        status: 'finished',
      }));
    });

    socketMock.emit.mockClear();
    socketMock.connected = true;
    view.unmount();

    expect(socketMock.emit).toHaveBeenCalledWith('leave_game', { gameId: 'finished-room' });
  });

  it('recovers from server errors, toggles the piece guide, and handles game replacement', async () => {
    renderGamePage('/game/error-room');

    await act(async () => {
      emitSocketEvent('error', { message: 'Game not found' });
    });

    expect(screen.getByText('Game not found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.back_home' }));
    expect(navigateMock).toHaveBeenCalledWith('/');

    await act(async () => {
      emitSocketEvent('game_joined', joinPayload());
    });

    fireEvent.click(screen.getByRole('button', { name: 'game.piece_guide' }));
    expect(screen.getByTestId('piece-guide')).toBeInTheDocument();
    expect(pieceGuidePropsMock.mock.lastCall?.[0].show).toBe(true);

    await act(async () => {
      emitSocketEvent('game_created', { gameId: 'replacement-room' });
    });

    expect(interactionState.clearSelection).toHaveBeenCalled();
    expect(interactionState.cancelPremove).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/game/replacement-room');
  });

  it('copies the share link in playing view, resets copied state, and lets header buttons navigate', async () => {
    vi.useFakeTimers();

    renderGamePage('/game/share-room');

    await act(async () => {
      emitSocketEvent('game_joined', joinPayload());
    });

    fireEvent.click(screen.getByRole('button', { name: 'game.share' }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);

    expect(screen.getByRole('button', { name: 'game.copied' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole('button', { name: 'game.share' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'app.name' }));
    expect(navigateMock).toHaveBeenCalledWith('/');

    vi.useRealTimers();
  });
});
