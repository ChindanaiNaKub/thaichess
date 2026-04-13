import type { Board, CountingState, Move, Piece, PieceColor, PieceType, Position } from './types';

export type AnalysisSource = 'game' | 'local' | 'bot' | 'editor';

export interface AnalysisPositionSnapshot {
  board: Board;
  turn: PieceColor;
  counting: CountingState | null;
}

export interface SerializedAnalysisPosition {
  position: string;
  counting: string | null;
}

export interface EngineStats {
  depth?: number;
  selDepth?: number;
  nodes?: number;
  nps?: number;
  source: 'service' | 'binary' | 'local';
}

export interface PositionAnalysisResult {
  evaluation: number;
  mate?: number | null;
  bestMove: { from: Position; to: Position } | null;
  principalVariation: string[];
  stats: EngineStats;
}

export interface BotMoveResult extends PositionAnalysisResult {
  move: { from: Position; to: Position } | null;
}

export interface EngineServiceAnalyzeRequest {
  variant: 'makruk';
  position: string;
  counting?: string | null;
  search: {
    movetimeMs?: number;
    depth?: number;
    nodes?: number;
  };
  multipv?: number;
}

export interface EngineServiceAnalyzeResponse {
  bestMoveUci: string | null;
  pvUci: string[];
  evalCp: number;
  mate?: number | null;
  depth?: number;
  selDepth?: number;
  nodes?: number;
  nps?: number;
}

const PIECE_TO_CHAR: Record<PieceType, string> = {
  K: 'K',
  M: 'M',
  S: 'S',
  R: 'R',
  N: 'N',
  P: 'P',
  PM: 'F',
};

const CHAR_TO_PIECE: Record<string, PieceType> = {
  K: 'K',
  M: 'M',
  S: 'S',
  R: 'R',
  N: 'N',
  P: 'P',
  F: 'PM',
};

function createEmptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

export function serializeBoardPosition(board: Board): string {
  const ranks: string[] = [];

  for (let row = 7; row >= 0; row -= 1) {
    let rank = '';
    let emptyRun = 0;

    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];

      if (!piece) {
        emptyRun += 1;
        continue;
      }

      if (emptyRun > 0) {
        rank += String(emptyRun);
        emptyRun = 0;
      }

      const base = PIECE_TO_CHAR[piece.type];
      rank += piece.color === 'white' ? base : base.toLowerCase();
    }

    if (emptyRun > 0) {
      rank += String(emptyRun);
    }

    ranks.push(rank);
  }

  return ranks.join('/');
}

export function deserializeBoardPosition(serialized: string): Board | null {
  const ranks = serialized.trim().split('/');
  if (ranks.length !== 8) return null;

  const board = createEmptyBoard();

  for (let rankIndex = 0; rankIndex < 8; rankIndex += 1) {
    const rank = ranks[rankIndex];
    let col = 0;

    for (const char of rank) {
      if (/\d/.test(char)) {
        col += Number(char);
        continue;
      }

      const upper = char.toUpperCase();
      const type = CHAR_TO_PIECE[upper];
      if (!type || col > 7) return null;

      board[7 - rankIndex][col] = {
        type,
        color: char === upper ? 'white' : 'black',
      };
      col += 1;
    }

    if (col !== 8) return null;
  }

  return board;
}

export function serializeAnalysisPosition(snapshot: AnalysisPositionSnapshot): SerializedAnalysisPosition {
  return {
    position: `${serializeBoardPosition(snapshot.board)} ${snapshot.turn === 'white' ? 'w' : 'b'}`,
    counting: snapshot.counting ? JSON.stringify(snapshot.counting) : null,
  };
}

export function deserializeAnalysisPosition(position: string, counting?: string | null): AnalysisPositionSnapshot | null {
  const [boardPart, turnPart] = position.trim().split(/\s+/);
  if (!boardPart || !turnPart) return null;

  const board = deserializeBoardPosition(boardPart);
  if (!board) return null;

  let turn: PieceColor;
  if (turnPart === 'w') {
    turn = 'white';
  } else if (turnPart === 'b') {
    turn = 'black';
  } else {
    return null;
  }

  let parsedCounting: CountingState | null = null;
  if (counting) {
    try {
      parsedCounting = JSON.parse(counting) as CountingState;
    } catch {
      parsedCounting = null;
    }
  }

  return { board, turn, counting: parsedCounting };
}

function coordToIndex(file: string, rank: string): Position | null {
  const col = file.charCodeAt(0) - 97;
  const row = Number(rank) - 1;
  if (Number.isNaN(row) || row < 0 || row > 7 || col < 0 || col > 7) return null;
  return { row, col };
}

export function positionToUciSquare(pos: Position): string {
  return `${String.fromCharCode(97 + pos.col)}${pos.row + 1}`;
}

export function moveToUci(move: { from: Position; to: Position } | Move): string {
  return `${positionToUciSquare(move.from)}${positionToUciSquare(move.to)}`;
}

export function uciToMove(uci: string): { from: Position; to: Position } | null {
  const normalized = uci.trim().toLowerCase();
  if (!/^[a-h][1-8][a-h][1-8][a-z]?$/.test(normalized)) return null;

  const from = coordToIndex(normalized[0], normalized[1]);
  const to = coordToIndex(normalized[2], normalized[3]);
  if (!from || !to) return null;

  return { from, to };
}

export function pieceLabel(piece: Piece): string {
  const colorPrefix = piece.color === 'white' ? 'w' : 'b';
  return `${colorPrefix}${piece.type}`;
}
