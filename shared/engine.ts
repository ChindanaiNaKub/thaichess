import { Board, Piece, PieceColor, PieceType, Position, Move, GameState, CountingState, ResultReason } from './types';

export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  // White pieces (rows 0-2)
  const whiteBackRank: PieceType[] = ['R', 'N', 'S', 'K', 'M', 'S', 'N', 'R'];
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: whiteBackRank[col], color: 'white' };
    board[2][col] = { type: 'P', color: 'white' };
  }

  // Black pieces (rows 5-7)
  const blackBackRank: PieceType[] = ['R', 'N', 'S', 'M', 'K', 'S', 'N', 'R'];
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
    resultReason: null,
    counting: null,
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

const MATERIAL_VALUES: Record<Exclude<PieceType, 'K'>, number> = {
  R: 500,
  N: 300,
  S: 250,
  M: 200,
  PM: 200,
  P: 100,
};

function getNonKingPieceCount(board: Board, color: PieceColor): number {
  let count = 0;

  for (const row of board) {
    for (const piece of row) {
      if (piece && piece.color === color && piece.type !== 'K') {
        count++;
      }
    }
  }

  return count;
}

function getTotalPieceCount(board: Board): number {
  let count = 0;

  for (const row of board) {
    for (const piece of row) {
      if (piece) count++;
    }
  }

  return count;
}

function hasUnpromotedPawn(board: Board): boolean {
  for (const row of board) {
    for (const piece of row) {
      if (piece?.type === 'P') return true;
    }
  }

  return false;
}

function getMaterialScore(board: Board, color: PieceColor): number {
  let score = 0;

  for (const row of board) {
    for (const piece of row) {
      if (piece && piece.color === color && piece.type !== 'K') {
        score += MATERIAL_VALUES[piece.type];
      }
    }
  }

  return score;
}

function getPieceHonorLimit(board: Board, strongerColor: PieceColor): number {
  let rooks = 0;
  let bishops = 0;
  let knights = 0;
  let promotedPawns = 0;
  let otherPieces = 0;

  for (const row of board) {
    for (const piece of row) {
      if (!piece || piece.color !== strongerColor || piece.type === 'K') continue;

      if (piece.type === 'R') {
        rooks++;
      } else if (piece.type === 'S') {
        bishops++;
      } else if (piece.type === 'N') {
        knights++;
      } else if (piece.type === 'PM') {
        promotedPawns++;
      } else {
        otherPieces++;
      }
    }
  }

  if (rooks >= 2) return 8;
  if (rooks === 1) return 16;
  if (bishops >= 2) return 22;
  if (knights >= 2) return 32;
  if (bishops === 1) return 44;
  if (knights === 1) return 64;
  if (promotedPawns >= 3) return 64;
  if (promotedPawns > 0 || otherPieces > 0) return 64;
  return 64;
}

function getBareKingCountingState(board: Board): CountingState | null {
  const whiteNonKings = getNonKingPieceCount(board, 'white');
  const blackNonKings = getNonKingPieceCount(board, 'black');

  if (whiteNonKings === 0 && blackNonKings === 0) return null;

  if (whiteNonKings === 0 || blackNonKings === 0) {
    const countingColor: PieceColor = whiteNonKings === 0 ? 'white' : 'black';
    const strongerColor: PieceColor = countingColor === 'white' ? 'black' : 'white';
    const limit = getPieceHonorLimit(board, strongerColor);
    const currentCount = getTotalPieceCount(board);

    return {
      active: false,
      type: 'pieces_honor',
      countingColor,
      strongerColor,
      currentCount,
      startCount: currentCount,
      limit,
      finalAttackPending: false,
    };
  }

  return null;
}

function getBoardHonorCountingState(board: Board): CountingState | null {
  const whiteMaterial = getMaterialScore(board, 'white');
  const blackMaterial = getMaterialScore(board, 'black');

  if (whiteMaterial === blackMaterial) {
    return null;
  }

  const countingColor: PieceColor = whiteMaterial < blackMaterial ? 'white' : 'black';
  const strongerColor: PieceColor = countingColor === 'white' ? 'black' : 'white';

  return {
    active: false,
    type: 'board_honor',
    countingColor,
    strongerColor,
    currentCount: 0,
    startCount: 0,
    limit: 64,
    finalAttackPending: false,
  };
}

