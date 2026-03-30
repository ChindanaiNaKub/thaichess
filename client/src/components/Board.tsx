import { useState, useCallback, useRef, memo } from 'react';
import type { Board as BoardType, Position, PieceColor, Move } from '@shared/types';
import { useBoardAppearance } from '../lib/pieceStyle';
import PieceSVG from './PieceSVG';

export interface Arrow {
  from: Position;
  to: Position;
  color: string;
}

export interface SquareHighlight {
  pos: Position;
  color: string;
}

export interface SquareAnnotation {
  pos: Position;
  icon: string;
  bgColor: string;
}

interface BoardProps {
  board: BoardType;
  playerColor: PieceColor | null;
  draggableColor?: PieceColor | null;
  isMyTurn: boolean;
  legalMoves: Position[];
  selectedSquare: Position | null;
  lastMove: Move | null;
  isCheck: boolean;
  checkSquare: Position | null;
  onSquareClick: (pos: Position) => void;
  onPieceDrop: (from: Position, to: Position) => void;
  disabled?: boolean;
  premove?: { from: Position; to: Position } | null;
  arrows?: Arrow[];
  onArrowsChange?: (arrows: Arrow[]) => void;
  squareHighlights?: SquareHighlight[];
  squareAnnotations?: SquareAnnotation[];
  allowAnyPieceDrag?: boolean;
  className?: string;
}

