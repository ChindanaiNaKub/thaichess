import type { Position, PieceColor, Board as BoardType } from '@shared/types';
import { createInitialBoard, posToAlgebraic } from '@shared/engine';
import { formatEval } from '@shared/analysis';
import {
  serializeAnalysisPosition,
  type AnalysisPositionSnapshot,
  type PositionAnalysisResult,
} from '@shared/engineAdapter';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow } from './Board';
import {
  createEmptyEditorBoard,
  getEditorValidationMessage,
  type EditorPieceTool,
  type EditorTool,
} from './AnalysisEditorLogic';
import { EditorPieceBank } from './AnalysisEditorTools';
import Header from './Header';
import { EvalBar } from './analysis/EvalBar';
import type { TranslateFn } from './analysisPageHelpers';

type EditorPositionStatus = {
  canAnalyze: boolean;
  errors: string[];
};

type AnalysisEditorViewProps = {
  t: TranslateFn;
  viewAs: PieceColor;
  editorBoard: BoardType;
  editorTurn: PieceColor;
  editorTool: EditorTool;
  editorSelectedSquare: Position | null;
  editorSnapshot: AnalysisPositionSnapshot;
  editorAnalysisKey: string;
  editorPositionStatus: EditorPositionStatus;
  positionAnalysis: PositionAnalysisResult | null;
  positionAnalysisKey: string | null;
  positionAnalyzing: boolean;
  arrows: Arrow[];
  onViewAsChange: (color: PieceColor) => void;
  onEditorTurnChange: (color: PieceColor) => void;
  onEditorToolChange: (tool: EditorTool) => void;
  onEditorBoardChange: (board: BoardType) => void;
  onEditorSquareClick: (pos: Position) => void;
  onEditorPieceDrop: (from: Position, to: Position) => void;
  onArrowsChange: (arrows: Arrow[]) => void;
  onAnalyzePosition: () => void;
  onCopyPosition: () => void;
  onCopyLink: () => void;
  onBackHome: () => void;
};

