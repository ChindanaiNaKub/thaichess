import { getLegalMoves } from './engine';
import { isMateTheme, isPromotionTheme, isTacticalTheme } from './puzzleThemes';
import type { Board, PieceColor, Position } from './types';

export type PuzzleOrigin =
  | 'starter-pack'
  | 'real-game'
  | 'seed-game'
  | 'review-batch'
  | 'curated-manual'
  | 'engine-generated';

export interface PuzzleSourceReference {
  sourceGameId: string | null;
  sourcePly: number | null;
}

export interface PuzzleMetadataInput {
  theme: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  source: string;
  motif: string;
  board: Board;
  toMove: PieceColor;
  solution: { from: Position; to: Position }[];
  tags?: string[];
  dependsOnCounting?: boolean;
}

function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function countLegalMoves(board: Board, color: PieceColor): number {
  let total = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) continue;
      total += getLegalMoves(board, { row, col }).length;
    }
  }

  return total;
}

export function countBoardPieces(board: Board): number {
  return board.reduce((total, row) => total + row.filter(Boolean).length, 0);
}

export function countBoardPawns(board: Board): number {
  let total = 0;

  for (const row of board) {
    for (const piece of row) {
      if (piece?.type === 'P') {
        total += 1;
      }
    }
  }

  return total;
}

export function countBoardActivePieces(board: Board): number {
  let total = 0;

  for (const row of board) {
    for (const piece of row) {
      if (!piece || piece.type === 'K' || piece.type === 'P') continue;
      total += 1;
    }
  }

  return total;
}

export function isMiddlegameRichBoard(board: Board): boolean {
  return countBoardPieces(board) >= 14 &&
    countBoardPawns(board) >= 6 &&
    countBoardActivePieces(board) >= 6;
}

export function isSparseEndgameBoard(board: Board): boolean {
  return countBoardPieces(board) <= 8 ||
    (countBoardPawns(board) <= 3 && countBoardActivePieces(board) <= 3);
}

function addTag(tags: string[], tag: string | null | undefined): void {
  if (!tag) return;
  const normalized = normalizeTag(tag);
  if (!normalized || tags.includes(normalized)) return;
  tags.push(normalized);
}

export function derivePuzzleOrigin(source: string): PuzzleOrigin {
  const normalized = source.trim().toLowerCase();

  if (normalized.startsWith('manual source-of-truth') || normalized.startsWith('curated manual:')) return 'curated-manual';
  if (normalized.startsWith('makruk-native sample pack:')) return 'curated-manual';
  if (normalized.startsWith('starter pack:')) return 'starter-pack';
  if (normalized.startsWith('imported candidate batch:')) return 'review-batch';
  if (normalized.startsWith('offline self-play') || normalized.startsWith('generated real-game candidate')) return 'engine-generated';
  if (normalized.startsWith('seed game corpus:') || normalized.startsWith('seed review game')) return 'seed-game';
  if (normalized.startsWith('exported ') || normalized.includes('real-game')) return 'real-game';

  return 'review-batch';
}

export function derivePuzzleSourceReference(source: string): PuzzleSourceReference {
  const match = source.match(/\bgame(?:\s+corpus)?[:\s]+([a-z0-9_-]+)\s*\(ply\s+(\d+)\)/i);
  if (!match) {
    return {
      sourceGameId: null,
      sourcePly: null,
    };
  }

  return {
    sourceGameId: match[1] ?? null,
    sourcePly: match[2] ? Number.parseInt(match[2], 10) : null,
  };
}

