import { Board, Piece, PieceColor, PieceType, Position, Move, GameState } from './types';

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // White pieces (rows 0-2)
  const whiteBackRank: PieceType[] = ['R', 'N', 'S', 'M', 'K', 'S', 'N', 'R'];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: whiteBackRank[col], color: 'white' };
    board[2][col] = { type: 'P', color: 'white' };
  }

  // Black pieces (rows 5-7)
  const blackBackRank: PieceType[] = ['R', 'N', 'S', 'K', 'M', 'S', 'N', 'R'];
  for (let col = 0; col < 8; col++) {
    board[7][col] = { type: blackBackRank[col], color: 'black' };
    board[5][col] = { type: 'P', color: 'black' };
  }

  return board;
}

export function createInitialGameState(whiteTime: number, blackTime: number): GameState {
  return {
    board: createInitialBoard(),
    turn: 'white',
    moveHistory: [],
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isDraw: false,
    gameOver: false,
    winner: null,
    whiteTime,
    blackTime,
    lastMoveTime: Date.now(),
    moveCount: 0,
  };
}

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function getForwardDirection(color: PieceColor): number {
  return color === 'white' ? 1 : -1;
}

function getPromotionRank(color: PieceColor): number {
  return color === 'white' ? 5 : 2;
}

function findKing(board: Board, color: PieceColor): Position | null {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'K' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

function getRawMoves(board: Board, pos: Position): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const moves: Position[] = [];
  const { row, col } = pos;
  const forward = getForwardDirection(piece.color);

  switch (piece.type) {
    case 'K': {
      // King: 1 square in any direction
      const kingDirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      for (const [dr, dc] of kingDirs) {
        const nr = row + dr, nc = col + dc;
        if (isInBounds(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color !== piece.color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }

    case 'M':
    case 'PM': {
      // Met / Promoted Pawn: 1 square diagonally
      const metDirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
      for (const [dr, dc] of metDirs) {
        const nr = row + dr, nc = col + dc;
        if (isInBounds(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color !== piece.color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }

    case 'S': {
      // Khon (Silver/Bishop): 1 square diagonally OR 1 square forward
      const khonDirs = [[-1,-1],[-1,1],[1,-1],[1,1],[forward, 0]];
      for (const [dr, dc] of khonDirs) {
        const nr = row + dr, nc = col + dc;
        if (isInBounds(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color !== piece.color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }

    case 'R': {
      // Rua (Rook): slides horizontally/vertically
      const rookDirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (const [dr, dc] of rookDirs) {
        for (let dist = 1; dist < 8; dist++) {
          const nr = row + dr * dist, nc = col + dc * dist;
          if (!isInBounds(nr, nc)) break;
          const target = board[nr][nc];
          if (!target) {
            moves.push({ row: nr, col: nc });
          } else {
            if (target.color !== piece.color) {
              moves.push({ row: nr, col: nc });
            }
            break;
          }
        }
      }
      break;
    }

    case 'N': {
      // Ma (Knight): L-shape
      const knightMoves = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (const [dr, dc] of knightMoves) {
        const nr = row + dr, nc = col + dc;
        if (isInBounds(nr, nc)) {
          const target = board[nr][nc];
          if (!target || target.color !== piece.color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }

    case 'P': {
      // Bia (Pawn): 1 forward, captures 1 diagonally forward. No double step.
      const nr = row + forward;
      if (isInBounds(nr, col) && !board[nr][col]) {
        moves.push({ row: nr, col });
      }
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (isInBounds(nr, nc)) {
          const target = board[nr][nc];
          if (target && target.color !== piece.color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
      break;
    }
  }

  return moves;
}

function isSquareAttacked(board: Board, pos: Position, byColor: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const attacks = getRawMoves(board, { row, col });
        if (attacks.some(m => m.row === pos.row && m.col === pos.col)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponent = color === 'white' ? 'black' : 'white';
  return isSquareAttacked(board, kingPos, opponent);
}

export function getLegalMoves(board: Board, pos: Position): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];

  const rawMoves = getRawMoves(board, pos);
  const legalMoves: Position[] = [];

  for (const target of rawMoves) {
    const testBoard = cloneBoard(board);
    testBoard[target.row][target.col] = testBoard[pos.row][pos.col];
    testBoard[pos.row][pos.col] = null;

    // Handle promotion for testing
    const movedPiece = testBoard[target.row][target.col]!;
    if (movedPiece.type === 'P' && target.row === getPromotionRank(movedPiece.color)) {
      testBoard[target.row][target.col] = { type: 'PM', color: movedPiece.color };
    }

    if (!isInCheck(testBoard, piece.color)) {
      legalMoves.push(target);
    }
  }

  return legalMoves;
}

export function hasAnyLegalMoves(board: Board, color: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        if (getLegalMoves(board, { row, col }).length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

export function makeMove(state: GameState, from: Position, to: Position): GameState | null {
  const piece = state.board[from.row][from.col];
  if (!piece) return null;
  if (piece.color !== state.turn) return null;

  const legalMoves = getLegalMoves(state.board, from);
  const isLegal = legalMoves.some(m => m.row === to.row && m.col === to.col);
  if (!isLegal) return null;

  const newBoard = cloneBoard(state.board);
  const captured = newBoard[to.row][to.col];
  newBoard[to.row][to.col] = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = null;

  let promoted = false;
  const movedPiece = newBoard[to.row][to.col]!;
  if (movedPiece.type === 'P' && to.row === getPromotionRank(movedPiece.color)) {
    newBoard[to.row][to.col] = { type: 'PM', color: movedPiece.color };
    promoted = true;
  }

  const move: Move = { from, to, captured, promoted };
  const nextTurn: PieceColor = state.turn === 'white' ? 'black' : 'white';

  const check = isInCheck(newBoard, nextTurn);
  const hasLegal = hasAnyLegalMoves(newBoard, nextTurn);

  const isCheckmate = check && !hasLegal;
  const isStalemate = !check && !hasLegal;

  const isDraw = isStalemate || isInsufficientMaterial(newBoard);

  return {
    ...state,
    board: newBoard,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, move],
    isCheck: check,
    isCheckmate,
    isStalemate,
    isDraw: isDraw,
    gameOver: isCheckmate || isDraw,
    winner: isCheckmate ? state.turn : null,
    moveCount: state.moveCount + 1,
  };
}

function isInsufficientMaterial(board: Board): boolean {
  const pieces: { white: PieceType[]; black: PieceType[] } = { white: [], black: [] };

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece) {
        pieces[piece.color].push(piece.type);
      }
    }
  }

  // King vs King
  if (pieces.white.length === 1 && pieces.black.length === 1) return true;

  return false;
}

export function posToAlgebraic(pos: Position): string {
  const file = String.fromCharCode(97 + pos.col); // a-h
  const rank = (pos.row + 1).toString(); // 1-8
  return file + rank;
}

export function moveToNotation(move: Move, piece: Piece): string {
  const pieceNames: Record<PieceType, string> = {
    K: 'K', M: 'M', S: 'S', R: 'R', N: 'N', P: '', PM: 'M'
  };
  const prefix = pieceNames[piece.type];
  const capture = move.captured ? 'x' : '';
  const dest = posToAlgebraic(move.to);
  const promo = move.promoted ? '=M' : '';
  return `${prefix}${capture}${dest}${promo}`;
}

export function getBoardAtMove(initialBoard: Board, moves: Move[], moveIndex: number): Board {
  let board = cloneBoard(initialBoard);
  const count = Math.min(moveIndex + 1, moves.length);
  for (let i = 0; i < count; i++) {
    const move = moves[i];
    board[move.to.row][move.to.col] = board[move.from.row][move.from.col];
    board[move.from.row][move.from.col] = null;
    if (move.promoted) {
      const piece = board[move.to.row][move.to.col]!;
      board[move.to.row][move.to.col] = { type: 'PM', color: piece.color };
    }
  }
  return board;
}

export function getAllPieces(board: Board, color: PieceColor): { piece: Piece; pos: Position }[] {
  const pieces: { piece: Piece; pos: Position }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        pieces.push({ piece, pos: { row, col } });
      }
    }
  }
  return pieces;
}
