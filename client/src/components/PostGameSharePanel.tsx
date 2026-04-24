import { useEffect, useMemo, useRef, useState } from 'react';
import { getClassificationColor, type MoveClassification } from '@shared/analysis';
import type { Board as BoardType, GameMode, Move, PieceColor, RatingChangeSummary, ResultReason, TimeControl } from '@shared/types';
import { useGameAnalysis } from '../hooks/useGameAnalysis';
import { getGameModeLabel, getPlayerOutcome, getPlayerOutcomeLabel, getResultReasonLabel, getResultScore, getSideLabel, formatTimeControl } from '../lib/gamePresentation';
import { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH, downloadShareCardBlob, renderShareCardBlob, shareShareCardBlob } from '../lib/shareCardExport';
import { useTranslation } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import ShareCardExportCanvas, { type GameShareCardData, type ShareCardSummaryStat, type ShareCardVariant } from './ShareCardExportCanvas';

interface PostGameSharePanelProps {
  analysisId?: string | null;
  board: BoardType;
  lastMove: Move | null;
  moves: Move[];
  moveCount: number;
  playerColor: PieceColor;
  whitePlayerName: string;
  blackPlayerName: string;
  winner: PieceColor | null;
  resultReason: ResultReason | string | null;
  gameMode: GameMode;
  rated?: boolean;
  timeControl?: TimeControl | null;
  ratingChange?: RatingChangeSummary | null;
}

const PREVIEW_SCALE = 0.21;
const PREVIEW_WIDTH = SHARE_CARD_WIDTH * PREVIEW_SCALE;
const PREVIEW_HEIGHT = SHARE_CARD_HEIGHT * PREVIEW_SCALE;
const PREVIEW_FALLBACK_VARIANT: ShareCardVariant = 'result';

