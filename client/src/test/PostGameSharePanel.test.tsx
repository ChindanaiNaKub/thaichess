import type { ComponentProps } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PieceStyleProvider } from '../lib/pieceStyle';
import { I18nProvider } from '../lib/i18n';
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
  it('keeps result export available while accuracy and rating are unavailable', () => {
    useGameAnalysisMock.mockReturnValue({
      analysis: null,
      analyzing: true,
      progress: null,
      error: null,
    });

    renderPanel();

    expect(screen.getByRole('button', { name: 'Result' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Accuracy' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rating' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeEnabled();

    const exportCanvases = screen.getAllByTestId('share-card-export-canvas');
    expect(exportCanvases).toHaveLength(2);
    expect(exportCanvases[0]).toHaveStyle({ width: '1200px', height: '630px' });
  });

  it('enables accuracy and rating variants when real data is present', () => {
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
