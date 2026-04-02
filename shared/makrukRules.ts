import type { Board, CountingState, PieceColor, PieceType } from './types';

export interface MakrukRuleReference {
  id: string;
  title: string;
  url: string;
  covers: string[];
}

export interface MakrukPieceRule {
  piece: PieceType;
  englishName: string;
  thaiName: string;
  movement: string;
}

export interface MakrukTimeoutOutcome {
  winner: PieceColor | null;
  isDraw: boolean;
}

const MATERIAL_VALUES: Record<Exclude<PieceType, 'K'>, number> = {
  R: 500,
  N: 300,
  S: 250,
  M: 200,
  PM: 200,
  P: 100,
};

export const MAKRUK_RULE_REFERENCES: MakrukRuleReference[] = [
  {
    id: 'basics',
    title: 'Basics of playing Thai chess',
    url: 'https://makruk.gameindy.com/manual/lets-get-to-know-basics-of-playing-thai-chess',
    covers: ['board', 'setup', 'piece-movement', 'promotion', 'turn-order'],
  },
  {
    id: 'sak-kradan-vs-sak-mak',
    title: 'Difference between counting Sak Kradan and Sak Mak',
    url: 'https://makruk.gameindy.com/manual/what-is-the-difference-between-counting-sak-kradan-and-sak-mak',
    covers: ['board-honor', 'pieces-honor', 'counting-start', 'counting-limits', 'immediate-draw'],
  },
  {
    id: 'draw-rules',
    title: 'Draw rules in Thai chess',
    url: 'https://makruk.gameindy.com/manual/what-are-the-rules-for-drawing-in-thai-chess',
    covers: ['timeout-draw', 'stalemate', 'agreement', 'bare-kings', 'ruk-lo'],
  },
  {
    id: 'win-loss-decisions',
    title: 'Winning and losing decisions in Thai chess competitions',
    url: 'https://makruk.gameindy.com/manual/winning-and-losing-decisions-in-thai-chess-competitions-what-are-they',
    covers: ['checkmate', 'timeout-win', 'resignation'],
  },
];

export const MAKRUK_PIECE_RULES: MakrukPieceRule[] = [
  {
    piece: 'K',
    englishName: 'Khun',
    thaiName: 'ขุน',
    movement: 'One square in any direction.',
  },
  {
    piece: 'M',
    englishName: 'Met',
    thaiName: 'เม็ด',
    movement: 'One square diagonally.',
  },
  {
    piece: 'S',
    englishName: 'Khon',
    thaiName: 'โคน',
    movement: 'One square diagonally or one square straight forward.',
  },
  {
    piece: 'N',
    englishName: 'Ma',
    thaiName: 'ม้า',
    movement: 'Knight jump in an L-shape; can leap over pieces.',
  },
  {
    piece: 'R',
    englishName: 'Rua',
    thaiName: 'เรือ',
    movement: 'Any number of squares orthogonally.',
  },
  {
    piece: 'P',
    englishName: 'Bia',
    thaiName: 'เบี้ย',
    movement: 'One square straight forward, captures one square diagonally forward.',
  },
  {
    piece: 'PM',
    englishName: 'Bia Ngai',
    thaiName: 'เบี้ยหงาย',
    movement: 'Moves exactly like a Met after promotion.',
  },
];

function countPieces(board: Board): number {
  let total = 0;

  for (const row of board) {
    for (const piece of row) {
      if (piece) total += 1;
    }
  }

  return total;
}

function countNonKings(board: Board, color: PieceColor): number {
  let total = 0;

  for (const row of board) {
    for (const piece of row) {
      if (piece && piece.color === color && piece.type !== 'K') {
        total += 1;
      }
    }
  }

  return total;
}