export function derivePuzzleTags(input: PuzzleMetadataInput): string[] {
  const tags: string[] = [];
  const origin = derivePuzzleOrigin(input.source);
  const sourceReference = derivePuzzleSourceReference(input.source);
  const hintText = `${input.theme} ${input.motif} ${input.source}`.toLowerCase();

  for (const tag of input.tags ?? []) {
    addTag(tags, tag);
  }

  if (isMateTheme(input.theme)) addTag(tags, 'mate');
  if (isPromotionTheme(input.theme)) addTag(tags, 'promotion');
  if (isTacticalTheme(input.theme)) {
    addTag(tags, 'tactic');
    addTag(tags, 'material-gain');
  }

  if (input.dependsOnCounting) {
    addTag(tags, 'counting');
  }

  switch (input.theme) {
    case 'Fork':
      addTag(tags, 'fork');
      break;
    case 'DoubleAttack':
      addTag(tags, 'double-attack');
      break;
    case 'Discovery':
      addTag(tags, 'discovery');
      break;
    case 'Pin':
      addTag(tags, 'pin');
      break;
    case 'TrappedPiece':
      addTag(tags, 'trap');
      break;
    case 'Endgame':
      addTag(tags, 'endgame');
      break;
    case 'BestDefense':
      addTag(tags, 'defense');
      break;
    case 'SaveTheDraw':
      addTag(tags, 'save-the-draw');
      addTag(tags, 'stalemate');
      break;
    case 'WinBeforeCountExpires':
      addTag(tags, 'win-before-count');
      addTag(tags, 'sak-mak');
      break;
    case 'CountingDraw':
      addTag(tags, 'counting-draw');
      addTag(tags, 'sak-mak');
      break;
    case 'BackRank':
      addTag(tags, 'back-rank');
      break;
    case 'SupportMate':
      addTag(tags, 'support-mate');
      break;
  }

  if (hintText.includes('pawn break')) addTag(tags, 'pawn-break');
  if (hintText.includes('check')) addTag(tags, 'check');

  if (origin === 'real-game') addTag(tags, 'real-game');
  if (origin === 'seed-game') addTag(tags, 'seed-game');
  if (origin === 'starter-pack') addTag(tags, 'starter-pack');
  if (origin === 'curated-manual') addTag(tags, 'curated');
  if (origin === 'engine-generated') addTag(tags, 'generated');
  if (isMiddlegameRichBoard(input.board)) addTag(tags, 'middlegame');
  if (isSparseEndgameBoard(input.board)) addTag(tags, 'endgame');

  if (input.solution.length >= 3) {
    addTag(tags, 'forcing-sequence');
  }

  if (
    hintText.includes('open file') ||
    hintText.includes('opening') ||
    ((origin === 'real-game' || origin === 'seed-game') &&
      input.solution.length <= 3 &&
      sourceReference.sourcePly !== null &&
      sourceReference.sourcePly <= 18)
  ) {
    addTag(tags, 'opening');
  }

  return tags;
}

export function estimatePuzzleDifficultyScore(input: PuzzleMetadataInput): number {
  const legalMoveCount = countLegalMoves(input.board, input.toMove);
  const pieceCount = countBoardPieces(input.board);
  const pawnCount = countBoardPawns(input.board);
  const firstMove = input.solution[0];
  const firstMoveCapture = firstMove
    ? Boolean(input.board[firstMove.to.row]?.[firstMove.to.col])
    : false;
  const sourceOrigin = derivePuzzleOrigin(input.source);
  const tags = derivePuzzleTags(input);

  let score = 760;
  score += (input.solution.length - 1) * 150;
  score += Math.min(220, Math.max(0, legalMoveCount - 1) * 10);
  score += Math.min(140, Math.max(0, pieceCount - 4) * 6);
  score += Math.min(90, pawnCount * 8);
  score += firstMoveCapture ? 0 : 60;

  if (tags.includes('fork')) score += 80;
  if (tags.includes('double-attack')) score += 70;
  if (tags.includes('discovery')) score += 90;
  if (tags.includes('trap')) score += 80;
  if (tags.includes('middlegame')) score += 110;
  if (tags.includes('endgame')) score += 40;
  if (sourceOrigin === 'real-game' || sourceOrigin === 'seed-game') score += 30;

  if (input.difficulty === 'beginner') score -= 80;
  if (input.difficulty === 'advanced') score += 120;

  return Math.max(600, Math.min(2400, score));
}