export function AnalysisEditorView({
  t,
  viewAs,
  editorBoard,
  editorTurn,
  editorTool,
  editorSelectedSquare,
  editorSnapshot,
  editorAnalysisKey,
  editorPositionStatus,
  positionAnalysis,
  positionAnalysisKey,
  positionAnalyzing,
  arrows,
  onViewAsChange,
  onEditorTurnChange,
  onEditorToolChange,
  onEditorBoardChange,
  onEditorSquareClick,
  onEditorPieceDrop,
  onArrowsChange,
  onAnalyzePosition,
  onCopyPosition,
  onCopyLink,
  onBackHome,
}: AnalysisEditorViewProps) {
  const visiblePositionAnalysis = positionAnalysisKey === editorAnalysisKey ? positionAnalysis : null;
  const editorArrow = visiblePositionAnalysis?.bestMove
    ? [{
        from: visiblePositionAnalysis.bestMove.from,
        to: visiblePositionAnalysis.bestMove.to,
        color: '#56b33080',
      }]
    : [];
  const serialized = serializeAnalysisPosition(editorSnapshot);

  return (
    <div className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
      <Header subtitle={t('analysis.title')} />

      <main id="main-content" className="flex-1 flex items-start justify-center px-4 py-4 overflow-y-auto">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 w-full max-w-[1200px]">
          <div className="flex gap-2 w-full lg:flex-1 lg:max-w-[calc(100vh-140px)] max-w-[720px] lg:sticky lg:top-4 lg:self-start">
            <EvalBar eval={positionAnalysis?.evaluation ?? 0} mate={positionAnalysis?.mate ?? null} />

            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="flex items-center gap-2 text-sm w-full justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-text-dim">{t('analysis.editor.label')}</span>
                  <button type="button"
                    onClick={() => onEditorTurnChange('white')}
                    className={`px-3 py-1 rounded text-xs ${editorTurn === 'white' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                  >
                    {t('analysis.editor.turn_to_move', { color: t('common.white') })}
                  </button>
                  <button type="button"
                    onClick={() => onEditorTurnChange('black')}
                    className={`px-3 py-1 rounded text-xs ${editorTurn === 'black' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                  >
                    {t('analysis.editor.turn_to_move', { color: t('common.black') })}
                  </button>
                </div>
                <div className="text-text-dim text-xs">{formatEval(visiblePositionAnalysis?.evaluation ?? 0, visiblePositionAnalysis?.mate)}</div>
              </div>

              <EditorPieceBank
                color="black"
                label={t('analysis.editor.black_pieces')}
                selectedTool={editorTool}
                onSelectTool={(tool: EditorPieceTool) => onEditorToolChange(tool)}
              />

              <BoardErrorBoundary onRetry={() => window.location.reload()}>
                <Board
                  board={editorBoard}
                  playerColor={viewAs}
                  draggableColor={null}
                  allowAnyPieceDrag={editorTool === 'move'}
                  isMyTurn={true}
                  legalMoves={[]}
                  selectedSquare={editorSelectedSquare}
                  lastMove={null}
                  isCheck={false}
                  checkSquare={null}
                  onSquareClick={onEditorSquareClick}
                  onPieceDrop={onEditorPieceDrop}
                  disabled={false}
                  arrows={[...editorArrow, ...arrows]}
                  onArrowsChange={onArrowsChange}
                />
              </BoardErrorBoundary>

              <EditorPieceBank
                color="white"
                label={t('analysis.editor.white_pieces')}
                selectedTool={editorTool}
                onSelectTool={(tool: EditorPieceTool) => onEditorToolChange(tool)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:w-80 w-full max-w-[720px] lg:self-start">
            <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
              <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.tools')}</h3>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => onEditorToolChange('move')}
                  className={`rounded-lg border px-3 py-2 text-sm ${editorTool === 'move' ? 'border-primary bg-primary/15 text-primary-light' : 'border-surface-hover bg-surface-alt text-text'}`}
                >
                  {t('analysis.editor.move_pieces')}
                </button>
                <button type="button"
                  onClick={() => onEditorToolChange('erase')}
                  className={`rounded-lg border px-3 py-2 text-sm ${editorTool === 'erase' ? 'border-primary bg-primary/15 text-primary-light' : 'border-surface-hover bg-surface-alt text-text'}`}
                >
                  {t('analysis.editor.erase_square')}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
              <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.validation')}</h3>
              {editorPositionStatus.canAnalyze ? (
                <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {t('analysis.editor.position_legal')}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                    {t('analysis.editor.position_needs_work')}
                  </div>
                  <ul className="space-y-1 text-sm text-text-dim">
                    {editorPositionStatus.errors.map(errorMessage => (
                      <li key={errorMessage} className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2">
                        {getEditorValidationMessage(errorMessage, t)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
              <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.actions')}</h3>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => onViewAsChange(viewAs === 'white' ? 'black' : 'white')}
                  className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text"
                >
                  {t('analysis.editor.flip_board')}
                </button>
                <button type="button"
                  onClick={() => onEditorBoardChange(createInitialBoard())}
                  className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text"
                >
                  {t('analysis.editor.reset_board')}
                </button>
                <button type="button"
                  onClick={() => onEditorBoardChange(createEmptyEditorBoard())}
                  className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text"
                >
                  {t('analysis.editor.clear_board')}
                </button>
                <button type="button"
                  onClick={onAnalyzePosition}
                  disabled={positionAnalyzing || !editorPositionStatus.canAnalyze}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {positionAnalyzing
                    ? t('analysis.editor.analyzing_position')
                    : t('analysis.editor.analyze_position')}
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
              <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.position')}</h3>
              <textarea
                readOnly
                aria-label={t('analysis.editor.position')}
                value={serialized.position}
                className="min-h-24 w-full rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 font-mono text-xs text-text"
              />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={onCopyPosition} className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text">
                  {t('analysis.editor.copy_position')}
                </button>
                <button type="button" onClick={onCopyLink} className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text">
                  {t('analysis.editor.copy_link')}
                </button>
              </div>
            </div>

            {visiblePositionAnalysis && (
              <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.engine')}</h3>
                <div className="space-y-2 text-sm text-text">
                  <div className="flex items-center justify-between">
                    <span>{t('analysis.editor.eval')}</span>
                      <span className="font-mono text-text-bright">{formatEval(visiblePositionAnalysis.evaluation, visiblePositionAnalysis.mate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('analysis.editor.best_move')}</span>
                    <span className="font-mono text-text-bright">
                      {visiblePositionAnalysis.bestMove
                        ? `${posToAlgebraic(visiblePositionAnalysis.bestMove.from)}-${posToAlgebraic(visiblePositionAnalysis.bestMove.to)}`
                        : t('analysis.editor.none')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('analysis.editor.source')}</span>
                    <span className="text-text-bright">{visiblePositionAnalysis.stats.source}</span>
                  </div>
                  {visiblePositionAnalysis.stats.depth && (
                    <div className="flex items-center justify-between">
                      <span>{t('analysis.editor.depth')}</span>
                      <span className="font-mono text-text-bright">{visiblePositionAnalysis.stats.depth}</span>
                    </div>
                  )}
                  {visiblePositionAnalysis.principalVariation.length > 0 && (
                    <div>
                      <div className="mb-1 text-xs uppercase tracking-[0.18em] text-text-dim">{t('analysis.editor.pv')}</div>
                      <div className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 font-mono text-xs text-text">
                        {visiblePositionAnalysis.principalVariation.join(' ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <button type="button"
                onClick={onBackHome}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
              >
                {t('common.back_home')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
