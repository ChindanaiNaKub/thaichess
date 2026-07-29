import type { Board, Piece, PieceColor, PieceType, Position } from '@shared/types';
import { getMakrukPositionValidationErrors } from '@shared/makrukPositionValidation';
import { serializeAnalysisPosition, type AnalysisPositionSnapshot } from '@shared/engineAdapter';


export type EditorPieceTool = `${PieceColor}:${PieceType}`;
export type EditorTool = 'erase' | 'move' | EditorPieceTool;

export const EDITOR_PIECE_ORDER: readonly PieceType[] = ['R', 'N', 'S', 'M', 'K', 'P', 'PM'];

export function createEmptyEditorBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

export function withPieceAt(board: Board, pos: Position, piece: Piece | null): Board {
  return board.map((row, rowIndex) => (
    rowIndex !== pos.row
      ? row
      : row.map((cell, colIndex) => (colIndex === pos.col ? piece : cell))
  ));
}

export function movePieceOnBoard(board: Board, from: Position, to: Position): Board {
  const movingPiece = board[from.row]?.[from.col] ?? null;
  if (!movingPiece) return board;
  return withPieceAt(withPieceAt(board, from, null), to, movingPiece);
}

export interface EditorPositionStatus {
  canAnalyze: boolean;
  errors: string[];
}

export function getEditorPositionStatus(board: Board): EditorPositionStatus {
  const errors = getMakrukPositionValidationErrors(board);

  return {
    canAnalyze: errors.length === 0,
    errors,
  };
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

export function getEditorAnalysisSnapshotKey(snapshot: AnalysisPositionSnapshot): string {
  const serialized = serializeAnalysisPosition(snapshot);
  return `${serialized.position}|${serialized.counting ?? ''}`;
}

export function getEditorValidationMessage(errorMessage: string, t: Translate): string {
  const oneKingMatch = errorMessage.match(/^(white|black) must have exactly one king\.$/);
  if (oneKingMatch) {
    return t('analysis.editor.validation.one_king', { color: oneKingMatch[1] });
  }

  const tooManyBasePiecesMatch = errorMessage.match(/^(white|black) has too many (M|S|N|R) pieces for a legal Makruk game\.$/);
  if (tooManyBasePiecesMatch) {
    return t('analysis.editor.validation.too_many_piece', {
      color: tooManyBasePiecesMatch[1],
      piece: tooManyBasePiecesMatch[2],
    });
  }

  const tooManyBiaMatch = errorMessage.match(/^(white|black) has more than eight bia\/promoted-bia units\.$/);
  if (tooManyBiaMatch) {
    return t('analysis.editor.validation.too_many_bia', { color: tooManyBiaMatch[1] });
  }

  const tooManyPromotedBiaMatch = errorMessage.match(/^(white|black) has too many promoted bia pieces\.$/);
  if (tooManyPromotedBiaMatch) {
    return t('analysis.editor.validation.too_many_promoted_bia', { color: tooManyPromotedBiaMatch[1] });
  }

  const tooManyMetLikeMatch = errorMessage.match(/^(white|black) has more met-like pieces than a legal Makruk game can produce\.$/);
  if (tooManyMetLikeMatch) {
    return t('analysis.editor.validation.too_many_met_like', { color: tooManyMetLikeMatch[1] });
  }

  const tooManyTotalMatch = errorMessage.match(/^(white|black) has more than sixteen pieces on the board\.$/);
  if (tooManyTotalMatch) {
    return t('analysis.editor.validation.too_many_total', { color: tooManyTotalMatch[1] });
  }

  const pawnBehindMatch = errorMessage.match(/^(White|Black) bia cannot be behind its starting rank\.$/);
  if (pawnBehindMatch) {
    return t('analysis.editor.validation.bia_behind', { color: pawnBehindMatch[1].toLowerCase() });
  }

  const pawnUnpromotedMatch = errorMessage.match(/^(White|Black) bia cannot remain unpromoted on or beyond the promotion rank\.$/);
  if (pawnUnpromotedMatch) {
    return t('analysis.editor.validation.bia_unpromoted', { color: pawnUnpromotedMatch[1].toLowerCase() });
  }

  const staticMessages: Record<string, string> = {
    'Board must be 8x8.': 'analysis.editor.validation.board_shape',
    'Kings cannot be adjacent in a legal Makruk position.': 'analysis.editor.validation.adjacent_kings',
    'Both kings cannot be in check at the same time.': 'analysis.editor.validation.both_kings_check',
    'Board does not admit any legal side-to-move assignment.': 'analysis.editor.validation.no_legal_turn',
  };

  const key = staticMessages[errorMessage];
  return key ? t(key) : errorMessage;
}
