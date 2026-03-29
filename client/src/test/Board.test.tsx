import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import type { Board as BoardType, Position, PieceColor, Move } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import Board, { type Arrow } from '../components/Board';

vi.mock('../components/PieceSVG', () => ({
  default: ({ type, color }: { type: string; color: string }) => {
    return <div data-testid={`piece-${type}-${color}`} />;
  },
}));

vi.mock('../lib/pieceStyle', async () => {
  const actual = await vi.importActual<typeof import('../lib/pieceStyle')>('../lib/pieceStyle');

  return {
    ...actual,
    useBoardAppearance: () => ({
      boardTheme: {
        lightBackground: '#f0d8b6',
        darkBackground: '#b8895c',
        lightCoordinate: '#8a5d34',
        darkCoordinate: '#f6e6c8',
        frameBackground: 'linear-gradient(180deg, rgba(120,85,45,0.4), rgba(48,33,21,0.56))',
      },
    }),
  };
});

const createProps = (overrides: any = {}): any => ({
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
  ...overrides,
});

describe('Board Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      x: 0,
      y: 0,
      width: 800,
      height: 800,
      top: 0,
      right: 800,
      bottom: 800,
      left: 0,
      toJSON: () => ({}),
    }));
  });

  describe('Rendering', () => {
    it('should render 64 squares', () => {
      const { container } = render(<Board {...createProps()} />);
      const squares = container.querySelectorAll('[class*="board-square"]');
      expect(squares.length).toBe(64);
    });

    it('should render pieces on the board', () => {
      const { container } = render(<Board {...createProps()} />);
      const pieces = container.querySelectorAll('[data-testid^="piece-"]');
      expect(pieces.length).toBe(32);
    });

    it('should render white king', () => {
      const { container } = render(<Board {...createProps()} />);
      const whiteKing = container.querySelector('[data-testid="piece-K-white"]');
      expect(whiteKing).toBeInTheDocument();
    });

    it('should render black king', () => {
      const { container } = render(<Board {...createProps()} />);
      const blackKing = container.querySelector('[data-testid="piece-K-black"]');
      expect(blackKing).toBeInTheDocument();
    });
  });

  describe('Square Highlighting', () => {
    it('should highlight selected square', () => {
      const selectedSquare: Position = { row: 2, col: 4 };
      const { container } = render(
        <Board {...createProps({ selectedSquare })} />
      );
      const selectedSquareEl = container.querySelector('.board-square-selected');
      expect(selectedSquareEl).toBeInTheDocument();
    });

    it('should highlight last move squares', () => {
      const lastMove: Move = {
        from: { row: 2, col: 4 },
        to: { row: 3, col: 4 },
      };
      const { container } = render(
        <Board {...createProps({ lastMove })} />
      );
      const lastMoveSquares = container.querySelectorAll('[class*="board-square-lastmove"]');
      expect(lastMoveSquares.length).toBe(2);
    });

    it('should highlight check square', () => {
      const checkSquare: Position = { row: 0, col: 4 };
      const { container } = render(
        <Board {...createProps({ isCheck: true, checkSquare })} />
      );
      const checkSquareEl = container.querySelector('.board-square-check');
      expect(checkSquareEl).toBeInTheDocument();
    });

    it('should show legal move dots', () => {
      const legalMoves: Position[] = [{ row: 3, col: 4 }, { row: 3, col: 3 }];
      const { container } = render(<Board {...createProps({ legalMoves })} />);
      const legalDots = container.querySelectorAll('.legal-dot');
      expect(legalDots.length).toBe(legalMoves.length);
    });

    it('should highlight premove squares', () => {
      const premove = { from: { row: 2, col: 4 }, to: { row: 3, col: 4 } };
      const { container } = render(<Board {...createProps({ premove })} />);
      const premoveSquares = container.querySelectorAll('[class*="board-square-premove"]');
      expect(premoveSquares.length).toBe(2);
    });
  });

  describe('Arrows', () => {
    it('should render arrows', () => {
      const arrows: Arrow[] = [
        { from: { row: 2, col: 4 }, to: { row: 4, col: 4 }, color: '#15781B' },
      ];
      const { container } = render(<Board {...createProps({ arrows })} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const lines = svg?.querySelectorAll('line');
      expect(lines?.length).toBe(1);
    });

    it('should render multiple arrows', () => {
      const arrows: Arrow[] = [
        { from: { row: 2, col: 4 }, to: { row: 4, col: 4 }, color: '#15781B' },
        { from: { row: 2, col: 3 }, to: { row: 4, col: 2 }, color: '#e84040' },
      ];
      const { container } = render(<Board {...createProps({ arrows })} />);
      const lines = container.querySelectorAll('svg line');
      expect(lines.length).toBe(2);
    });

    it('should not render svg when no arrows', () => {
      const { container } = render(<Board {...createProps({ arrows: [] })} />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });

    it('should create an arrow on right-drag when using internal arrows', () => {
      const { getByTestId, container } = render(<Board {...createProps()} />);

      fireEvent.mouseDown(getByTestId('board-square-2-4'), { button: 2, clientX: 450, clientY: 550 });
      fireEvent.mouseMove(getByTestId('board'), { clientX: 450, clientY: 450 });
      fireEvent.mouseUp(getByTestId('board'), { button: 2, clientX: 450, clientY: 450, shiftKey: true });

      const arrowLines = container.querySelectorAll('svg line');
      expect(arrowLines.length).toBe(1);
      expect(arrowLines[0]).toHaveAttribute('stroke', '#e84040');
    });

    it('should clear external arrows on left mouse down before normal interaction', () => {
      const onArrowsChange = vi.fn();
      const arrows: Arrow[] = [
        { from: { row: 2, col: 4 }, to: { row: 3, col: 4 }, color: '#15781B' },
      ];

      const { getByTestId } = render(
        <Board {...createProps({ arrows, onArrowsChange })} />
      );

      fireEvent.mouseDown(getByTestId('board-square-2-4'), { button: 0, clientX: 450, clientY: 550 });

      expect(onArrowsChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Board Orientation', () => {
    it('should render board for black player', () => {
      const { container } = render(<Board {...createProps({ playerColor: 'black' })} />);
      const pieces = container.querySelectorAll('[data-testid^="piece-"]');
      expect(pieces.length).toBe(32);
    });
  });

  describe('Interactions', () => {
    it('should call onSquareClick when square is clicked', () => {
      const onSquareClick = vi.fn();
      const { container } = render(<Board {...createProps({ onSquareClick })} />);
      const squares = container.querySelectorAll('[class*="board-square"]');
      fireEvent.click(squares[0]);
      expect(onSquareClick).toHaveBeenCalled();
    });

    it('should prevent context menu', () => {
      const { container } = render(<Board {...createProps()} />);
      const board = container.firstChild as HTMLElement;
      const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      board.dispatchEvent(contextMenuEvent);
      expect(contextMenuEvent.defaultPrevented).toBe(true);
    });

    it('should call onPieceDrop when dragging a piece to another square', () => {
      const onPieceDrop = vi.fn();
      const { getByTestId } = render(<Board {...createProps({ onPieceDrop })} />);

      fireEvent.mouseDown(getByTestId('board-square-2-4'), { button: 0, clientX: 450, clientY: 550 });
      fireEvent.mouseMove(getByTestId('board'), { clientX: 450, clientY: 450 });
      fireEvent.mouseUp(getByTestId('board'), { button: 0, clientX: 450, clientY: 450 });

      expect(onPieceDrop).toHaveBeenCalledWith({ row: 2, col: 4 }, { row: 3, col: 4 });
    });

    it('should call onPieceDrop when a touch drag ends on a different square', () => {
      const onPieceDrop = vi.fn();
      const { getByTestId } = render(<Board {...createProps({ onPieceDrop })} />);
      const sourceSquare = getByTestId('board-square-2-4');
      const board = getByTestId('board');

      fireEvent.touchStart(sourceSquare, {
        touches: [{ clientX: 450, clientY: 550 }],
      });
      fireEvent.touchMove(board, {
        touches: [{ clientX: 450, clientY: 450 }],
      });
      fireEvent.touchEnd(board, {
        changedTouches: [{ clientX: 450, clientY: 450 }],
      });

      expect(onPieceDrop).toHaveBeenCalledWith({ row: 2, col: 4 }, { row: 3, col: 4 });
    });

    it('should allow dragging the side to move even when board orientation stays white', () => {
      const onPieceDrop = vi.fn();
      const { getByTestId } = render(
        <Board
          {...createProps({
            playerColor: 'white',
            draggableColor: 'black',
            onPieceDrop,
          })}
        />
      );

      fireEvent.mouseDown(getByTestId('board-square-5-4'), { button: 0, clientX: 450, clientY: 250 });
      fireEvent.mouseMove(getByTestId('board'), { clientX: 450, clientY: 350 });
      fireEvent.mouseUp(getByTestId('board'), { button: 0, clientX: 450, clientY: 350 });

      expect(onPieceDrop).toHaveBeenCalledWith({ row: 5, col: 4 }, { row: 4, col: 4 });
    });

    it('should ignore click and touch interactions when disabled', () => {
      const onSquareClick = vi.fn();
      const onPieceDrop = vi.fn();
      const { getByTestId } = render(
        <Board {...createProps({ disabled: true, onSquareClick, onPieceDrop })} />
      );

      fireEvent.click(getByTestId('board-square-2-4'));
      fireEvent.touchStart(getByTestId('board-square-2-4'), {
        touches: [{ clientX: 450, clientY: 550 }],
      });
      fireEvent.touchEnd(getByTestId('board'), {
        changedTouches: [{ clientX: 450, clientY: 450 }],
      });

      expect(onSquareClick).not.toHaveBeenCalled();
      expect(onPieceDrop).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null playerColor', () => {
      const { container } = render(<Board {...createProps({ playerColor: null })} />);
      const board = container.firstChild as HTMLElement;
      expect(board).toBeInTheDocument();
    });

    it('should render empty board', () => {
      const emptyBoard: BoardType = Array(8).fill(null).map(() => Array(8).fill(null));
      const { container } = render(<Board {...createProps({ board: emptyBoard })} />);
      const pieces = container.querySelectorAll('[data-testid^="piece-"]');
      expect(pieces.length).toBe(0);
    });

    it('should render square highlights and annotations', () => {
      const { getByTestId, getByText } = render(
        <Board
          {...createProps({
            squareHighlights: [{ pos: { row: 2, col: 4 }, color: 'rgb(255, 0, 0)' }],
            squareAnnotations: [{ pos: { row: 2, col: 4 }, icon: '!', bgColor: 'gold' }],
          })}
        />
      );

      expect(getByTestId('board-square-2-4')).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
      expect(getByText('!')).toBeInTheDocument();
    });
  });
});
