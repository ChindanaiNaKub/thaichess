import type { TranslateFn } from './gamePageHelpers';
import CountingHelpDisclosure from './CountingHelpDisclosure';
import CountingLeaveDisclosure from './CountingLeaveDisclosure';
import CountingStartConsequence from './CountingStartConsequence';
import {
  countingLabelClass,
  countingPanelClass,
  countingStartButtonClass,
  countingStopButtonClass,
  countingTitleClass,
} from './countingChrome';
import ResignConfirmControls from './ResignConfirmControls';

type CountingBoardStripProps = {
  t: TranslateFn;
  label: string;
  canStart?: boolean;
  canStop?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  /** Live games: optional draw escape while counting owns the board-adjacent lane. */
  onOfferDraw?: () => void;
  /** Safety exit while thumb-zone GameMobileActions are demoted during counting. */
  onResign?: () => void;
  resignLabelKey?: string;
  confirmMessageKey?: string;
  /** When the player's clock is critical, auto-expand Draw/Resign for discovery. */
  leaveUrgent?: boolean;
};

const exitButtonClass =
  'min-h-10 flex-1 rounded-lg border border-surface-hover/80 bg-surface-alt/90 px-3 py-2 text-xs font-semibold text-text transition-colors hover:bg-surface-hover sm:text-sm';

function CountingLeaveExits({
  t,
  onOfferDraw,
  onResign,
  resignLabelKey,
  confirmMessageKey,
  leaveUrgent,
}: {
  t: TranslateFn;
  onOfferDraw?: () => void;
  onResign?: () => void;
  resignLabelKey: string;
  confirmMessageKey: string;
  leaveUrgent: boolean;
}) {
  return (
    <div className="mt-2">
      <CountingLeaveDisclosure
        t={t}
        leaveUrgent={leaveUrgent}
        toggleTestId="counting-board-strip-leave-toggle"
        exitsTestId="counting-board-strip-exits"
      >
        {onOfferDraw ? (
          <ResignConfirmControls
            onConfirm={onOfferDraw}
            resignLabelKey="game.offer_draw"
            confirmMessageKey="game.offer_draw_confirm"
            confirmActionKey="game.offer_draw_confirm_action"
            tone="neutral"
            className={exitButtonClass}
          />
        ) : null}
        {onResign ? (
          <ResignConfirmControls
            onConfirm={onResign}
            resignLabelKey={resignLabelKey}
            confirmMessageKey={confirmMessageKey}
            className={`${exitButtonClass} hover:bg-danger/20 hover:text-danger`}
          />
        ) : null}
      </CountingLeaveDisclosure>
    </div>
  );
}

/** Compact counting chrome for mobile — felt shell; State Gold on the title eyebrow. */
export default function CountingBoardStrip({
  t,
  label,
  canStart = false,
  canStop = false,
  onStart,
  onStop,
  onOfferDraw,
  onResign,
  resignLabelKey = 'game.resign',
  confirmMessageKey = 'game.resign_confirm',
  leaveUrgent = false,
}: CountingBoardStripProps) {
  const showExits = Boolean(onResign || onOfferDraw);
  const awaitingStart = Boolean(canStart && onStart);

  return (
    <div
      data-testid="counting-board-strip"
      className={`mb-1.5 w-full px-3 py-2 ${countingPanelClass}`}
    >
      <div className={countingTitleClass}>
        {t('game.counting_title')}
      </div>
      <div className={`text-xs sm:text-sm ${countingLabelClass}`}>{label}</div>

      {awaitingStart ? (
        <>
          {/* Start-available: one consequence + Start. Help waits until after Start;
              leave only surfaces when the clock is critical. */}
          <CountingStartConsequence t={t} />
          <button
            type="button"
            onClick={onStart}
            className={`mt-2 w-full ${countingStartButtonClass} text-xs sm:text-sm`}
          >
            {t('game.counting_start')}
          </button>
          {leaveUrgent && showExits ? (
            <CountingLeaveExits
              t={t}
              onOfferDraw={onOfferDraw}
              onResign={onResign}
              resignLabelKey={resignLabelKey}
              confirmMessageKey={confirmMessageKey}
              leaveUrgent={leaveUrgent}
            />
          ) : null}
        </>
      ) : (
        <>
          {canStop && onStop ? (
            <button
              type="button"
              onClick={onStop}
              className={`mt-2 w-full ${countingStopButtonClass} text-xs sm:text-sm`}
            >
              {t('game.counting_stop')}
            </button>
          ) : null}

          <CountingHelpDisclosure t={t} />

          {showExits ? (
            <CountingLeaveExits
              t={t}
              onOfferDraw={onOfferDraw}
              onResign={onResign}
              resignLabelKey={resignLabelKey}
              confirmMessageKey={confirmMessageKey}
              leaveUrgent={leaveUrgent}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