function countPiecesOfType(board: Board, color: PieceColor, type: PieceType): number {
  let total = 0;

  for (const row of board) {
    for (const piece of row) {
      if (piece?.color === color && piece.type === type) {
        total += 1;
      }
    }
  }

  return total;
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

export function hasUnpromotedPawns(board: Board): boolean {
  for (const row of board) {
    for (const piece of row) {
      if (piece?.type === 'P') {
        return true;
      }
    }
  }

  return false;
}

export function hasBareKingsOnly(board: Board): boolean {
  return countNonKings(board, 'white') === 0 && countNonKings(board, 'black') === 0;
}

export function getMakrukPieceHonorLimit(board: Board, strongerColor: PieceColor): number {
  const rooks = countPiecesOfType(board, strongerColor, 'R');
  const khons = countPiecesOfType(board, strongerColor, 'S');
  const knights = countPiecesOfType(board, strongerColor, 'N');
  const metLike = countPiecesOfType(board, strongerColor, 'M') + countPiecesOfType(board, strongerColor, 'PM');

  if (rooks >= 2) return 8;
  if (rooks === 1) return 16;
  if (khons >= 2) return 22;
  if (knights >= 2) return 32;
  if (khons === 1) return 44;
  if (knights === 1) return 64;
  if (metLike > 0) return 64;
  return 64;
}

export function isMakrukPiecesHonorImmediateDraw(board: Board, strongerColor: PieceColor): boolean {
  const limit = getMakrukPieceHonorLimit(board, strongerColor);
  return countPieces(board) + 1 > limit;
}

export function getMakrukCountingState(board: Board): CountingState | null {
  if (hasUnpromotedPawns(board)) {
    return null;
  }

  const whiteNonKings = countNonKings(board, 'white');
  const blackNonKings = countNonKings(board, 'black');

  if (whiteNonKings === 0 && blackNonKings === 0) {
    return null;
  }

  if (whiteNonKings === 0 || blackNonKings === 0) {
    const countingColor: PieceColor = whiteNonKings === 0 ? 'white' : 'black';
    const strongerColor: PieceColor = countingColor === 'white' ? 'black' : 'white';
    const currentCount = countPieces(board);

    return {
      active: true,
      type: 'pieces_honor',
      countingColor,
      strongerColor,
      currentCount,
      startCount: currentCount,
      limit: getMakrukPieceHonorLimit(board, strongerColor),
      finalAttackPending: false,
    };
  }

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

function hasBiaThiamTriple(board: Board, color: PieceColor): boolean {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col <= 5; col += 1) {
      const left = board[row][col];
      const center = board[row][col + 1];
      const right = board[row][col + 2];

      if (
        left?.color === color && left.type === 'P' &&
        center?.color === color && center.type === 'P' &&
        right?.color === color && right.type === 'P'
      ) {
        return true;
      }
    }
  }

  return false;
}

export function hasMakrukTimeoutWinningMaterial(board: Board, color: PieceColor): boolean {
  const rooks = countPiecesOfType(board, color, 'R');
  const knights = countPiecesOfType(board, color, 'N');
  const khons = countPiecesOfType(board, color, 'S');
  const metLike = countPiecesOfType(board, color, 'M') + countPiecesOfType(board, color, 'PM');

  if (rooks >= 1) {
    return true;
  }

  if (knights >= 1 && metLike >= 1) {
    return true;
  }

  if (khons >= 1 && metLike >= 1) {
    return true;
  }

  // Gameindy lists "Khun + Bia Thiam 3". The manual names the formation but does not
  // formalize its geometry, so we model it as three same-rank adjacent unpromoted pawns.
  return hasBiaThiamTriple(board, color);
}

export function resolveMakrukTimeoutOutcome(board: Board, flaggedColor: PieceColor): MakrukTimeoutOutcome {
  const opponent: PieceColor = flaggedColor === 'white' ? 'black' : 'white';
  const winner = hasMakrukTimeoutWinningMaterial(board, opponent) ? opponent : null;

  return {
    winner,
    isDraw: winner === null,
  };
}