function getInitialCountingState(board: Board): CountingState | null {
  if (hasUnpromotedPawn(board)) {
    return null;
  }

  return getBareKingCountingState(board) ?? getBoardHonorCountingState(board);
}

function cloneCountingState(counting: CountingState): CountingState {
  return { ...counting };
}

function getNextCountingState(previous: CountingState | null, board: Board): CountingState | null {
  const fresh = getInitialCountingState(board);
  if (!fresh) return null;

  if (
    previous &&
    previous.type === fresh.type &&
    previous.countingColor === fresh.countingColor &&
    previous.strongerColor === fresh.strongerColor
  ) {
    return {
      ...fresh,
      active: previous.active,
      startCount: previous.startCount ?? fresh.startCount ?? fresh.currentCount,
      currentCount: previous.currentCount,
      limit: previous.type === 'pieces_honor' ? previous.limit : fresh.limit,
      finalAttackPending: previous.finalAttackPending,
    };
  }

  return fresh;
}

function getAutomaticDrawReason(board: Board): ResultReason | null {
  return isInsufficientMaterial(board) ? 'insufficient_material' : null;
}

export function canStartCounting(state: GameState): boolean {
  return Boolean(
    state.counting &&
    !state.gameOver &&
    !state.counting.active &&
    state.turn === state.counting.countingColor,
  );
}

export function canStopCounting(state: GameState): boolean {
  return Boolean(
    state.counting &&
    !state.gameOver &&
    state.counting.active &&
    state.turn === state.counting.countingColor,
  );
}

export function startCounting(state: GameState): GameState | null {
  if (!canStartCounting(state) || !state.counting) return null;

  const fresh = getInitialCountingState(state.board);
  const startCount = state.counting.startCount ?? fresh?.startCount ?? fresh?.currentCount ?? state.counting.currentCount;

  return {
    ...state,
    counting: {
      ...state.counting,
      active: true,
      currentCount: startCount,
      startCount,
      finalAttackPending: false,
    },
  };
}

export function stopCounting(state: GameState): GameState | null {
  if (!canStopCounting(state) || !state.counting) return null;

  return {
    ...state,
    counting: {
      ...state.counting,
      active: false,
      finalAttackPending: false,
    },
  };
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
  let counting = getNextCountingState(state.counting, newBoard);
  let winner: PieceColor | null = isCheckmate ? state.turn : null;
  let resultReason: ResultReason = isCheckmate ? 'checkmate' : null;
  let isDraw = false;
  let gameOver = false;

  if (!gameOver && counting?.active && state.turn === counting.countingColor) {
    counting = cloneCountingState(counting);
    counting.currentCount += 1;

    if (counting.type === 'board_honor') {
      // Board honor draws only after the counting side completes the 65th move.
      if (counting.currentCount > counting.limit) {
        isDraw = true;
        gameOver = true;
        winner = null;
        resultReason = 'counting_rule';
      }
    } else if (counting.currentCount > counting.limit) {
      isDraw = true;
      gameOver = true;
      winner = null;
      resultReason = 'counting_rule';
    } else if (counting.currentCount === counting.limit) {
      counting.finalAttackPending = true;
    }
  } else if (!gameOver && counting?.type === 'pieces_honor' && counting.finalAttackPending && state.turn === counting.strongerColor) {
    counting = cloneCountingState(counting);
    counting.finalAttackPending = false;

    if (!isCheckmate) {
      isDraw = true;
      gameOver = true;
      winner = null;
      resultReason = 'counting_rule';
    }
  }

  if (!gameOver && isCheckmate) {
    gameOver = true;
  }

  if (!gameOver && isStalemate) {
    isDraw = true;
    gameOver = true;
    winner = null;
    resultReason = 'stalemate';
  }

  if (!gameOver) {
    const automaticDrawReason = getAutomaticDrawReason(newBoard);
    if (automaticDrawReason) {
      isDraw = true;
      gameOver = true;
      winner = null;
      resultReason = automaticDrawReason;
    }
  }

  return {
    ...state,
    board: newBoard,
    turn: nextTurn,
    moveHistory: [...state.moveHistory, move],
    isCheck: check,
    isCheckmate,
    isStalemate,
    isDraw,
    gameOver,
    winner,
    resultReason,
    counting: gameOver ? null : counting,
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
