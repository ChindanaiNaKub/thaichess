import { useMemo, useState } from 'react';
import Header from './Header';
import PieceSVG from './PieceSVG';
import { useBoardAppearance } from '../lib/pieceStyle';
import { useTranslation } from '../lib/i18n';
import type { BoardThemeConfig } from '../themes/boards';
import type { PieceThemeId } from '../themes/pieces';

type SettingsTab = 'boards' | 'colors';

const PREVIEW_PIECES = [
  { row: 0, col: 0, type: 'S', color: 'black' },
  { row: 0, col: 1, type: 'M', color: 'black' },
  { row: 0, col: 3, type: 'P', color: 'black' },
  { row: 2, col: 0, type: 'N', color: 'white' },
  { row: 2, col: 1, type: 'K', color: 'white' },
  { row: 2, col: 3, type: 'R', color: 'white' },
] as const;

function PreviewBoard({
  boardTheme,
  pieceThemeId,
  size = 'large',
}: {
  boardTheme: BoardThemeConfig;
  pieceThemeId: PieceThemeId;
  size?: 'small' | 'large';
}) {
  const squareClass = size === 'small' ? 'h-6 w-6 sm:h-7 sm:w-7' : 'h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]';
  const pieceClass = size === 'small' ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-12 w-12 sm:h-14 sm:w-14';

  return (
    <div
      className={`grid grid-cols-4 overflow-hidden rounded-2xl border border-surface-hover/70 bg-surface/30 shadow-[0_18px_36px_rgba(0,0,0,0.22)] transition-all duration-200 ${size === 'small' ? 'w-fit rounded-xl' : 'w-fit'}`}
      style={{ background: boardTheme.frameBackground }}
    >
      {Array.from({ length: 16 }, (_, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const isLight = (row + col) % 2 === 0;
        const piece = PREVIEW_PIECES.find((entry) => entry.row === row && entry.col === col);

        return (
          <div
            key={index}
            className={`relative flex items-center justify-center ${squareClass} transition-all duration-200`}
            style={{ background: isLight ? boardTheme.lightBackground : boardTheme.darkBackground }}
          >
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
              <div
                className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                onMouseLeave={() => setHoveredBoardThemeId(null)}
              >
                {boardThemes.map((theme) => {
                  const isActive = theme.id === boardThemeId;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => setBoardThemeId(theme.id)}
                      onMouseEnter={() => setHoveredBoardThemeId(theme.id)}
                      className={`group rounded-2xl border p-3 text-left transition-all duration-200 ${isActive ? 'border-primary/45 bg-primary/10 shadow-[0_14px_28px_rgba(85,148,63,0.18)]' : 'border-surface-hover bg-surface hover:border-primary/30 hover:bg-surface-hover'}`}
                    >
                      <div className="mb-3 grid grid-cols-2 overflow-hidden rounded-xl border border-white/10 shadow-inner">
                        <div className="aspect-square" style={{ background: theme.lightBackground }} />
                        <div className="aspect-square" style={{ background: theme.darkBackground }} />
                        <div className="aspect-square" style={{ background: theme.darkBackground }} />
                        <div className="aspect-square" style={{ background: theme.lightBackground }} />
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
