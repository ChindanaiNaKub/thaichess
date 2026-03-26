import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialBoard } from '@shared/engine';
import type { Move } from '@shared/types';
import MoveHistory from '../components/MoveHistory';

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const moves: Move[] = [
  { from: { row: 2, col: 0 }, to: { row: 3, col: 0 } },
  { from: { row: 5, col: 0 }, to: { row: 4, col: 0 } },
  { from: { row: 0, col: 1 }, to: { row: 2, col: 2 } },
  { from: { row: 7, col: 1 }, to: { row: 5, col: 2 } },
  { from: { row: 2, col: 2 }, to: { row: 0, col: 1 } },
  { from: { row: 5, col: 2 }, to: { row: 7, col: 1 } },
];

describe('MoveHistory', () => {
  it('scrolls only the move list container to keep the active move visible', () => {
    const { rerender } = render(
      <MoveHistory
        moves={moves}
        initialBoard={createInitialBoard()}
        currentMoveIndex={4}
      />
    );

    const scrollContainer = screen.getByText('moves.title').closest('div')?.nextElementSibling as HTMLDivElement;
    const activeMove = screen.getByText('c6-b8');

    Object.defineProperty(scrollContainer, 'clientHeight', {
      configurable: true,
      value: 100,
    });
    Object.defineProperty(activeMove, 'offsetTop', {
      configurable: true,
      value: 180,
    });
    Object.defineProperty(activeMove, 'offsetHeight', {
      configurable: true,
      value: 24,
    });

    scrollContainer.scrollTop = 0;

    rerender(
      <MoveHistory
        moves={moves}
        initialBoard={createInitialBoard()}
        currentMoveIndex={5}
      />
    );

    expect(scrollContainer.scrollTop).toBe(104);
  });
});
