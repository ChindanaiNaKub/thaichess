import { MakrukChromeIcon } from './MakrukChromeIcon';

export type GameOverOutcome = 'win' | 'loss' | 'draw';

type GameOverOutcomeMarkProps = {
  outcome: GameOverOutcome;
  size?: number;
};

/** Felt Table endgame seal — bia-family geometry, State Gold / danger (not Western score glyphs). */
export function GameOverOutcomeMark({ outcome, size = 56 }: GameOverOutcomeMarkProps) {
  const tone =
    outcome === 'loss'
      ? 'border-danger/40 bg-danger/10 text-danger'
      : 'border-gold/45 bg-gold/12 text-gold';

  return (
    <div
      data-testid="game-over-outcome-mark"
      data-outcome={outcome}
      aria-hidden="true"
      className={`mx-auto flex items-center justify-center rounded-full border ${tone}`}
      style={{ width: size, height: size }}
    >
      <MakrukChromeIcon size={Math.round(size * 0.62)} className="text-current">
        {outcome === 'win' ? (
          <>
            {/* Settled bia seed — the piece stands on the cloth */}
            <ellipse cx="40" cy="46" rx="15" ry="17" />
            <path d="M40 24 v12" />
            <path d="M28 36 Q40 28 52 36" />
          </>
        ) : null}
        {outcome === 'loss' ? (
          <>
            {/* Open ring — the table goes quiet */}
            <circle cx="40" cy="40" r="18" />
            <path d="M28 50 Q40 58 52 50" />
          </>
        ) : null}
        {outcome === 'draw' ? (
          <>
            {/* Shared mid-line — neither side claims the cloth */}
            <path d="M20 40 H60" />
            <circle cx="32" cy="40" r="4" fill="currentColor" stroke="none" />
            <circle cx="48" cy="40" r="4" fill="currentColor" stroke="none" />
          </>
        ) : null}
      </MakrukChromeIcon>
    </div>
  );
}
