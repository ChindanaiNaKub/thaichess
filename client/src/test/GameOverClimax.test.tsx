import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GameOverModal from '../components/GameOverModal';
import GameOverPanel from '../components/GameOverPanel';

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('Felt Table game-over climax', () => {
  it('GameOverModal uses outcome seal instead of Western 1/0/½ glyphs', () => {
    render(
      <GameOverModal
        winner="white"
        reason="checkmate"
        playerColor="white"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
      />,
    );

    const mark = screen.getByTestId('game-over-outcome-mark');
    expect(mark).toHaveAttribute('data-outcome', 'win');
    expect(screen.getByTestId('game-over-modal')).not.toHaveTextContent(/^1$/);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.queryByText('½')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'gameover.you_win' })).toBeInTheDocument();
  });

  it('GameOverModal draw and loss seals stay glyph-free', () => {
    const { rerender } = render(
      <GameOverModal
        winner={null}
        reason="draw_agreement"
        playerColor="white"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
      />,
    );
    expect(screen.getByTestId('game-over-outcome-mark')).toHaveAttribute('data-outcome', 'draw');
    expect(screen.queryByText('½')).not.toBeInTheDocument();

    rerender(
      <GameOverModal
        winner="black"
        reason="resignation"
        playerColor="white"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
      />,
    );
    expect(screen.getByTestId('game-over-outcome-mark')).toHaveAttribute('data-outcome', 'loss');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('GameOverPanel uses the same second-person climax copy as the modal', () => {
    render(
      <GameOverPanel
        winner="white"
        reason="checkmate"
        playerColor="black"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
      />,
    );

    expect(screen.getByTestId('game-over-outcome-mark')).toHaveAttribute('data-outcome', 'loss');
    expect(screen.getByTestId('game-over-panel-title')).toHaveTextContent('gameover.you_lost');
    expect(screen.queryByText(/is_victorious/)).not.toBeInTheDocument();
    expect(screen.queryByText('1-0')).not.toBeInTheDocument();
    expect(screen.queryByText('½-½')).not.toBeInTheDocument();
  });

  it('GameOverPanel keeps color-victorious copy only for spectators', () => {
    render(
      <GameOverPanel
        winner="white"
        reason="checkmate"
        playerColor={null}
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
      />,
    );

    expect(screen.getByTestId('game-over-panel-title')).toHaveTextContent(/common\.white/);
    expect(screen.getByTestId('game-over-panel-title')).toHaveTextContent(/is_victorious/);
    expect(screen.queryByText('gameover.you_win')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-over-outcome-mark')).toHaveAttribute('data-outcome', 'win');
    expect(screen.getByTestId('game-over-panel-title').className).toMatch(/text-gold/);
  });

  it('GameOverModal matches Panel null-seat table climax (not you_lost)', () => {
    render(
      <GameOverModal
        winner="black"
        reason="checkmate"
        playerColor={null}
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading')).toHaveTextContent(/common\.black/);
    expect(screen.getByRole('heading')).toHaveTextContent(/is_victorious/);
    expect(screen.queryByRole('heading', { name: 'gameover.you_lost' })).not.toBeInTheDocument();
    expect(screen.getByTestId('game-over-outcome-mark')).toHaveAttribute('data-outcome', 'win');
    expect(screen.getByRole('heading').className).toMatch(/text-gold/);
  });

  it('opens Study as Analyze under More beside Share/Review siblings', () => {
    const onAnalyze = vi.fn();
    render(
      <GameOverPanel
        winner="white"
        reason="checkmate"
        playerColor="white"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={onAnalyze}
        moreExtras={(
          <>
            <button type="button" data-testid="post-game-share-expand">share</button>
            <button type="button" data-testid="post-game-review-expand">review</button>
          </>
        )}
      />,
    );

    expect(screen.queryByTestId('post-game-share-expand')).not.toBeInTheDocument();
    expect(screen.queryByTestId('analyze-game-button')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('game-over-panel-more-toggle'));
    expect(screen.getByTestId('analyze-game-button')).toHaveTextContent('game.endgame_study');
    expect(screen.getByTestId('post-game-share-expand')).toBeInTheDocument();
    expect(screen.getByTestId('post-game-review-expand')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('analyze-game-button'));
    expect(onAnalyze).toHaveBeenCalledTimes(1);
  });

  it('hides Analyze while a study path owns More', () => {
    render(
      <GameOverPanel
        winner="white"
        reason="checkmate"
        playerColor="white"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={vi.fn()}
        moreExtrasOnly
        moreExtras={(
          <div data-testid="post-game-review-path">
            <button type="button">hide review</button>
          </div>
        )}
      />,
    );

    fireEvent.click(screen.getByTestId('game-over-panel-more-toggle'));
    expect(screen.queryByTestId('analyze-game-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('post-game-review-path')).toBeInTheDocument();
  });

  it('GameOverModal matches Panel: Rematch primary, Study→Analyze behind More', () => {
    const onAnalyze = vi.fn();
    render(
      <GameOverModal
        winner="white"
        reason="checkmate"
        playerColor="white"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={onAnalyze}
        onReport={vi.fn()}
      />,
    );

    expect(screen.getByTestId('game-over-modal-rematch')).toHaveClass('button-accent-contrast');
    expect(screen.getByTestId('game-over-modal-new-game')).not.toHaveClass('button-accent-contrast');
    expect(screen.getByTestId('game-over-modal-new-game')).not.toHaveClass('ui-btn-secondary');
    expect(screen.queryByTestId('analyze-game-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-over-modal-more-toggle')).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByTestId('game-over-modal-more-toggle'));
    expect(screen.getByTestId('analyze-game-button')).toHaveTextContent('game.endgame_study');
    fireEvent.click(screen.getByTestId('analyze-game-button'));
    expect(onAnalyze).toHaveBeenCalledTimes(1);
  });

  it('offers quiet Share under More at peak without dismissing Rematch', () => {
    render(
      <GameOverModal
        winner="white"
        reason="checkmate"
        playerColor="white"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={vi.fn()}
        moreExtras={(
          <button type="button" data-testid="post-game-share-expand">
            game.show_share
          </button>
        )}
      />,
    );

    expect(screen.getByTestId('game-over-modal-rematch')).toBeInTheDocument();
    expect(screen.queryByTestId('post-game-share-expand')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('game-over-modal-more-toggle'));
    expect(screen.getByTestId('analyze-game-button')).toBeInTheDocument();
    expect(screen.getByTestId('post-game-share-expand')).toBeInTheDocument();
  });

  it('lets Share own More exclusively when expanded at peak', () => {
    render(
      <GameOverModal
        winner="white"
        reason="checkmate"
        playerColor="white"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
        onAnalyze={vi.fn()}
        moreExtrasOnly
        moreExtras={(
          <div data-testid="post-game-share-path">
            <button type="button">hide share</button>
          </div>
        )}
      />,
    );

    fireEvent.click(screen.getByTestId('game-over-modal-more-toggle'));
    expect(screen.queryByTestId('analyze-game-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('post-game-share-path')).toBeInTheDocument();
  });

  it('GameOverModal uses cloth scrim and board-frame lift instead of SaaS overlay', () => {
    render(
      <GameOverModal
        winner="white"
        reason="checkmate"
        playerColor="white"
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
      />,
    );

    const scrim = screen.getByTestId('game-over-modal-scrim');
    expect(scrim.className).not.toMatch(/bg-black/);
    expect(scrim.className).toMatch(/oklch\(0\.12/);

    const panel = screen.getByTestId('game-over-modal');
    expect(panel.className).not.toMatch(/shadow-2xl/);
    expect(panel.className).toMatch(/oklch\(0\.10_0\.02_65/);
    expect(panel.className).toMatch(/bg-surface-alt/);
  });

  it('keeps State Gold off Rated and rating Δ metadata', () => {
    render(
      <GameOverModal
        winner="white"
        reason="checkmate"
        playerColor="white"
        rated
        ratingChange={{
          whiteBefore: 1500,
          whiteAfter: 1512,
          blackBefore: 1500,
          blackAfter: 1488,
        }}
        onRematch={vi.fn()}
        onNewGame={vi.fn()}
      />,
    );

    const chip = screen.getByTestId('game-over-rated-chip');
    const delta = screen.getByTestId('game-over-rating-delta');
    expect(chip.className).not.toMatch(/text-gold|bg-gold/);
    expect(chip.className).toMatch(/text-primary-light/);
    expect(delta.className).not.toMatch(/text-gold/);
    expect(delta.className).toMatch(/text-primary-light/);
    expect(screen.getByTestId('game-over-outcome-mark').className).toMatch(/text-gold/);
  });
});
