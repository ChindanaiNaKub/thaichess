import type { PieceColor } from '@shared/types';
import { pieceLabel } from '@shared/engineAdapter';
import PieceSVG from './PieceSVG';
import {
  EDITOR_PIECE_ORDER,
  type EditorPieceTool,
  type EditorTool,
} from './AnalysisEditorLogic';

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
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${contrastClass} ${
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
