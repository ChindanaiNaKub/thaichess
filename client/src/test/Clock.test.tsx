import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Clock from '../components/Clock';

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'game.ping_value') return `${params?.ms}ms`;
      return key;
    },
  }),
}));

vi.mock('../components/BotAvatar', () => ({
  default: () => <div data-testid="bot-avatar" />,
}));

vi.mock('../components/InlineCapturedSummary', () => ({
  default: ({ capturedPieces, materialDelta }: { capturedPieces: Array<{ type: string; count: number }>; materialDelta?: number | null }) => {
    const pieceCount = capturedPieces.reduce((sum, piece) => sum + piece.count, 0);

    if (!pieceCount && !materialDelta) return null;

    return (
      <div
        data-testid="inline-captured-summary"
        data-piece-count={pieceCount}
        data-material={materialDelta ?? ''}
      />
    );
  },
}));

describe('Clock', () => {
  it('renders an inline captured summary next to the player name', () => {
    const { container } = render(
      <Clock
        time={60000}
        isActive={false}
        color="white"
        playerName="Guest"
        capturedPieces={[
          { type: 'R', count: 1, capturedColor: 'black' },
          { type: 'N', count: 1, capturedColor: 'black' },
          { type: 'S', count: 2, capturedColor: 'black' },
          { type: 'M', count: 2, capturedColor: 'black' },
          { type: 'PM', count: 1, capturedColor: 'black' },
          { type: 'P', count: 4, capturedColor: 'black' },
        ]}
        materialDelta={15.5}
      />
    );

    const summary = screen.getByTestId('inline-captured-summary');
    const nameRow = container.querySelector('div[class*="min-w-0 items-center gap-2"]');

    expect(summary).toBeInTheDocument();
    expect(summary).toHaveAttribute('data-piece-count', '11');
    expect(summary).toHaveAttribute('data-material', '15.5');
    expect(nameRow).toContainElement(summary);
    expect(container.querySelector('div[class*="grid-cols-"]')).not.toBeInTheDocument();
  });

  it('omits the inline summary when there are no captures', () => {
    render(
      <Clock
        time={60000}
        isActive={true}
        color="black"
        playerName="Guest"
      />
    );

    expect(screen.queryByTestId('inline-captured-summary')).not.toBeInTheDocument();
  });
});
