import { useMemo, useState } from 'react';
import Header from './Header';
import PieceSVG from './PieceSVG';
import { useBoardAppearance } from '../lib/pieceStyle';
import { useTranslation } from '../lib/i18n';
import type { BoardThemeCategory, BoardThemeConfig } from '../themes/boards';
import type { PieceThemeId } from '../themes/pieces';

type SettingsTab = 'boards' | 'colors';
type PreviewVariant = 'makruk' | 'legacy';

const PREVIEW_PIECES = [
  { row: 0, col: 0, type: 'S', color: 'black' },
  { row: 0, col: 1, type: 'M', color: 'black' },
  { row: 0, col: 3, type: 'P', color: 'black' },
  { row: 2, col: 0, type: 'N', color: 'white' },
  { row: 2, col: 1, type: 'K', color: 'white' },
  { row: 2, col: 3, type: 'R', color: 'white' },
] as const;

const CATEGORY_ORDER: BoardThemeCategory[] = ['classic', 'soft', 'dark', 'elegant'];
const PREVIEW_SELECTED = { row: 1, col: 2 };
const PREVIEW_LAST_MOVE = [
  { row: 0, col: 2 },
  { row: 1, col: 1 },
];
const PREVIEW_HOVER = { row: 1, col: 0 };
const PREVIEW_LEGAL_DOTS = [
  { row: 3, col: 0 },
  { row: 3, col: 1 },
];
const PREVIEW_CAPTURE = { row: 3, col: 2 };

function isSameSquare(a: { row: number; col: number }, b: { row: number; col: number }) {
  return a.row === b.row && a.col === b.col;
}

