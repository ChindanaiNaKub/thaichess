import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { TranslateFn } from './gamePageHelpers';

type GameHeaderToolsMenuProps = {
  t: TranslateFn;
  children: ReactNode;
  /** Trigger label — live/spectator use share-oriented copy; bot/local use theme. */
  labelKey?: string;
};

/** Progressive disclosure for share / spectator / game-id actions (Theme sits beside this on live). */
export default function GameHeaderToolsMenu({
  t,
  children,
  labelKey = 'game.tools',
}: GameHeaderToolsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md border border-surface-hover/60 bg-surface px-2.5 h-7 text-xs font-semibold text-text-dim transition-colors hover:bg-surface-hover hover:text-text-bright"
      >
        {t(labelKey)}
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 min-w-[13rem] rounded-xl border border-surface-hover/80 bg-surface-alt/95 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
        >
          <div className="flex flex-col gap-1 [&_a]:block [&_button]:w-full [&_button]:justify-start">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const gameHeaderMenuItemClass =
  'rounded-lg px-3 py-2 text-left text-xs font-semibold text-text transition-colors hover:bg-surface-hover hover:text-text-bright';
