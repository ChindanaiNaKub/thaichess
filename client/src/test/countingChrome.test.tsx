import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CountingBoardStrip from '../components/CountingBoardStrip';
import { countingPanelClass, countingTitleClass } from '../components/countingChrome';

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('counting chrome', () => {
  it('keeps State Gold on the title eyebrow and uses a felt panel shell', () => {
    render(
      <CountingBoardStrip
        t={(key) => key}
        label="White counting 12 / 64"
        canStart
        onStart={() => undefined}
      />,
    );

    const strip = screen.getByTestId('counting-board-strip');
    expect(strip.className).toContain('bg-surface-alt/90');
    expect(strip.className).not.toMatch(/bg-gold\/10/);
    expect(strip.className.split(/\s+/)).toEqual(
      expect.arrayContaining(countingPanelClass.split(/\s+/)),
    );

    const title = screen.getByText('game.counting_title');
    expect(title.className.split(/\s+/)).toEqual(
      expect.arrayContaining(countingTitleClass.split(/\s+/)),
    );
    expect(title.className).toContain('text-gold');
  });

  it('keeps Start primary and defers help/leave until after Start or clock urgency', () => {
    render(
      <CountingBoardStrip
        t={(key) => key}
        label="White may start counting"
        canStart
        onStart={() => undefined}
        onOfferDraw={() => undefined}
        onResign={() => undefined}
      />,
    );

    expect(screen.getByTestId('counting-start-consequence')).toHaveTextContent(
      'game.counting_start_consequence',
    );
    expect(screen.getByRole('button', { name: 'game.counting_start' })).toBeInTheDocument();
    expect(screen.queryByTestId('counting-board-strip-details-toggle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('counting-board-strip-leave-toggle')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'game.counting_what' })).not.toBeInTheDocument();
  });

  it('surfaces leave exits when the clock is critical before Start', () => {
    render(
      <CountingBoardStrip
        t={(key) => key}
        label="White may start counting"
        canStart
        onStart={() => undefined}
        onOfferDraw={() => undefined}
        onResign={() => undefined}
        leaveUrgent
      />,
    );

    expect(screen.getByRole('button', { name: 'game.counting_start' })).toBeInTheDocument();
    expect(screen.queryByTestId('counting-board-strip-details-toggle')).not.toBeInTheDocument();
    const toggle = screen.getByTestId('counting-board-strip-leave-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('data-urgent', 'true');
    expect(screen.getByTestId('counting-board-strip-exits')).toBeInTheDocument();
  });

  it('keeps help and leave at the top level after Start is no longer available', () => {
    render(
      <CountingBoardStrip
        t={(key) => key}
        label="White counting 12 / 64"
        onOfferDraw={() => undefined}
        onResign={() => undefined}
        leaveUrgent
      />,
    );

    expect(screen.queryByTestId('counting-board-strip-details-toggle')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'game.counting_what' })).toBeInTheDocument();
    const toggle = screen.getByTestId('counting-board-strip-leave-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('counting-board-strip-exits')).toBeInTheDocument();
  });
});