function PreviewBoard({
  boardTheme,
  pieceThemeId,
  size = 'large',
  variant = 'makruk',
}: {
  boardTheme: BoardThemeConfig;
  pieceThemeId: PieceThemeId;
  size?: 'small' | 'large';
  variant?: PreviewVariant;
}) {
  const squareClass = size === 'small' ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]';
  const pieceClass = size === 'small' ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-12 w-12 sm:h-14 sm:w-14';
  const frameClass = size === 'small' ? 'rounded-xl p-1' : 'rounded-2xl p-2';
  const innerClass = size === 'small' ? 'rounded-[0.9rem]' : 'rounded-[1.15rem]';

  return (
    <div
      className={`w-fit border border-surface-hover/70 bg-surface/20 shadow-[0_18px_36px_rgba(0,0,0,0.22)] transition-all duration-200 ${frameClass}`}
      style={{ background: boardTheme.frameBackground }}
    >
      <div className={`grid grid-cols-4 overflow-hidden ${innerClass}`} style={{ background: boardTheme.surfaceBackground }}>
        {Array.from({ length: 16 }, (_, index) => {
          const row = Math.floor(index / 4);
          const col = index % 4;
          const square = { row, col };
          const isLight = (row + col) % 2 === 0;
          const piece = PREVIEW_PIECES.find((entry) => entry.row === row && entry.col === col);
          const isSelected = isSameSquare(PREVIEW_SELECTED, square);
          const isHovered = isSameSquare(PREVIEW_HOVER, square);
          const isLastMove = PREVIEW_LAST_MOVE.some((entry) => isSameSquare(entry, square));
          const hasLegalDot = PREVIEW_LEGAL_DOTS.some((entry) => isSameSquare(entry, square));
          const hasLegalCapture = isSameSquare(PREVIEW_CAPTURE, square);

          let background = variant === 'legacy'
            ? (isLight ? boardTheme.legacyPreviewLight : boardTheme.legacyPreviewDark)
            : 'transparent';
          let boxShadow = `inset 0 0 0 1px ${boardTheme.gridColor}`;

          if (variant === 'makruk') {
            if (isSelected) {
              background = boardTheme.selectedBackground;
              boxShadow = `inset 0 0 0 1px ${boardTheme.gridColor}, inset 0 0 0 2px ${boardTheme.selectedRing}`;
            } else if (isLastMove) {
              background = boardTheme.lastMoveBackground;
            } else if (isHovered) {
              background = boardTheme.hoverBackground;
            }
          }

          return (
            <div
              key={index}
              className={`relative flex items-center justify-center ${squareClass} transition-all duration-200`}
              style={{ background, boxShadow }}
            >
              {variant === 'makruk' && hasLegalDot && (
                <div
                  className="absolute rounded-full"
                  style={{
                    width: '28%',
                    height: '28%',
                    backgroundColor: boardTheme.legalDot,
                  }}
                />
              )}
              {variant === 'makruk' && hasLegalCapture && (
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: '14%',
                    border: `3px solid ${boardTheme.legalCapture}`,
                  }}
                />
              )}
              {piece && (
                <PieceSVG
                  type={piece.type}
                  color={piece.color}
                  pieceThemeId={pieceThemeId}
                  className={pieceClass}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ThemeComparisonPreview({
  boardTheme,
  pieceThemeId,
  beforeLabel,
  afterLabel,
}: {
  boardTheme: BoardThemeConfig;
  pieceThemeId: PieceThemeId;
  beforeLabel: string;
  afterLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-surface-hover bg-surface px-3 py-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
          {beforeLabel}
        </div>
        <div className="flex justify-center">
          <PreviewBoard boardTheme={boardTheme} pieceThemeId={pieceThemeId} size="small" variant="legacy" />
        </div>
      </div>
      <div className="rounded-2xl border border-surface-hover bg-surface px-3 py-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
          {afterLabel}
        </div>
        <div className="flex justify-center">
          <PreviewBoard boardTheme={boardTheme} pieceThemeId={pieceThemeId} size="small" variant="makruk" />
        </div>
      </div>
    </div>
  );
}

export default function AppearanceSettingsPage() {
  const { t } = useTranslation();
  const {
    boardTheme,
    boardThemeId,
    boardThemes,
    corePieceShapeLabel,
    pieceTheme,
    pieceThemeId,
    pieceThemes,
    setBoardThemeId,
    setPieceThemeId,
  } = useBoardAppearance();
  const [activeTab, setActiveTab] = useState<SettingsTab>('boards');
  const [hoveredBoardThemeId, setHoveredBoardThemeId] = useState<typeof boardThemeId | null>(null);
  const [hoveredPieceThemeId, setHoveredPieceThemeId] = useState<PieceThemeId | null>(null);

  const previewBoardTheme = useMemo(() => {
    return boardThemes.find((theme) => theme.id === hoveredBoardThemeId) ?? boardTheme;
  }, [boardTheme, boardThemes, hoveredBoardThemeId]);

  const previewPieceThemeId = hoveredPieceThemeId ?? pieceThemeId;
  const previewPieceTheme = pieceThemes.find((theme) => theme.id === previewPieceThemeId) ?? pieceTheme;
  const groupedBoardThemes = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      themes: boardThemes.filter((theme) => theme.category === category),
    })).filter((group) => group.themes.length > 0);
  }, [boardThemes]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header subtitle={t('appearance.title')} />

      <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[1.75rem] border border-surface-hover bg-surface-alt/90 p-5 shadow-[0_26px_70px_rgba(0,0,0,0.18)] sm:p-6">
            <div className="flex flex-col gap-4 border-b border-surface-hover pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{t('appearance.title')}</p>
                <h1 className="mt-2 text-3xl font-bold text-text-bright">{t('appearance.board_and_pieces')}</h1>
                <p className="mt-2 max-w-2xl text-sm text-text-dim sm:text-base">{t('appearance.subtitle')}</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-3 text-sm text-text-dim">
                <span className="font-semibold text-text-bright">{t('appearance.saved_note')}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-surface-hover pb-4">
              <button
                onClick={() => setActiveTab('boards')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'boards' ? 'bg-primary text-white shadow-sm' : 'border border-surface-hover bg-surface text-text-dim hover:text-text-bright'}`}
              >
                {t('appearance.boards_tab')}
              </button>
              <button
                onClick={() => setActiveTab('colors')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'colors' ? 'bg-primary text-white shadow-sm' : 'border border-surface-hover bg-surface text-text-dim hover:text-text-bright'}`}
              >
                {t('appearance.colors_tab')}
              </button>
            </div>

            {activeTab === 'boards' ? (
              <div className="mt-5 space-y-5" onMouseLeave={() => setHoveredBoardThemeId(null)}>
                {groupedBoardThemes.map((group) => (
                  <section key={group.category}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-dim">
                        {t(`appearance.category_${group.category}`)}
                      </h3>
                      <span className="text-[11px] uppercase tracking-[0.18em] text-text-dim">
                        {t('appearance.readability_checked')}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {group.themes.map((theme) => {
                        const isActive = theme.id === boardThemeId;

                        return (
                          <button
                            key={theme.id}
                            onClick={() => setBoardThemeId(theme.id)}
                            onMouseEnter={() => setHoveredBoardThemeId(theme.id)}
                            className={`group rounded-2xl border p-3 text-left transition-all duration-200 ${isActive ? 'border-primary/45 bg-primary/10 shadow-[0_14px_28px_rgba(85,148,63,0.18)]' : 'border-surface-hover bg-surface hover:border-primary/30 hover:bg-surface-hover'}`}
                          >
                            <div className="mb-3 flex justify-center">
                              <PreviewBoard boardTheme={theme} pieceThemeId={previewPieceThemeId} size="small" />
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-text-bright">{theme.label}</div>
                                <div className="mt-1 text-xs text-text-dim">{theme.description}</div>
                                <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-text-dim">
                                  <span className="rounded-full border border-surface-hover bg-surface-alt/80 px-2 py-1">
                                    {t(`appearance.category_${theme.category}`)}
                                  </span>
                                  <span className="rounded-full border border-surface-hover bg-surface-alt/80 px-2 py-1">
                                    {t('appearance.single_surface_label')}
                                  </span>
                                  <span className="rounded-full border border-surface-hover bg-surface-alt/80 px-2 py-1">
                                    {t('appearance.grid_contrast')}: {theme.validation.gridContrast.toFixed(2)}:1
                                  </span>
                                </div>
                              </div>
                              <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${isActive ? 'border-primary bg-primary text-white' : 'border-surface-hover bg-surface text-text-dim group-hover:border-primary/40'}`}>
                                {isActive ? '✓' : ''}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div
                className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                onMouseLeave={() => setHoveredPieceThemeId(null)}
              >
                <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-surface-hover bg-surface/75 px-4 py-3 text-sm text-text-dim">
                  <span className="font-semibold text-text-bright">{t('appearance.core_shape_label')}</span>
                  {' '}
                  {corePieceShapeLabel}
                  {' '}
                  <span>{t('appearance.core_shape_desc')}</span>
                </div>
                {pieceThemes.map((theme) => {
                  const isActive = theme.id === pieceThemeId;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => setPieceThemeId(theme.id)}
                      onMouseEnter={() => setHoveredPieceThemeId(theme.id)}
                      className={`group rounded-2xl border p-3 text-left transition-all duration-200 ${isActive ? 'border-primary/45 bg-primary/10 shadow-[0_14px_28px_rgba(85,148,63,0.18)]' : 'border-surface-hover bg-surface hover:border-primary/30 hover:bg-surface-hover'}`}
                    >
                      <div className="mb-3 flex justify-center">
                        <PreviewBoard boardTheme={boardTheme} pieceThemeId={theme.id} size="small" />
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-text-bright">{theme.label}</div>
                          <div className="mt-1 text-xs text-text-dim">{theme.description}</div>
                        </div>
                        <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${isActive ? 'border-primary bg-primary text-white' : 'border-surface-hover bg-surface text-text-dim group-hover:border-primary/40'}`}>
                          {isActive ? '✓' : ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="rounded-[1.75rem] border border-surface-hover bg-surface-alt/90 p-5 shadow-[0_26px_70px_rgba(0,0,0,0.18)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{t('appearance.live_preview')}</p>
                <h2 className="mt-2 text-2xl font-bold text-text-bright">{t('appearance.preview_title')}</h2>
                <p className="mt-2 text-sm text-text-dim">{t('appearance.preview_subtitle')}</p>
              </div>
              <div className="rounded-full border border-surface-hover bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                {activeTab === 'boards' ? previewBoardTheme.label : previewPieceTheme.label}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <PreviewBoard boardTheme={previewBoardTheme} pieceThemeId={previewPieceThemeId} />
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-surface-hover bg-surface px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-dim">{t('appearance.preview_board')}</div>
                <div className="mt-1 text-sm font-semibold text-text-bright">{previewBoardTheme.label}</div>
                <div className="mt-1 text-xs text-text-dim">{previewBoardTheme.description}</div>
                <div className="mt-3 grid gap-2 text-xs text-text-dim sm:grid-cols-2">
                  <div className="rounded-xl border border-surface-hover bg-surface-alt/80 px-3 py-2">
                    <span className="font-semibold text-text-bright">{t('appearance.grid_contrast')}</span>: {previewBoardTheme.validation.gridContrast.toFixed(2)}:1
                  </div>
                  <div className="rounded-xl border border-surface-hover bg-surface-alt/80 px-3 py-2">
                    <span className="font-semibold text-text-bright">{t('appearance.piece_contrast')}</span>: {previewBoardTheme.validation.weakestPieceContrast.toFixed(2)}:1
                  </div>
                </div>
                <div className="mt-2 rounded-xl border border-surface-hover bg-surface-alt/80 px-3 py-2 text-xs text-text-dim">
                  <span className="font-semibold text-text-bright">{t('appearance.single_surface_label')}</span>
                  {' '}
                  {t('appearance.single_surface_desc')}
                </div>
              </div>
              <div className="rounded-2xl border border-surface-hover bg-surface px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-dim">{t('appearance.comparison_title')}</div>
                <p className="mt-1 text-xs text-text-dim">{t('appearance.comparison_desc')}</p>
                <div className="mt-3">
                  <ThemeComparisonPreview
                    boardTheme={previewBoardTheme}
                    pieceThemeId={previewPieceThemeId}
                    beforeLabel={t('appearance.comparison_before')}
                    afterLabel={t('appearance.comparison_after')}
                  />
                </div>
              </div>
              <div className="rounded-2xl border border-surface-hover bg-surface px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-text-dim">{t('appearance.preview_piece_theme')}</div>
                <div className="mt-1 text-sm font-semibold text-text-bright">{previewPieceTheme.label}</div>
                <div className="mt-1 text-xs text-text-dim">{previewPieceTheme.description}</div>
                <div className="mt-3 rounded-xl border border-surface-hover bg-surface-alt/80 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-text-dim">
                  {t('appearance.core_shape_label')}: <span className="font-semibold text-text-bright">{corePieceShapeLabel}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
