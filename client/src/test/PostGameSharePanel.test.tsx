import type { ComponentProps } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PieceStyleProvider } from '../lib/pieceStyle';
import { I18nProvider } from '../lib/i18n';
import { TOAST_LIFT_CLASS } from '../lib/toast';
import PostGameSharePanel from '../components/PostGameSharePanel';

const useGameAnalysisMock = vi.fn();
const useAuthMock = vi.fn(() => ({
  user: { id: 'player-1' },
  loading: false,
}));

vi.mock('../hooks/useGameAnalysis', () => ({
  useGameAnalysis: (...args: unknown[]) => useGameAnalysisMock(...args),
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => useAuthMock(),
}));

function renderPanel(props?: Partial<ComponentProps<typeof PostGameSharePanel>>) {
  return render(
    <I18nProvider>
      <PieceStyleProvider>
        <BrowserRouter>
          <PostGameSharePanel
            board={Array.from({ length: 8 }, () => Array(8).fill(null))}
            lastMove={null}
            moves={[]}
            moveCount={0}
            playerColor="white"
            whitePlayerName="Alice"
            blackPlayerName="Bob"
            winner="white"
            resultReason="checkmate"
            gameMode="quick_play"
            {...props}
          />
        </BrowserRouter>
      </PieceStyleProvider>
    </I18nProvider>,
  );
}

describe('PostGameSharePanel', () => {
  it('defaults to a quiet Result export path without Accuracy/Rating studio chrome', () => {
    useGameAnalysisMock.mockReturnValue({
      analysis: null,
      analyzing: true,
      progress: null,
      error: null,
    });

    renderPanel();

    const panel = screen.getByTestId('post-game-share-panel');
    expect(panel.className).toContain(TOAST_LIFT_CLASS);
    expect(panel.className).not.toMatch(/rgba\(0,0,0,0\.14\)/);
    expect(screen.getByTestId('post-game-share-outcome-chip').className).toMatch(/text-gold/);
    expect(screen.getByTestId('post-game-share-outcome-chip').className).not.toMatch(/primary/);
    expect(screen.queryByRole('button', { name: 'Accuracy' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rating' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeEnabled();
    expect(screen.getByTestId('post-game-share-export')).toHaveClass('ui-btn-secondary');
    expect(screen.getByTestId('post-game-share-export').className).not.toMatch(/bg-primary/);

    const previewFrame = screen.getByTestId('share-card-preview-viewport').parentElement?.parentElement;
    expect(previewFrame?.className).not.toMatch(/#120d0a|bg-\[#120d0a\]/);
    expect(previewFrame?.className).toMatch(/bg-surface/);

    const exportCanvases = screen.getAllByTestId('share-card-export-canvas');
    expect(exportCanvases).toHaveLength(2);
    expect(exportCanvases[0]).toHaveStyle({ width: '1200px', height: '630px' });
    const siteUrls = screen.getAllByTestId('share-card-site-url');
    expect(siteUrls.length).toBeGreaterThan(0);
    expect(siteUrls[0]).toHaveTextContent('thaichess.dev');
    const previewViewport = screen.getByTestId('share-card-preview-viewport');
    expect(previewViewport.style.width).toBe('252px');
    expect(Number.parseFloat(previewViewport.style.height)).toBeCloseTo(132.3);
    expect(previewViewport.style.maxWidth).toBe('100%');
  });

  it('defers Accuracy and Rating variants behind More card styles', () => {
    useGameAnalysisMock.mockReturnValue({
      analysis: {
        moves: [],
        evaluations: [0],
        whiteAccuracy: 92.4,
        blackAccuracy: 88.1,
        summary: {
          white: { best: 8, excellent: 3, good: 5, inaccuracy: 1, mistake: 0, blunder: 0 },
          black: { best: 6, excellent: 2, good: 4, inaccuracy: 2, mistake: 1, blunder: 0 },
        },
      },
      analyzing: false,
      progress: null,
      error: null,
    });

    renderPanel({
      moves: [{ from: { row: 1, col: 1 }, to: { row: 2, col: 1 } }],
      moveCount: 1,
      ratingChange: {
        whiteBefore: 1500,
        whiteAfter: 1512,
        blackBefore: 1500,
        blackAfter: 1488,
      },
    });

    expect(screen.queryByTestId('post-game-share-styles')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('post-game-share-styles-toggle'));
    expect(screen.getByTestId('post-game-share-styles')).toBeInTheDocument();

    const accuracyButton = screen.getByRole('button', { name: 'Accuracy' });
    const ratingButton = screen.getByRole('button', { name: 'Rating' });

    expect(accuracyButton).toBeEnabled();
    expect(ratingButton).toBeEnabled();

    fireEvent.click(accuracyButton);
    expect(screen.getAllByText('Accuracy').length).toBeGreaterThan(0);

    fireEvent.click(ratingButton);
    expect(screen.getAllByText('Rating').length).toBeGreaterThan(0);
  });
});
