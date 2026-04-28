import type { Board, PieceColor, PieceType } from '@shared/types';
import { getMakrukPositionValidationErrors } from '@shared/makrukPositionValidation';
import { pieceLabel, serializeAnalysisPosition, type AnalysisPositionSnapshot } from '@shared/engineAdapter';
import PieceSVG from './PieceSVG';

export type EditorPieceTool = `${PieceColor}:${PieceType}`;
export type EditorTool = 'erase' | 'move' | EditorPieceTool;

export const EDITOR_PIECE_ORDER: readonly PieceType[] = ['R', 'N', 'S', 'M', 'K', 'P', 'PM'];

export function createEmptyEditorBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
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

interface EditorPieceBankProps {
  color: PieceColor;
  selectedTool: EditorTool;
  onSelectTool: (tool: EditorPieceTool) => void;
  label?: string;
}

function getDefaultBankLabel(color: PieceColor): string {
  return color === 'white' ? 'White pieces' : 'Black pieces';
}

export function EditorPieceBank({ color, selectedTool, onSelectTool, label }: EditorPieceBankProps) {
  const bankLabel = label ?? getDefaultBankLabel(color);

  return (
    <div
      role="group"
      aria-label={bankLabel}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-alt px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)]"
    >
      <span className="sr-only">{bankLabel}</span>
      {EDITOR_PIECE_ORDER.map(type => {
        const tool = `${color}:${type}` as EditorPieceTool;
        const selected = selectedTool === tool;
        const labelText = pieceLabel({ type, color });
        const contrastClass = color === 'black'
          ? 'editor-piece-bank-button-black bg-[#d7c3a0] shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_8px_18px_rgba(0,0,0,0.22)]'
          : 'bg-surface';

        return (
          <button
            key={tool}
            type="button"
            aria-label={labelText}
            onClick={() => onSelectTool(tool)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${contrastClass} ${
              selected
                ? 'border-primary text-primary-light ring-2 ring-primary/30'
                : 'border-surface-hover text-text hover:border-primary/60'
            }`}
          >
            <PieceSVG type={type} color={color} size={26} />
            <span className="sr-only">{labelText}</span>
          </button>
        );
      })}
    </div>
  );
}
