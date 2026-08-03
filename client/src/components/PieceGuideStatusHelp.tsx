import type { TranslateFn } from './gamePageHelpers';

/** Quiet Piece Guide control for the status lane (check moments only). */
export default function PieceGuideStatusHelp({
  t,
  onShowGuide,
}: {
  t: TranslateFn;
  onShowGuide: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="piece-guide-status-help"
      onClick={onShowGuide}
      className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-text-dim underline-offset-4 transition-colors hover:text-text-bright hover:underline"
    >
      {t('game.piece_guide')}
    </button>
  );
}
