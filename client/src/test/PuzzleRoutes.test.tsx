import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../routes/PuzzleStreakRouteContent', () => ({
  default: () => <div>Puzzle streak content ready</div>,
}));

vi.mock('../routes/PuzzlePlayerRouteContent', () => ({
  default: () => <div>Puzzle player content ready</div>,
}));

import { PuzzleStreakRoute } from '../routes/PuzzleStreakRoute';
import { PuzzlePlayerRoute } from '../routes/PuzzlePlayerRoute';

describe('puzzle route wrappers', () => {
  it('renders streak route content immediately without an extra lazy-loading shell', () => {
    render(<PuzzleStreakRoute />);

    expect(screen.getByText('Puzzle streak content ready')).toBeInTheDocument();
    expect(screen.queryByText('Loading puzzles...')).not.toBeInTheDocument();
  });

  it('renders puzzle player content immediately without an extra lazy-loading shell', () => {
    render(<PuzzlePlayerRoute />);

    expect(screen.getByText('Puzzle player content ready')).toBeInTheDocument();
    expect(screen.queryByText('Loading puzzle...')).not.toBeInTheDocument();
  });
});
