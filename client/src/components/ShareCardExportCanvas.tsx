import type { MoveClassification } from '@shared/analysis';
import type { Board as BoardType, Move, PieceColor } from '@shared/types';
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from '../lib/shareCardExport';
import { useTranslation } from '../lib/i18n';
import BoardSnapshot from './BoardSnapshot';

export type ShareCardVariant = 'result' | 'accuracy' | 'rating';

export interface ShareCardStat {
  label: string;
  value: string;
}

export interface ShareCardSummaryStat {
  classification: MoveClassification;
  label: string;
  count: number;
  color: string;
}

export interface GameShareCardData {
  outcome: 'win' | 'loss' | 'draw';
  outcomeLabel: string;
  score: string;
  reasonLabel: string | null;
  userColor: PieceColor;
  userName: string;
  opponentName: string;
  whiteName: string;
  blackName: string;
  sideLabel: string;
  board: BoardType;
  lastMove: Move | null;
  whiteAccuracy: number | null;
  blackAccuracy: number | null;
  summaryStats: ShareCardSummaryStat[];
  ratingChange: {
    before: number;
    after: number;
    delta: number;
  } | null;
  metadata: ShareCardStat[];
}

const SAFE_MARGIN_X = 96;
const SAFE_MARGIN_Y = 76;
const BOARD_SIZE = 292;
const SERIF_DISPLAY = '"Iowan Old Style", "Palatino Linotype", "Noto Serif Thai", Georgia, serif';

function getAccent(outcome: GameShareCardData['outcome']) {
  switch (outcome) {
    case 'win':
      return {
        badge: 'bg-[#1d4b33] text-[#c7f2d1] border-[#77d894]/25',
        glow: 'rgba(74, 166, 103, 0.18)',
      };
    case 'loss':
      return {
        badge: 'bg-[#5c2b24] text-[#ffc2b8] border-[#ff9a89]/25',
        glow: 'rgba(198, 90, 67, 0.16)',
      };
    default:
      return {
        badge: 'bg-[#46361f] text-[#f2d493] border-[#e0bf6d]/24',
        glow: 'rgba(187, 151, 66, 0.16)',
      };
  }
}

function OutcomeBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.24em] ${className}`}>
      {label}
    </div>
  );
}

function Header({
  sideLabel,
  accentClass,
}: {
  sideLabel: string;
  accentClass: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <div className="text-[13px] font-semibold uppercase tracking-[0.34em] text-[#d3ab5d]">ThaiChess</div>
        <div className="mt-2 text-[17px] text-[#c8b9aa]">{t('sharecard.premium_label')}</div>
      </div>
      <div className={`shrink-0 rounded-full border px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.24em] ${accentClass}`}>
        {sideLabel}
      </div>
    </div>
  );
}

function PlayerIdentity({ data }: { data: GameShareCardData }) {
  const { t } = useTranslation();

  return (
    <div className="max-w-[420px]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-[#aa9888]">{t('sharecard.player_label')}</div>
      <div className="mt-5 truncate text-[56px] font-semibold leading-[0.9] text-[#fff6ed]">{data.userName}</div>
      <div className="mt-4 text-[22px] leading-[1.18] text-[#d8c7b8]">
        {t('sharecard.versus', { opponent: data.opponentName })}
      </div>
    </div>
  );
}

function ResultHero({
  data,
  accentClass,
}: {
  data: GameShareCardData;
  accentClass: string;
}) {
  return (
    <div className="max-w-[430px]">
      <OutcomeBadge label={data.outcomeLabel} className={accentClass} />
      <div
        className="mt-7 text-[112px] font-semibold leading-[0.84] tracking-[-0.03em] text-[#fff7ef]"
        style={{ fontFamily: SERIF_DISPLAY }}
      >
        {data.score}
      </div>
      {data.reasonLabel && (
        <div className="mt-4 text-[22px] leading-[1.18] text-[#d9c9ba]">{data.reasonLabel}</div>
      )}
    </div>
  );
}

function AccuracyHero({
  data,
  accentClass,
}: {
  data: GameShareCardData;
  accentClass: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="max-w-[440px]">
      <OutcomeBadge label={data.outcomeLabel} className={accentClass} />
      <div className="mt-6 text-[12px] uppercase tracking-[0.22em] text-[#aa9888]">{t('sharecard.accuracy_heading')}</div>
      <div
        className="mt-3 text-[82px] font-semibold leading-[0.9] tracking-[-0.03em] text-[#fff7ef]"
        style={{ fontFamily: SERIF_DISPLAY }}
      >
        {data.score}
      </div>
      <div className="mt-5 space-y-3 text-[18px] leading-[1.15] text-[#e8d8ca]">
        <div>{data.whiteName} {typeof data.whiteAccuracy === 'number' ? `${data.whiteAccuracy}%` : '--'}</div>
        <div>{data.blackName} {typeof data.blackAccuracy === 'number' ? `${data.blackAccuracy}%` : '--'}</div>
      </div>
    </div>
  );
}

function RatingHero({
  data,
  accentClass,
}: {
  data: GameShareCardData;
  accentClass: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="max-w-[440px]">
      <OutcomeBadge label={data.outcomeLabel} className={accentClass} />
      <div className="mt-6 text-[12px] uppercase tracking-[0.22em] text-[#aa9888]">{t('sharecard.rating_heading')}</div>
      <div
        className="mt-3 text-[82px] font-semibold leading-[0.9] tracking-[-0.03em] text-[#fff7ef]"
        style={{ fontFamily: SERIF_DISPLAY }}
      >
        {data.score}
      </div>
      {data.ratingChange && (
        <div className="mt-5 flex items-end gap-6 text-[#eadbcc]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#a89686]">{t('sharecard.before')}</div>
            <div className="mt-2 text-[28px] leading-none">{data.ratingChange.before}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#a89686]">Delta</div>
            <div className="mt-2 text-[32px] font-semibold leading-none">
              {data.ratingChange.delta >= 0 ? '+' : ''}{data.ratingChange.delta}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#a89686]">{t('sharecard.after')}</div>
            <div className="mt-2 text-[28px] leading-none">{data.ratingChange.after}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function BoardStage({
  data,
}: {
  data: GameShareCardData;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex w-full max-w-[320px] items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.24em] text-[#aa9888]">{t('sharecard.final_position')}</div>
      </div>
      <div className="mt-4">
        <BoardSnapshot
          board={data.board}
          playerColor={data.userColor}
          lastMove={data.lastMove}
          size={BOARD_SIZE}
        />
      </div>
    </div>
  );
}

export default function ShareCardExportCanvas({
  variant,
  data,
  className,
}: {
  variant: ShareCardVariant;
  data: GameShareCardData;
  className?: string;
}) {
  const accent = getAccent(data.outcome);

  return (
    <div
      className={`relative overflow-hidden rounded-[40px] border border-white/8 bg-[#18110d] text-[#f5ebde] ${className ?? ''}`}
      data-testid="share-card-export-canvas"
      style={{
        width: `${SHARE_CARD_WIDTH}px`,
        height: `${SHARE_CARD_HEIGHT}px`,
        backgroundImage: `
          radial-gradient(circle at 14% 26%, ${accent.glow}, transparent 26%),
          linear-gradient(135deg, #201713 0%, #17110d 52%, #221813 100%)
        `,
      }}
    >
      <div
        className="absolute"
        style={{
          top: `${SAFE_MARGIN_Y}px`,
          right: `${SAFE_MARGIN_X}px`,
          bottom: `${SAFE_MARGIN_Y}px`,
          left: `${SAFE_MARGIN_X}px`,
        }}
      >
        <div className="flex h-full flex-col">
          <Header sideLabel={data.sideLabel} accentClass={accent.badge} />

          <div className="grid flex-1 grid-cols-[minmax(0,1fr)_320px] items-center gap-20">
            <div className="flex flex-col justify-center">
              <PlayerIdentity data={data} />
              <div className="mt-10">
                {variant === 'accuracy' ? (
                  <AccuracyHero data={data} accentClass={accent.badge} />
                ) : variant === 'rating' ? (
                  <RatingHero data={data} accentClass={accent.badge} />
                ) : (
                  <ResultHero data={data} accentClass={accent.badge} />
                )}
              </div>
              <div className="mt-10 text-[18px] leading-none text-[#d7c7b8]">{data.whiteName} vs {data.blackName}</div>
            </div>

            <BoardStage data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
