import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Move } from '@shared/types';
import CapturedPiecesPanel from '../components/CapturedPiecesPanel';

vi.mock('../components/PieceSVG', () => ({
  default: ({ type, color }: { type: string; color: string }) => (
    <div data-testid={`piece-${color}-${type}`} />
  ),
}));

describe('CapturedPiecesPanel', () => {
  it('shows captured pieces by captor and the net material lead', () => {
    const moves: Move[] = [
      {
        from: { row: 6, col: 0 },
        to: { row: 5, col: 0 },
        captured: { type: 'P', color: 'black' },
      },
      {
        from: { row: 1, col: 0 },
        to: { row: 2, col: 0 },
        captured: { type: 'R', color: 'white' },
      },
      {
        from: { row: 6, col: 1 },
        to: { row: 5, col: 1 },
        captured: { type: 'S', color: 'black' },
      },
    ];

    render(
      <CapturedPiecesPanel
        moves={moves}
        topColor="black"
        topLabel="Bot"
        bottomColor="white"
        bottomLabel="You"
      />
    );

    expect(screen.getByText('Material')).toBeInTheDocument();
    expect(screen.getByText('Bot +1.5')).toBeInTheDocument();
    expect(screen.getByText('Captured by Bot')).toBeInTheDocument();
    expect(screen.getByText('Captured by You')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
    expect(screen.getByText('+3.5')).toBeInTheDocument();
    expect(screen.getByTestId('piece-white-R')).toBeInTheDocument();
    expect(screen.getByTestId('piece-black-S')).toBeInTheDocument();
    expect(screen.getByTestId('piece-black-P')).toBeInTheDocument();
  });

  it('shows an even material summary when both sides are level', () => {
    const moves: Move[] = [
      {
        from: { row: 6, col: 0 },
        to: { row: 5, col: 0 },
        captured: { type: 'P', color: 'black' },
      },
      {
        from: { row: 1, col: 0 },
        to: { row: 2, col: 0 },
        captured: { type: 'P', color: 'white' },
      },
    ];

    render(
      <CapturedPiecesPanel
        moves={moves}
        topColor="black"
        topLabel="Black"
        bottomColor="white"
        bottomLabel="White"
      />
    );

    expect(screen.getByText('Material even')).toBeInTheDocument();
  });
});
