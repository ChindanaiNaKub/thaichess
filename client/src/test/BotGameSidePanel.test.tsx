import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialGameState } from '@shared/engine';
import { getBotPersonaById } from '@shared/botPersonas';
import type { GameState } from '@shared/types';
import { BotGameSidePanel, type ReviewControls, type ReviewEngineControls } from '../components/BotGameSidePanel';
import type { BotChatMessage } from '../lib/botDialogue';

vi.mock('../components/MoveHistory', () => ({
  default: () => <div data-testid="move-history" />,
}));

vi.mock('../components/BotAvatar', () => ({
  default: () => <div data-testid="bot-avatar" />,
}));

vi.mock('../components/GameOverPanel', () => ({
  default: () => <div data-testid="game-over-panel" />,
}));

vi.mock('../components/PostGameSharePanel', () => ({
  default: () => <div data-testid="post-game-share-panel" />,
}));

vi.mock('../components/PostGameReviewPanel', () => ({
  default: () => <div data-testid="post-game-review-panel" />,
}));

vi.mock('../components/ResignConfirmControls', () => ({
  default: ({ resignLabelKey }: { resignLabelKey: string }) => (
    <button type="button">{resignLabelKey}</button>
  ),
}));

const persona = getBotPersonaById(null);
const initialState = createInitialGameState(300_000, 300_000);

const review = {
  mode: 'mainLine',
  currentState: initialState,
  currentMoveHistory: [],
  currentLastMove: null,
  currentCheckSquare: null,
  selectedMainLineMoveIndex: -1,
  analysisRootMoveIndex: null,
  analysisLine: [],
  legalMoves: [],
  selectedSquare: null,
  canEnterAnalysis: false,
  canResetAnalysis: false,
  canStepBackward: false,
  canStepForward: false,
  enterAnalysis: vi.fn(),
  returnToMainLine: vi.fn(),
  resetAnalysis: vi.fn(),
  stepBackward: vi.fn(),
  stepForward: vi.fn(),
  jumpToStart: vi.fn(),
  jumpToEnd: vi.fn(),
  jumpToMainLine: vi.fn(),
  handleSquareClick: vi.fn(),
  handlePieceDrop: vi.fn(),
} as unknown as ReviewControls;

const reviewEngine: ReviewEngineControls = {
  analysis: null,
  analyzing: false,
  error: null,
};

const translation = {
  backstory: '',
  hook: 'hook',
  opening: '',
  signature: '',
  tactical: '',
  weakness: '',
  chatStyle: '',
};

function renderPanel(
  gameState: GameState,
  options: { botChat?: BotChatMessage | null } = {},
) {
  return render(
    <BotGameSidePanel
      t={(key) => key}
      selectedBot={persona}
      selectedBotTranslation={translation}
      gameState={gameState}
      playerColor="white"
      playerDisplayName="You"
      botName={persona.name}
      levelLabel="Level 1"
      difficultyLabel="Easy"
      estimatedEloLabel="Elo 800"
      counting={{ label: null, start: null, stop: null }}
      currentGameId={null}
      gameOverInfo={gameState.gameOver ? { reason: 'checkmate', winner: 'white' } : null}
      botChat={options.botChat ?? null}
      botChatFading={false}
      review={review}
      reviewEngine={reviewEngine}
      viewMoveIndex={null}
      onRematch={vi.fn()}
      onNewGame={vi.fn()}
      onAnalyze={undefined}
      onMoveClick={vi.fn()}
      onResign={vi.fn()}
      onHome={vi.fn()}
      onShowGuide={vi.fn()}
      showHighStakesActions
      endgamePeakOpen={false}
    />,
  );
}

describe('BotGameSidePanel home affordance', () => {
  it('hides side-panel Back home while playing so resign stays the high-stakes exit', () => {
    renderPanel({ ...initialState, gameOver: false });
    expect(screen.queryByTestId('bot-side-panel-home')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'bot.resign' })).toBeInTheDocument();
    const guide = screen.getByTestId('piece-guide-side');
    const history = screen.getByTestId('move-history');
    expect(guide.compareDocumentPosition(history) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByText('game.nav_hint')).not.toBeInTheDocument();
  });

  it('restores Back home after the game ends and shows the shared nav hint', () => {
    renderPanel({
      ...initialState,
      gameOver: true,
      moveHistory: [{
        from: { row: 5, col: 0 },
        to: { row: 4, col: 0 },
      }],
    });
    expect(screen.getByTestId('bot-side-panel-home')).toBeInTheDocument();
    expect(screen.getByText('game.nav_hint')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'game.piece_guide' })).toBeInTheDocument();
  });
});

describe('BotGameSidePanel mid-play chat', () => {
  const thinkingChat: BotChatMessage = {
    id: 'thinking-1',
    text: 'Hmm…',
    category: 'thinking',
    lineKey: 'thinking:quiet',
    phase: 'middlegame',
  };

  const banterChat: BotChatMessage = {
    id: 'tactical-1',
    text: 'Nice try!',
    category: 'tactical',
    lineKey: 'tactical:banter',
    phase: 'middlegame',
  };

  it('hides banter toasts mid-play so clocks and status stay primary', () => {
    renderPanel(
      { ...initialState, gameOver: false },
      { botChat: banterChat },
    );
    expect(screen.queryByTestId('bot-chat-toast')).not.toBeInTheDocument();
  });

  it('keeps thinking as a quiet mid-play status line', () => {
    renderPanel(
      { ...initialState, gameOver: false },
      { botChat: thinkingChat },
    );
    const toast = screen.getByTestId('bot-chat-toast');
    expect(toast).toHaveAttribute('data-quiet', 'true');
    expect(toast).toHaveTextContent('Hmm…');
  });

  it('restores full chat toast after the game ends', () => {
    renderPanel(
      {
        ...initialState,
        gameOver: true,
        moveHistory: [{
          from: { row: 5, col: 0 },
          to: { row: 4, col: 0 },
        }],
      },
      { botChat: banterChat },
    );
    const toast = screen.getByTestId('bot-chat-toast');
    expect(toast).not.toHaveAttribute('data-quiet');
    expect(toast).toHaveTextContent('Nice try!');
    expect(toast).toHaveTextContent(persona.name);
  });
});
