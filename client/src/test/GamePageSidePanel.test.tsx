import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialGameState } from '@shared/engine';
import type { ClientGameState } from '@shared/types';
import { GamePageSidePanel, type ReviewControls, type ReviewEngineControls } from '../components/GamePageSidePanel';

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../components/MoveHistory', () => ({
  default: () => <div data-testid="move-history" />,
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

const review = {
  mode: 'mainLine',
  currentState: createInitialGameState(300_000, 300_000),
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

function playingState(): ClientGameState {
  return {
    ...createInitialGameState(300_000, 300_000),
    status: 'playing',
    gameOver: false,
    playerColor: 'white',
    whitePlayerName: 'You',
    blackPlayerName: 'Opp',
    whiteRating: 1500,
    blackRating: 1500,
    whiteConnected: true,
    blackConnected: true,
    rated: false,
    gameMode: 'quick_play',
    moveHistory: Array.from({ length: 40 }, () => ({
      from: { row: 5, col: 0 },
      to: { row: 4, col: 0 },
    })),
  } as unknown as ClientGameState;
}

describe('GamePageSidePanel high-stakes layout', () => {
  it('pins draw/resign above move history on desktop', () => {
    const t = (key: string) => key;
    render(
      <GamePageSidePanel
        t={t}
        gameId="g1"
        gameState={playingState()}
        playerColor="white"
        countingLabel={null}
        canStartCounting={false}
        canStopCounting={false}
        gameOverInfo={null}
        rematchLabel="rematch"
        rematchNotice={null}
        rematchDisabled={false}
        reportLabel="report"
        reportDisabled={false}
        canReportOpponent={false}
        timeControl={null}
        whitePlayerName="You"
        blackPlayerName="Opp"
        review={review}
        reviewEngine={reviewEngine}
        reviewActive={false}
        viewMoveIndex={null}
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={undefined}
        onReport={undefined}
        onMoveClick={vi.fn()}
        onOfferDraw={vi.fn()}
        onResign={vi.fn()}
        onStartCounting={vi.fn()}
        onStopCounting={vi.fn()}
        onShowGuide={vi.fn()}
        showHighStakesActions
      />,
    );

    const stakes = screen.getByTestId('side-panel-high-stakes');
    const history = screen.getByTestId('move-history');
    expect(stakes.compareDocumentPosition(history) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('button', { name: 'game.offer_draw' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'game.resign' })).toBeInTheDocument();
    const guide = screen.getByTestId('piece-guide-side');
    expect(guide.compareDocumentPosition(history) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('collapses draw/resign under leave while counting, and expands when urgent', () => {
    const t = (key: string) => key;
    const { rerender } = render(
      <GamePageSidePanel
        t={t}
        gameId="g1"
        gameState={playingState()}
        playerColor="white"
        countingLabel="White counting 12 / 64"
        canStartCounting={false}
        canStopCounting={false}
        gameOverInfo={null}
        rematchLabel="rematch"
        rematchNotice={null}
        rematchDisabled={false}
        reportLabel="report"
        reportDisabled={false}
        canReportOpponent={false}
        timeControl={null}
        whitePlayerName="You"
        blackPlayerName="Opp"
        review={review}
        reviewEngine={reviewEngine}
        reviewActive={false}
        viewMoveIndex={null}
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={undefined}
        onReport={undefined}
        onMoveClick={vi.fn()}
        onOfferDraw={vi.fn()}
        onResign={vi.fn()}
        onStartCounting={vi.fn()}
        onStopCounting={vi.fn()}
        onShowGuide={vi.fn()}
        showHighStakesActions
      />,
    );

    expect(screen.getByTestId('side-panel-high-stakes')).toBeInTheDocument();
    expect(screen.getByTestId('side-panel-counting-leave-toggle')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('side-panel-counting-leave-exits')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'game.offer_draw' })).not.toBeInTheDocument();

    rerender(
      <GamePageSidePanel
        t={t}
        gameId="g1"
        gameState={playingState()}
        playerColor="white"
        countingLabel="White counting 12 / 64"
        canStartCounting={false}
        canStopCounting={false}
        gameOverInfo={null}
        rematchLabel="rematch"
        rematchNotice={null}
        rematchDisabled={false}
        reportLabel="report"
        reportDisabled={false}
        canReportOpponent={false}
        timeControl={null}
        whitePlayerName="You"
        blackPlayerName="Opp"
        review={review}
        reviewEngine={reviewEngine}
        reviewActive={false}
        viewMoveIndex={null}
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={undefined}
        onReport={undefined}
        onMoveClick={vi.fn()}
        onOfferDraw={vi.fn()}
        onResign={vi.fn()}
        onStartCounting={vi.fn()}
        onStopCounting={vi.fn()}
        onShowGuide={vi.fn()}
        showHighStakesActions
        leaveUrgent
      />,
    );

    const toggle = screen.getByTestId('side-panel-counting-leave-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('data-urgent', 'true');
    expect(screen.getByTestId('side-panel-counting-leave-exits')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'game.offer_draw' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'game.resign' })).toBeInTheDocument();
  });

  it('suppresses duplicate endgame chrome while the peak-end modal is open', () => {
    const t = (key: string) => key;
    const overState = {
      ...playingState(),
      gameOver: true,
      status: 'finished' as const,
    };

    const { rerender } = render(
      <GamePageSidePanel
        t={t}
        gameId="g1"
        gameState={overState}
        playerColor="white"
        countingLabel={null}
        canStartCounting={false}
        canStopCounting={false}
        gameOverInfo={{ reason: 'checkmate', winner: 'white', ratingChange: null }}
        rematchLabel="rematch"
        rematchNotice={null}
        rematchDisabled={false}
        reportLabel="report"
        reportDisabled={false}
        canReportOpponent={false}
        timeControl={null}
        whitePlayerName="You"
        blackPlayerName="Opp"
        review={review}
        reviewEngine={reviewEngine}
        reviewActive
        viewMoveIndex={null}
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={undefined}
        onReport={undefined}
        onMoveClick={vi.fn()}
        onOfferDraw={vi.fn()}
        onResign={vi.fn()}
        onStartCounting={vi.fn()}
        onStopCounting={vi.fn()}
        onShowGuide={vi.fn()}
        endgamePeakOpen
      />,
    );

    expect(screen.queryByTestId('game-over-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('post-game-share-expand')).not.toBeInTheDocument();

    rerender(
      <GamePageSidePanel
        t={t}
        gameId="g1"
        gameState={overState}
        playerColor="white"
        countingLabel={null}
        canStartCounting={false}
        canStopCounting={false}
        gameOverInfo={{ reason: 'checkmate', winner: 'white', ratingChange: null }}
        rematchLabel="rematch"
        rematchNotice={null}
        rematchDisabled={false}
        reportLabel="report"
        reportDisabled={false}
        canReportOpponent={false}
        timeControl={null}
        whitePlayerName="You"
        blackPlayerName="Opp"
        review={review}
        reviewEngine={reviewEngine}
        reviewActive
        viewMoveIndex={null}
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={undefined}
        onReport={undefined}
        onMoveClick={vi.fn()}
        onOfferDraw={vi.fn()}
        onResign={vi.fn()}
        onStartCounting={vi.fn()}
        onStopCounting={vi.fn()}
        onShowGuide={vi.fn()}
        endgamePeakOpen={false}
      />,
    );

    expect(screen.getByTestId('game-over-panel')).toBeInTheDocument();
    expect(screen.getByTestId('game-over-panel-rematch')).toBeInTheDocument();
    expect(screen.queryByTestId('game-over-panel-more-toggle')).not.toBeInTheDocument();
    expect(screen.getByTestId('post-game-share-expand')).toBeInTheDocument();
    expect(screen.getByTestId('post-game-review-expand')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('post-game-review-expand'));
    expect(screen.getByTestId('post-game-review-path')).toBeInTheDocument();
    expect(screen.getByTestId('post-game-review-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('post-game-share-expand')).not.toBeInTheDocument();
    expect(screen.queryByTestId('post-game-review-expand')).not.toBeInTheDocument();
  });
});
