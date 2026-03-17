import { useState, useCallback, useRef } from 'react';
import type { Board as BoardType, Position, PieceColor, Move } from '@shared/types';
import PieceSVG from './PieceSVG';

interface BoardProps {
  board: BoardType;
  playerColor: PieceColor | null;
  isMyTurn: boolean;
  legalMoves: Position[];
  selectedSquare: Position | null;
  lastMove: Move | null;
  isCheck: boolean;
  checkSquare: Position | null;
  onSquareClick: (pos: Position) => void;
  onPieceDrop: (from: Position, to: Position) => void;
  disabled?: boolean;
}

export default function Board({
  board,
  playerColor,
  isMyTurn,
  legalMoves,
  selectedSquare,
  lastMove,
  isCheck,
  checkSquare,
  onSquareClick,
  onPieceDrop,
  disabled,
}: BoardProps) {
  const [dragPiece, setDragPiece] = useState<Position | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const isFlipped = playerColor === 'black';

  const getDisplayRow = (row: number) => isFlipped ? row : 7 - row;
  const getDisplayCol = (col: number) => isFlipped ? 7 - col : col;
  const getBoardRow = (displayRow: number) => isFlipped ? displayRow : 7 - displayRow;
  const getBoardCol = (displayCol: number) => isFlipped ? 7 - displayCol : displayCol;

  const isLightSquare = (row: number, col: number) => (row + col) % 2 === 0;

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

  const handleMouseDown = (e: React.MouseEvent, row: number, col: number) => {
    if (disabled) return;
    const piece = board[row][col];
    if (piece && piece.color === playerColor && isMyTurn) {
      setDragPiece({ row, col });
      onSquareClick({ row, col });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragPiece || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    setDragPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
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
      }
    }

    setDragPiece(null);
    setDragPos(null);
  };

  const handleClick = (row: number, col: number) => {
    if (disabled) return;
    onSquareClick({ row, col });
  };

  const handleTouchStart = (e: React.TouchEvent, row: number, col: number) => {
    if (disabled) return;
    const piece = board[row][col];
    if (piece && piece.color === playerColor && isMyTurn) {
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

  const getSquareClass = (boardRow: number, boardCol: number) => {
    const light = isLightSquare(boardRow, boardCol);
    let cls = light ? 'board-square-light' : 'board-square-dark';

    if (isSelected(boardRow, boardCol)) {
      cls = 'board-square-selected';
    } else if (isLastMove(boardRow, boardCol)) {
      cls = light ? 'board-square-lastmove-light' : 'board-square-lastmove-dark';
    }

    if (isCheckSquare(boardRow, boardCol)) {
      cls += ' board-square-check';
    }

    return cls;
  };

  const squareSize = '12.5%';

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

        squares.push(
          <div
            key={`${displayRow}-${displayCol}`}
            className={`absolute ${getSquareClass(boardRow, boardCol)} select-none`}
            style={{
              left: `${displayCol * 12.5}%`,
              top: `${displayRow * 12.5}%`,
              width: squareSize,
              height: squareSize,
            }}
            onMouseDown={(e) => handleMouseDown(e, boardRow, boardCol)}
            onTouchStart={(e) => handleTouchStart(e, boardRow, boardCol)}
            onClick={() => handleClick(boardRow, boardCol)}
          >
            {/* Coordinate labels */}
            {displayCol === 0 && (
              <span className="absolute top-0.5 left-1 text-[10px] font-bold opacity-50 pointer-events-none select-none"
                style={{ color: isLightSquare(boardRow, boardCol) ? '#b58863' : '#e8c690' }}>
                {boardRow + 1}
              </span>
            )}
            {displayRow === 7 && (
              <span className="absolute bottom-0.5 right-1 text-[10px] font-bold opacity-50 pointer-events-none select-none"
                style={{ color: isLightSquare(boardRow, boardCol) ? '#b58863' : '#e8c690' }}>
                {String.fromCharCode(97 + boardCol)}
              </span>
            )}

            {/* Legal move indicator */}
            {legal && !hasCapture && <div className="legal-dot" />}
            {legal && hasCapture && <div className="legal-capture" />}

            {/* Piece */}
            {piece && !isDragging && (
              <div className="absolute inset-[6%] flex items-center justify-center piece">
                <PieceSVG type={piece.type} color={piece.color} className="w-full h-full" />
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
      className="relative aspect-square w-full select-none rounded-lg shadow-xl overflow-hidden board-no-select"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {renderSquares()}

      {/* Dragging piece overlay */}
      {dragPiece && dragPos && board[dragPiece.row][dragPiece.col] && (
        <div
          className="absolute pointer-events-none piece-dragging"
          style={{
            left: `calc(${dragPos.x}px - 6.25%)`,
            top: `calc(${dragPos.y}px - 6.25%)`,
            width: '12.5%',
            height: '12.5%',
          }}
        >
          <div className="absolute inset-[6%]">
            <PieceSVG
              type={board[dragPiece.row][dragPiece.col]!.type}
              color={board[dragPiece.row][dragPiece.col]!.color}
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