export default function PostGameSharePanel({
  analysisId,
  board,
  lastMove,
  moves,
  moveCount,
  playerColor,
  whitePlayerName,
  blackPlayerName,
  winner,
  resultReason,
  gameMode,
  rated = false,
  timeControl = null,
  ratingChange = null,
}: PostGameSharePanelProps) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const exportRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<ShareCardVariant>('result');
  const [actionLabel, setActionLabel] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'download' | 'share' | null>(null);
  const { analysis, analyzing, error } = useGameAnalysis({
    enabled: moves.length > 0 && Boolean(user) && !authLoading,
    analysisId,
    moves,
  });
  const analysisAuthRequired = moves.length > 0 && !authLoading && !user;

  const whiteName = whitePlayerName.trim() || t('common.white');
  const blackName = blackPlayerName.trim() || t('common.black');
  const userName = playerColor === 'white' ? whiteName : blackName;
  const opponentName = playerColor === 'white' ? blackName : whiteName;
  const outcome = getPlayerOutcome(winner, playerColor);
  const metadata = useMemo(() => {
    const items = [
      { label: t('sharecard.mode'), value: getGameModeLabel(gameMode, rated, t) },
      typeof timeControl?.initial === 'number'
        ? { label: t('sharecard.time_control'), value: formatTimeControl(timeControl.initial, timeControl.increment) }
        : null,
      moveCount > 0 ? { label: t('sharecard.moves'), value: String(moveCount) } : null,
    ];

    return items.filter(Boolean) as { label: string; value: string }[];
  }, [gameMode, moveCount, rated, t, timeControl]);

  const summaryStats = useMemo<ShareCardSummaryStat[]>(() => {
    if (!analysis) return [];

    const summary = playerColor === 'white' ? analysis.summary.white : analysis.summary.black;
    const preferred: MoveClassification[] = ['brilliant', 'best', 'excellent', 'good', 'inaccuracy'];

    return preferred
      .map((classification) => ({
        classification,
        label: t(`analysis.${classification}`),
        count: summary[classification],
        color: getClassificationColor(classification),
      }))
      .filter((item) => item.count > 0);
  }, [analysis, playerColor, t]);

  const userRatingChange = useMemo(() => {
    if (!ratingChange) return null;

    const before = playerColor === 'white' ? ratingChange.whiteBefore : ratingChange.blackBefore;
    const after = playerColor === 'white' ? ratingChange.whiteAfter : ratingChange.blackAfter;

    return {
      before,
      after,
      delta: after - before,
    };
  }, [playerColor, ratingChange]);

  const cardData = useMemo<GameShareCardData>(() => ({
    outcome,
    outcomeLabel: getPlayerOutcomeLabel(winner, playerColor, t),
    score: getResultScore(winner),
    reasonLabel: getResultReasonLabel(resultReason, t),
    userColor: playerColor,
    userName,
    opponentName,
    whiteName,
    blackName,
    sideLabel: getSideLabel(playerColor, t),
    board,
    lastMove,
    whiteAccuracy: analysis ? Math.round(analysis.whiteAccuracy) : null,
    blackAccuracy: analysis ? Math.round(analysis.blackAccuracy) : null,
    summaryStats,
    ratingChange: userRatingChange,
    metadata,
  }), [
    analysis,
    blackName,
    board,
    lastMove,
    metadata,
    opponentName,
    outcome,
    playerColor,
    resultReason,
    summaryStats,
    t,
    userName,
    userRatingChange,
    whiteName,
    winner,
  ]);

  const canUseAccuracyVariant = Boolean(analysis);
  const canUseRatingVariant = Boolean(userRatingChange);
  useEffect(() => {
    const selectedVariantAvailable = variant === 'result'
      || (variant === 'accuracy' && canUseAccuracyVariant)
      || (variant === 'rating' && canUseRatingVariant);

    if (selectedVariantAvailable) return;
    setVariant(PREVIEW_FALLBACK_VARIANT);
  }, [canUseAccuracyVariant, canUseRatingVariant, variant]);

  const filename = `${(analysisId ?? `${gameMode}-${moveCount}`).replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()}-${variant}.png`;
  const shareText = `${userName} ${cardData.outcomeLabel.toLowerCase()} ${cardData.score}`;

  const handleDownload = async () => {
    if (!exportRef.current) return;

    try {
      setBusyAction('download');
      setActionLabel(null);
      const blob = await renderShareCardBlob(exportRef.current);
      downloadShareCardBlob(blob, filename);
      setActionLabel(t('sharecard.download_ready'));
    } catch {
      setActionLabel(t('sharecard.export_failed'));
    } finally {
      setBusyAction(null);
    }
  };

  const handleShare = async () => {
    if (!exportRef.current) return;

    try {
      setBusyAction('share');
      setActionLabel(null);
      const blob = await renderShareCardBlob(exportRef.current);
      const shared = await shareShareCardBlob(blob, filename, 'ThaiChess', shareText);

      if (shared) {
        setActionLabel(t('sharecard.share_ready'));
        return;
      }

      downloadShareCardBlob(blob, filename);
      setActionLabel(t('sharecard.download_ready'));
    } catch {
      setActionLabel(t('sharecard.export_failed'));
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="min-w-0 rounded-xl border border-surface-hover bg-surface-alt/90 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            {t('sharecard.eyebrow')}
          </div>
          <div className="mt-1 text-sm font-semibold text-text-bright">
            {t('sharecard.title')}
          </div>
          <div className="mt-1 text-xs text-text-dim">
            {t('sharecard.desc')}
          </div>
        </div>
        <div className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
          outcome === 'win'
            ? 'bg-primary/15 text-primary-light'
            : outcome === 'loss'
              ? 'bg-danger/10 text-danger'
              : 'bg-accent/15 text-accent'
        }`}>
          {cardData.outcomeLabel}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <VariantButton
          active={variant === 'result'}
          disabled={false}
          label={t('sharecard.variant_result')}
          onClick={() => setVariant('result')}
        />
        <VariantButton
          active={variant === 'accuracy'}
          disabled={!canUseAccuracyVariant}
          label={t('sharecard.variant_accuracy')}
          onClick={() => setVariant('accuracy')}
        />
        <VariantButton
          active={variant === 'rating'}
          disabled={!canUseRatingVariant}
          label={t('sharecard.variant_rating')}
          onClick={() => setVariant('rating')}
        />
      </div>

      <div className="mt-4 min-w-0 overflow-hidden rounded-[24px] border border-white/10 bg-[#120d0a]">
        <div className="flex justify-center overflow-hidden p-3" style={{ height: `${PREVIEW_HEIGHT + 24}px` }}>
          <div
            className="relative shrink overflow-hidden"
            data-testid="share-card-preview-viewport"
            style={{
              width: `${PREVIEW_WIDTH}px`,
              maxWidth: '100%',
              height: `${PREVIEW_HEIGHT}px`,
            }}
          >
            <div
              className="absolute left-1/2 top-0 origin-top"
              style={{
                width: `${SHARE_CARD_WIDTH}px`,
                height: `${SHARE_CARD_HEIGHT}px`,
                transform: `translateX(-50%) scale(${PREVIEW_SCALE})`,
              }}
            >
              <ShareCardExportCanvas variant={variant} data={cardData} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-text-dim">
          {variant === 'accuracy' && !canUseAccuracyVariant
            ? analyzing
              ? t('sharecard.accuracy_pending')
              : analysisAuthRequired
                ? t('sharecard.accuracy_sign_in')
                : error
                ? t('sharecard.accuracy_unavailable')
                : t('sharecard.accuracy_pending')
            : variant === 'rating' && !canUseRatingVariant
              ? t('sharecard.rating_unavailable')
              : t('sharecard.export_hint')}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownload}
            disabled={busyAction !== null}
            className="rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm font-semibold text-text-bright transition-colors hover:bg-surface-hover disabled:opacity-60"
          >
            {busyAction === 'download' ? t('sharecard.exporting') : t('sharecard.download_png')}
          </button>
          <button
            onClick={handleShare}
            disabled={busyAction !== null}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-60"
          >
            {busyAction === 'share' ? t('sharecard.exporting') : t('sharecard.share_image')}
          </button>
        </div>
      </div>

      {actionLabel && (
        <div className="mt-3 rounded-lg border border-surface-hover bg-surface px-3 py-2 text-xs text-text-dim">
          {actionLabel}
        </div>
      )}

      <div className="fixed left-[-200vw] top-0 pointer-events-none" aria-hidden="true">
        <div ref={exportRef}>
          <ShareCardExportCanvas variant={variant} data={cardData} />
        </div>
      </div>
    </div>
  );
}

function VariantButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
        active
          ? 'border-primary/30 bg-primary/15 text-primary-light'
          : 'border-surface-hover bg-surface text-text-dim hover:text-text-bright'
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {label}
    </button>
  );
}
