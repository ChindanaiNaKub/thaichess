import type { Position } from './types';
import { createSeedPuzzleSource } from './puzzleSourceImport';

function square(name: string): Position {
  return {
    col: name.charCodeAt(0) - 97,
    row: Number.parseInt(name[1], 10) - 1,
  };
}

function line(...steps: string[]) {
  return steps.map((step) => {
    const [from, to] = step.split('-');
    if (!from || !to) {
      throw new Error(`Invalid move step: ${step}`);
    }

    return {
      from: square(from),
      to: square(to),
    };
  });
}

export const SEED_PUZZLE_SOURCES = [
  createSeedPuzzleSource({
    id: 'seed-legal-opening-shell',
    source: 'Seed game corpus: legal-opening-shell',
    moveCount: 10,
    result: '1-0',
    resultReason: 'resignation',
    startingPlyNumber: 1,
    moves: line(
      'a3-a4',
      'a6-a5',
      'b1-c3',
      'b8-c6',
      'c3-b5',
      'c6-b4',
      'd1-e2',
      'd8-c7',
      'h3-h4',
      'h6-h5',
    ),
  }),
];
