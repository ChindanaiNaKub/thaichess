import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import { useBoardAppearance } from '../lib/pieceStyle';
import { routes } from '../lib/routes';

interface AppearanceSettingsButtonProps {
  compact?: boolean;
  className?: string;
  /**
   * `navigate` — leave for the full Appearance page (Header / marketing chrome).
   * `popover` — pick board & pieces without unmounting the game shell.
   */
  mode?: 'navigate' | 'popover';
}

type PanelTab = 'boards' | 'pieces';

const triggerClass = (compact: boolean, className: string) =>
  `inline-flex items-center justify-center rounded-md border border-surface-hover/60 bg-surface px-2.5 text-xs font-semibold text-text-dim transition-colors hover:bg-surface-hover hover:text-text-bright ${compact ? 'h-7' : 'h-9'} ${className}`.trim();

const optionClass = (active: boolean) =>
  `flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
    active
      ? 'border-primary/45 bg-primary/10 text-text-bright'
      : 'border-transparent text-text-dim hover:border-surface-hover hover:bg-surface hover:text-text-bright'
  }`;

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null || element === document.activeElement);
}

export default function AppearanceSettingsButton({
  compact = false,
  className = '',
  mode = 'navigate',
}: AppearanceSettingsButtonProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    boardThemeId,
    boardThemes,
    pieceThemeId,
    pieceThemes,
    setBoardThemeId,
    setPieceThemeId,
  } = useBoardAppearance();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PanelTab>('boards');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(false);
  const panelId = useId();
  const label = compact ? t('appearance.open_short') : t('appearance.open');

  useEffect(() => {
    if (mode !== 'popover') return;

    if (open) {
      wasOpenRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = getFocusableElements(panel);
        focusables[0]?.focus();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      triggerRef.current?.focus();
    }
  }, [mode, open]);

  useEffect(() => {
    if (!open || mode !== 'popover') return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = getFocusableElements(panelRef.current);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mode, open]);

  if (mode === 'navigate') {
    return (
      <button
        type="button"
        onClick={() => navigate(routes.appearanceSettings)}
        className={triggerClass(compact, className)}
        title={t('appearance.open')}
      >
        {label}
      </button>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={triggerClass(compact, className)}
        title={t('appearance.open')}
      >
        {label}
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label={t('appearance.board_and_pieces')}
          data-testid="appearance-popover"
          className="absolute right-0 top-full z-40 mt-1 w-[min(18.5rem,calc(100vw-1.5rem))] rounded-xl border border-surface-hover/80 bg-surface-alt/95 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
        >
          <div className="mb-2 flex gap-1 border-b border-surface-hover/70 pb-2" role="tablist" aria-label={t('appearance.board_and_pieces')}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'boards'}
              onClick={() => setTab('boards')}
              className={`flex-1 rounded-md px-2 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                tab === 'boards'
                  ? 'bg-primary/15 text-primary-light'
                  : 'text-text-dim hover:bg-surface hover:text-text-bright'
              }`}
            >
              {t('appearance.boards_tab')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'pieces'}
              onClick={() => setTab('pieces')}
              className={`flex-1 rounded-md px-2 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                tab === 'pieces'
                  ? 'bg-primary/15 text-primary-light'
                  : 'text-text-dim hover:bg-surface hover:text-text-bright'
              }`}
            >
              {t('appearance.pieces_tab')}
            </button>
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto" role="tabpanel">
            {tab === 'boards'
              ? boardThemes.map((theme) => {
                  const active = theme.id === boardThemeId;
                  return (
                    <button
                      type="button"
                      key={theme.id}
                      onClick={() => setBoardThemeId(theme.id)}
                      className={optionClass(active)}
                      aria-pressed={active}
                    >
                      <span
                        className="inline-flex h-6 w-8 shrink-0 overflow-hidden rounded border border-surface-hover/80"
                        aria-hidden
                      >
                        <span className="h-full w-1/2" style={{ background: theme.baseColor }} />
                        <span className="h-full w-1/2" style={{ background: theme.gridColor }} />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{theme.label}</span>
                      {active ? (
                        <span className="text-[0.7rem] font-bold text-primary-light" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                })
              : pieceThemes.map((theme) => {
                  const active = theme.id === pieceThemeId;
                  const whiteFill = theme.colors?.white.fillBase;
                  const blackFill = theme.colors?.black.fillBase;
                  return (
                    <button
                      type="button"
                      key={theme.id}
                      onClick={() => setPieceThemeId(theme.id)}
                      className={optionClass(active)}
                      aria-pressed={active}
                    >
                      <span
                        className="inline-flex h-6 w-8 shrink-0 overflow-hidden rounded border border-surface-hover/80"
                        aria-hidden
                      >
                        <span
                          className="h-full w-1/2 bg-surface"
                          style={whiteFill ? { background: whiteFill } : undefined}
                        />
                        <span
                          className="h-full w-1/2 bg-text-dim"
                          style={blackFill ? { background: blackFill } : undefined}
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{theme.label}</span>
                      {active ? (
                        <span className="text-[0.7rem] font-bold text-primary-light" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