export default memo(function Board({
  board,
  playerColor,
  draggableColor: draggableColorProp,
  isMyTurn,
  legalMoves,
  selectedSquare,
  lastMove,
  isCheck,
  checkSquare,
  onSquareClick,
  onPieceDrop,
  disabled,
  premove,
  arrows: externalArrows,
  onArrowsChange,
  squareHighlights,
  squareAnnotations,
  allowAnyPieceDrag = false,
  className,
}: BoardProps) {
  const { boardTheme } = useBoardAppearance();
  const [dragPiece, setDragPiece] = useState<Position | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [internalArrows, setInternalArrows] = useState<Arrow[]>([]);
  const [rightClickStart, setRightClickStart] = useState<Position | null>(null);
  const [rightDragPos, setRightDragPos] = useState<{ x: number; y: number } | null>(null);
  const [pieceAnimations, setPieceAnimations] = useState<Map<string, 'lift' | 'settle'>>(new Map());
  const boardRef = useRef<HTMLDivElement>(null);

  const arrows = externalArrows ?? internalArrows;
  const draggableColor = draggableColorProp ?? playerColor;
  const setArrows = useCallback((newArrows: Arrow[]) => {
    if (onArrowsChange) {
      onArrowsChange(newArrows);
    } else {
      setInternalArrows(newArrows);
    }
  }, [onArrowsChange]);

  const isFlipped = playerColor === 'black';

  const getBoardRow = (displayRow: number) => isFlipped ? displayRow : 7 - displayRow;
  const getBoardCol = (displayCol: number) => isFlipped ? 7 - displayCol : displayCol;
  const getDisplayRow = (row: number) => isFlipped ? row : 7 - row;
  const getDisplayCol = (col: number) => isFlipped ? 7 - col : col;

  const isLegalMove = useCallback((row: number, col: number) => {
    return legalMoves.some(m => m.row === row && m.col === col);
  }, [legalMoves]);

  const isLastMove = useCallback((row: number, col: number) => {
    if (!lastMove) return false;
    return (lastMove.from.row === row && lastMove.from.col === col) ||
           (lastMove.to.row === row && lastMove.to.col === col);
  }, [lastMove]);

  const isSelected = useCallback((row: number, col: number) => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  }, [selectedSquare]);

  const isCheckSquare = useCallback((row: number, col: number) => {
    return isCheck && checkSquare?.row === row && checkSquare?.col === col;
  }, [isCheck, checkSquare]);

  const isPremoveSquare = useCallback((row: number, col: number) => {
    if (!premove) return false;
    return (premove.from.row === row && premove.from.col === col) ||
           (premove.to.row === row && premove.to.col === col);
  }, [premove]);

  const getSquareHighlight = useCallback((row: number, col: number): string | null => {
    if (!squareHighlights) return null;
    const hl = squareHighlights.find(h => h.pos.row === row && h.pos.col === col);
    return hl ? hl.color : null;
  }, [squareHighlights]);

  const getSquareAnnotation = useCallback((row: number, col: number): SquareAnnotation | null => {
    if (!squareAnnotations) return null;
    return squareAnnotations.find(a => a.pos.row === row && a.pos.col === col) || null;
  }, [squareAnnotations]);

  const getSquareFromEvent = (clientX: number, clientY: number): Position | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    const displayCol = Math.floor((clientX - rect.left) / squareSize);
    const displayRow = Math.floor((clientY - rect.top) / squareSize);
    if (displayRow < 0 || displayRow >= 8 || displayCol < 0 || displayCol >= 8) return null;
    return { row: getBoardRow(displayRow), col: getBoardCol(displayCol) };
  };

  const handleMouseDown = (e: React.MouseEvent, row: number, col: number) => {
    if (e.button === 2) {
      setRightClickStart({ row, col });
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setRightDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      return;
    }

    if (e.button !== 0) return;

    if (arrows.length > 0) {
      setArrows([]);
    }

    if (disabled) return;
    const piece = board[row][col];
    if (piece && (allowAnyPieceDrag || piece.color === draggableColor)) {
      setDragPiece({ row, col });
      setPieceAnimations(prev => new Map(prev).set(`${row}-${col}`, 'lift'));
      setTimeout(() => setPieceAnimations(prev => {
        const newMap = new Map(prev);
        newMap.delete(`${row}-${col}`);
        return newMap;
      }), 150);
      onSquareClick({ row, col });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (rightClickStart && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setRightDragPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (!dragPiece || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    setDragPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2 && rightClickStart) {
      const target = getSquareFromEvent(e.clientX, e.clientY);
      if (target) {
        if (target.row === rightClickStart.row && target.col === rightClickStart.col) {
          setArrows([]);
        } else {
          const arrowColor = e.shiftKey ? '#e84040' : '#15781B';
          const newArrow: Arrow = { from: rightClickStart, to: target, color: arrowColor };
          const exists = arrows.findIndex(
            a => a.from.row === newArrow.from.row && a.from.col === newArrow.from.col &&
                 a.to.row === newArrow.to.row && a.to.col === newArrow.to.col
          );
          if (exists >= 0) {
            setArrows(arrows.filter((_, i) => i !== exists));
          } else {
            setArrows([...arrows, newArrow]);
          }
        }
      }
      setRightClickStart(null);
      setRightDragPos(null);
      return;
    }

    if (!dragPiece || !boardRef.current) {
      setDragPiece(null);
      setDragPos(null);
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    const displayCol = Math.floor((e.clientX - rect.left) / squareSize);
    const displayRow = Math.floor((e.clientY - rect.top) / squareSize);

    if (displayRow >= 0 && displayRow < 8 && displayCol >= 0 && displayCol < 8) {
      const targetRow = getBoardRow(displayRow);
      const targetCol = getBoardCol(displayCol);

      if (targetRow !== dragPiece.row || targetCol !== dragPiece.col) {
        onPieceDrop(dragPiece, { row: targetRow, col: targetCol });
        setPieceAnimations(prev => new Map(prev).set(`${targetRow}-${targetCol}`, 'settle'));
        setTimeout(() => setPieceAnimations(prev => {
          const newMap = new Map(prev);
          newMap.delete(`${targetRow}-${targetCol}`);
          return newMap;
        }), 200);
      }
    }

    setDragPiece(null);
    setDragPos(null);
  };

  const handleClick = (row: number, col: number) => {
    if (disabled) return;
    onSquareClick({ row, col });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    if (disabled) return;
    const piece = board[row][col];
    if (piece && (allowAnyPieceDrag || piece.color === draggableColor)) {
      e.preventDefault();
      setDragPiece({ row, col });
      onSquareClick({ row, col });
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        setDragPos({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragPiece || !boardRef.current) return;
    e.preventDefault();
    const rect = boardRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setDragPos({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragPiece || !boardRef.current) {
      setDragPiece(null);
      setDragPos(null);
      return;
    }

    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    const touch = e.changedTouches[0];
    const displayCol = Math.floor((touch.clientX - rect.left) / squareSize);
    const displayRow = Math.floor((touch.clientY - rect.top) / squareSize);

    if (displayRow >= 0 && displayRow < 8 && displayCol >= 0 && displayCol < 8) {
      const targetRow = getBoardRow(displayRow);
      const targetCol = getBoardCol(displayCol);
      if (targetRow !== dragPiece.row || targetCol !== dragPiece.col) {
        onPieceDrop(dragPiece, { row: targetRow, col: targetCol });
      }
    }

    setDragPiece(null);
    setDragPos(null);
  };

  const getSquareStyle = (boardRow: number, boardCol: number): React.CSSProperties | undefined => {
    const hl = getSquareHighlight(boardRow, boardCol);
    if (hl) return { backgroundColor: hl };
    return undefined;
  };

  const getSquareClass = (boardRow: number, boardCol: number) => {
    const classes = ['board-square', 'board-square-neutral'];

    if (getSquareHighlight(boardRow, boardCol)) {
      return 'board-square';
    } else if (isPremoveSquare(boardRow, boardCol)) {
      classes.push('board-square-premove');
    } else if (isSelected(boardRow, boardCol)) {
      classes.push('board-square-selected');
    } else if (isLastMove(boardRow, boardCol)) {
      classes.push('board-square-lastmove');
    }

    if (isCheckSquare(boardRow, boardCol)) {
      classes.push('board-square-check');
    }

    return classes.join(' ');
  };

  const squareSize = '12.5%';
  const boardSurfaceStyle = {
    '--board-surface-background': boardTheme.surfaceBackground,
    '--board-grid-line': boardTheme.gridColor,
    '--board-coordinate': boardTheme.coordinateColor,
    '--board-frame-background': boardTheme.frameBackground,
    '--board-hover-background': boardTheme.hoverBackground,
    '--board-selected-background': boardTheme.selectedBackground,
    '--board-selected-ring': boardTheme.selectedRing,
    '--board-lastmove-background': boardTheme.lastMoveBackground,
    '--board-premove-background': boardTheme.premoveBackground,
    '--board-premove-ring': boardTheme.premoveRing,
    '--board-legal-dot': boardTheme.legalDot,
    '--board-legal-capture': boardTheme.legalCapture,
    '--board-check-overlay': boardTheme.checkOverlay,
  } as React.CSSProperties;

  const renderArrowSvg = () => {
    const allArrows = [...arrows];

    if (rightClickStart && rightDragPos && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const sqSize = rect.width / 8;
      const displayCol = Math.floor(rightDragPos.x / sqSize);
      const displayRow = Math.floor(rightDragPos.y / sqSize);
      if (displayRow >= 0 && displayRow < 8 && displayCol >= 0 && displayCol < 8) {
        const target = { row: getBoardRow(displayRow), col: getBoardCol(displayCol) };
        if (target.row !== rightClickStart.row || target.col !== rightClickStart.col) {
          allArrows.push({ from: rightClickStart, to: target, color: '#15781B80' });
        }
      }
    }

    if (allArrows.length === 0) return null;

    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 800"
        style={{ zIndex: 50 }}
      >
        <defs>
          {allArrows.map((arrow, i) => (
            <marker
              key={`head-${i}`}
              id={`arrowhead-${i}`}
              markerWidth="4"
              markerHeight="4"
              refX="2.5"
              refY="2"
              orient="auto"
            >
              <path d="M0,0 L4,2 L0,4 Z" fill={arrow.color} fillOpacity="0.8" />
            </marker>
          ))}
        </defs>
        {allArrows.map((arrow, i) => {
          const fromDR = getDisplayRow(arrow.from.row);
          const fromDC = getDisplayCol(arrow.from.col);
          const toDR = getDisplayRow(arrow.to.row);
          const toDC = getDisplayCol(arrow.to.col);

          const x1 = fromDC * 100 + 50;
          const y1 = fromDR * 100 + 50;
          const x2 = toDC * 100 + 50;
          const y2 = toDR * 100 + 50;

          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const shortenBy = 20;
          const ex = x2 - (dx / dist) * shortenBy;
          const ey = y2 - (dy / dist) * shortenBy;

          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={ex}
              y2={ey}
              stroke={arrow.color}
              strokeWidth="16"
              strokeOpacity="0.8"
              strokeLinecap="round"
              markerEnd={`url(#arrowhead-${i})`}
            />
          );
        })}
      </svg>
    );
  };

  const renderSquares = () => {
    const squares = [];
    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        const boardRow = getBoardRow(displayRow);
        const boardCol = getBoardCol(displayCol);
        const piece = board[boardRow][boardCol];
        const isDragging = dragPiece?.row === boardRow && dragPiece?.col === boardCol;
        const legal = isLegalMove(boardRow, boardCol);
        const hasCapture = legal && piece !== null;

        const annotation = getSquareAnnotation(boardRow, boardCol);
        const customStyle = getSquareStyle(boardRow, boardCol);

        squares.push(
          <div
            key={`${displayRow}-${displayCol}`}
            className={`absolute ${getSquareClass(boardRow, boardCol)} select-none`}
            data-testid={`board-square-${boardRow}-${boardCol}`}
            style={{
              left: `${displayCol * 12.5}%`,
              top: `${displayRow * 12.5}%`,
              width: squareSize,
              height: squareSize,
              ...customStyle,
            }}
            onMouseDown={(e) => handleMouseDown(e, boardRow, boardCol)}
            onTouchStart={(e) => handleTouchStart(e, boardRow, boardCol)}
            onClick={() => handleClick(boardRow, boardCol)}
          >
            {displayCol === 0 && (
              <span className="absolute top-0.5 left-1 text-[10px] font-bold opacity-50 pointer-events-none select-none"
                style={{ color: 'var(--board-coordinate)' }}>
                {boardRow + 1}
              </span>
            )}
            {displayRow === 7 && (
              <span className="absolute bottom-0.5 right-1 text-[10px] font-bold opacity-50 pointer-events-none select-none"
                style={{ color: 'var(--board-coordinate)' }}>
                {String.fromCharCode(97 + boardCol)}
              </span>
            )}

            {legal && !hasCapture && <div className="legal-dot" />}
            {legal && hasCapture && <div className="legal-capture" />}

            {piece && !isDragging && (
              <div
                className={`absolute inset-[4.5%] flex items-center justify-center piece ${isSelected(boardRow, boardCol) ? 'piece-selected' : ''} ${pieceAnimations.get(`${boardRow}-${boardCol}`) ? `piece-${pieceAnimations.get(`${boardRow}-${boardCol}`)}ing` : ''}`}
                data-testid={`board-piece-${boardRow}-${boardCol}`}
              >
                <PieceSVG type={piece.type} color={piece.color} className="w-full h-full" />
              </div>
            )}

            {annotation && (
              <div
                className="absolute pointer-events-none flex items-center justify-center rounded-full shadow-lg border-2 border-white/80"
                style={{
                  top: '-10%',
                  right: '-10%',
                  width: '36%',
                  height: '36%',
                  backgroundColor: annotation.bgColor,
                  zIndex: 60,
                  fontSize: '60%',
                  lineHeight: 1,
                }}
              >
                {annotation.icon}
              </div>
            )}
          </div>
        );
      }
    }
    return squares;
  };

  return (
    <div
      ref={boardRef}
      className={`relative aspect-square w-full select-none overflow-hidden rounded-[1.1rem] shadow-xl board-no-select transition-[box-shadow,transform] duration-200 ${className ?? ''}`}
      data-testid="board"
      style={boardSurfaceStyle}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={(e) => {
        handleMouseUp(e);
        setRightClickStart(null);
        setRightDragPos(null);
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
      tabIndex={-1}
    >
      {renderSquares()}

      {renderArrowSvg()}

      {dragPiece && dragPos && (() => {
        const draggedPiece = board[dragPiece.row][dragPiece.col];
        return draggedPiece ? (
          <div
            className="absolute pointer-events-none piece-dragging"
            style={{
              left: `calc(${dragPos.x}px - 6.25%)`,
              top: `calc(${dragPos.y}px - 6.25%)`,
              width: '12.5%',
              height: '12.5%',
            }}
          >
            <div className="absolute inset-[4.5%]">
              <PieceSVG
                type={draggedPiece.type}
                color={draggedPiece.color}
                className="w-full h-full"
              />
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
});
