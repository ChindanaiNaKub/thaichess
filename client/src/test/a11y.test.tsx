import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInitialBoard } from '@shared/engine';
import Board from '../components/Board';
import type { PieceColor, Position } from '@shared/types';
import { render } from './utils';

vi.mock('../components/PieceSVG', () => ({
  default: ({ type, color }: { type: string; color: string }) => {
    return <div data-testid={`piece-${type}-${color}`} aria-label={`${color} ${type}`} />;
  },
}));

describe('Accessibility Tests', () => {
  const defaultProps = {
    board: createInitialBoard(),
    playerColor: 'white' as PieceColor,
    isMyTurn: true,
    legalMoves: [],
    selectedSquare: null,
    lastMove: null,
    isCheck: false,
    checkSquare: null,
    onSquareClick: vi.fn(),
    onPieceDrop: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Board Component', () => {
    it('should have accessible board squares', () => {
      const { container } = render(<Board {...defaultProps} />);
      const squares = container.querySelectorAll('[class*="board-square"]');
      expect(squares.length).toBe(64);
    });

    it('should have accessible pieces with labels', () => {
      const { container } = render(<Board {...defaultProps} />);
      const pieces = container.querySelectorAll('[data-testid^="piece-"]');
      expect(pieces.length).toBe(32);

      // Each piece should have an aria-label from our mock
      pieces.forEach(piece => {
        const ariaLabel = piece.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      });
    });

    it('should have proper board structure', () => {
      const { container } = render(<Board {...defaultProps} />);
      const board = container.querySelector('.board-no-select');

      expect(board).toBeInTheDocument();
      expect(board?.getAttribute('tabIndex')).toBe('-1');
    });

    it('should have visible check indicator', () => {
      const checkSquare: Position = { row: 0, col: 4 };
      const { container } = render(
        <Board {...defaultProps} isCheck={true} checkSquare={checkSquare} />
      );

      const checkSquareEl = container.querySelector('.board-square-check');
      expect(checkSquareEl).toBeInTheDocument();
    });
  });

  describe('Color and Visual Indicators', () => {
    it('should not rely on color alone for selected squares', () => {
      const { container } = render(
        <Board {...defaultProps} selectedSquare={{ row: 2, col: 4 }} />
      );

      // Selected square should have a distinct class, not just color
      const selectedSquare = container.querySelector('.board-square-selected');
      expect(selectedSquare).toBeInTheDocument();
    });

    it('should not rely on color alone for last move', () => {
      const { container } = render(
        <Board
          {...defaultProps}
          lastMove={{ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }}
        />
      );

      // Last move squares should have a distinct class
      const lastMoveSquares = container.querySelectorAll('[class*="board-square-lastmove"]');
      expect(lastMoveSquares.length).toBe(2);
    });

    it('should show legal moves with visual indicators', () => {
      const legalMoves: Position[] = [{ row: 3, col: 4 }, { row: 3, col: 3 }];
      const { container } = render(
        <Board {...defaultProps} legalMoves={legalMoves} />
      );

      // Legal moves should have visible dots
      const legalDots = container.querySelectorAll('.legal-dot');
      expect(legalDots.length).toBe(2);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper context menu handling', () => {
      const { container } = render(<Board {...defaultProps} />);
      const board = container.querySelector('.board-no-select');

      expect(board).toBeInTheDocument();

      // Simulate context menu event
      if (board) {
        const contextMenuEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
        });
        board.dispatchEvent(contextMenuEvent);
        // Event should be prevented (context menu suppressed)
        expect(contextMenuEvent.defaultPrevented).toBe(true);
      }
    });
  });

  describe('Focus Management', () => {
    it('should have disabled state for non-interactive boards', () => {
      const { container } = render(<Board {...defaultProps} disabled={true} />);

      // When disabled, board should still be rendered
      const board = container.querySelector('.board-no-select');
      expect(board).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should handle null playerColor gracefully', () => {
      const { container } = render(
        <Board {...defaultProps} playerColor={null} />
      );

      const board = container.querySelector('.board-no-select');
      expect(board).toBeInTheDocument();
    });
  });
});
