import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Clock from '../components/Clock';

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === 'game.ping_value') return `${params?.ms}ms`;
      if (key === 'game.ping_degraded') return `Slow · ${params?.ms} ms`;
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

  it('shows to-move only on the timer, not as a name-row chip', () => {
    const { container } = render(
      <Clock
        time={60000}
        isActive={true}
        color="white"
        playerName="Guest"
      />
    );

    expect(screen.getAllByText('game.to_move')).toHaveLength(1);
    expect(container.querySelector('.text-gold')).not.toBeInTheDocument();
  });

  it('marks reconnecting presence with lacquer, not play amber', () => {
    const { container } = render(
      <Clock
        time={60000}
        isActive={false}
        color="white"
        playerName="Guest"
        status="reconnecting"
        showTimer={false}
      />
    );

    const presenceDot = container.querySelector('.bg-primary-light');
    expect(presenceDot).toBeInTheDocument();
    expect(container.querySelector('.bg-accent')).not.toBeInTheDocument();
  });

  it('keeps active timed clocks to name + timer; parks rating and color chips', () => {
    render(
      <Clock
        time={60000}
        isActive={true}
        color="white"
        playerName="Guest"
        rating={1540}
        subtitle="White"
        status="idle"
        latencyMs={42}
      />
    );

    expect(screen.getByText('game.to_move')).toBeInTheDocument();
    expect(screen.queryByText(/leaderboard.col_rating/i)).not.toBeInTheDocument();
    expect(screen.queryByText('game.idle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('clock-latency-chip')).not.toBeInTheDocument();
  });

  it('surfaces degraded latency as a visible chip while healthy ping stays on the avatar title', () => {
    const { rerender } = render(
      <Clock
        time={60000}
        isActive={false}
        color="black"
        playerName="Rival"
        latencyMs={210}
      />
    );

    expect(screen.getByTestId('clock-latency-chip')).toHaveTextContent('Slow · 210 ms');
    expect(screen.getByTestId('clock-latency-chip').className).not.toMatch(/primary/);

    rerender(
      <Clock
        time={60000}
        isActive={false}
        color="black"
        playerName="Rival"
        latencyMs={420}
      />
    );

    expect(screen.getByTestId('clock-latency-chip')).toHaveClass('text-danger');
  });

  it('surfaces reconnecting as a text chip while rating stays on idle clocks only', () => {
    const { rerender } = render(
      <Clock
        time={60000}
        isActive={false}
        color="black"
        playerName="Rival"
        rating={1600}
        status="reconnecting"
      />
    );

    expect(screen.getByText('conn.reconnecting')).toBeInTheDocument();
    expect(screen.getByText(/leaderboard.col_rating/i)).toBeInTheDocument();

    rerender(
      <Clock
        time={60000}
        isActive={true}
        color="black"
        playerName="Rival"
        rating={1600}
        status="reconnecting"
      />
    );

    expect(screen.getByText('conn.reconnecting')).toBeInTheDocument();
    expect(screen.queryByText(/leaderboard.col_rating/i)).not.toBeInTheDocument();
  });
});
