import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { createInitialBoard } from '@shared/engine';
import BoardSnapshot from '../components/BoardSnapshot';

vi.mock('../components/PieceSVG', () => ({
  default: ({ type, color }: { type: string; color: string }) => {
    return <div data-testid={`piece-${type}-${color}`} />;
  },
}));

describe('BoardSnapshot', () => {
  beforeEach(() => {
    window.localStorage.removeItem('thaichess-lang');
  });

  it('renders English coordinate files by default', () => {
    const { getByTestId } = render(
      <BoardSnapshot board={createInitialBoard()} playerColor="white" lastMove={null} />,
    );

    expect(getByTestId('board-snapshot-file-label-0')).toHaveTextContent('a');
    expect(getByTestId('board-snapshot-file-label-7')).toHaveTextContent('h');
    expect(getByTestId('board-snapshot-rank-label-0')).toHaveTextContent('1');
  });

  it('renders Thai coordinate files when Thai is selected', () => {
    window.localStorage.setItem('thaichess-lang', 'th');

    const { getByTestId } = render(
      <BoardSnapshot board={createInitialBoard()} playerColor="white" lastMove={null} />,
    );

    expect(getByTestId('board-snapshot-file-label-0')).toHaveTextContent('ก');
    expect(getByTestId('board-snapshot-file-label-2')).toHaveTextContent('ค');
    expect(getByTestId('board-snapshot-file-label-7')).toHaveTextContent('ญ');
  });
});
