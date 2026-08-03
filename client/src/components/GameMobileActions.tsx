import type { TranslateFn } from './gamePageHelpers';
import ResignConfirmControls from './ResignConfirmControls';

type GameMobileActionsProps = {
  t: TranslateFn;
  /** Live games offer draw; bot games omit this for resign-only thumb-zone. */
  onOfferDraw?: () => void;
  onResign: () => void;
  resignLabelKey?: string;
  confirmMessageKey?: string;
};

const actionButtonClass =
  'min-h-11 flex-1 rounded-xl border border-surface-hover bg-surface-alt px-3 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface-hover';

/** Thumb-zone draw/resign under the board on mobile — keeps high-stakes actions off the below-fold side rail. */
/**
 * Shared Operate high-stakes layout (live / bot / local):
 * - `<lg` + counting: CountingBoardStrip owns compact exits
 * - `<lg` + !counting: this thumb-zone row under the board
 * - `lg+`: side-panel high-stakes above MoveHistory
 * Mode only changes which actions exist (e.g. draw is live-only).
 */
export default function GameMobileActions({
  onOfferDraw,
  onResign,
  resignLabelKey = 'game.resign',
  confirmMessageKey = 'game.resign_confirm',
}: GameMobileActionsProps) {
  return (
    <div
      data-testid="game-mobile-actions"
      className="flex w-full flex-col gap-2"
    >
      <div className="flex gap-2">
        {onOfferDraw ? (
          <ResignConfirmControls
            onConfirm={onOfferDraw}
            resignLabelKey="game.offer_draw"
            confirmMessageKey="game.offer_draw_confirm"
            confirmActionKey="game.offer_draw_confirm_action"
            tone="neutral"
            className={actionButtonClass}
          />
        ) : null}
        <ResignConfirmControls
          onConfirm={onResign}
          resignLabelKey={resignLabelKey}
          confirmMessageKey={confirmMessageKey}
          className={`${actionButtonClass} hover:bg-danger/20 hover:text-danger`}
        />
      </div>
    </div>
  );
}
