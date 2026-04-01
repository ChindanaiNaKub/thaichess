export interface BotEstimatedEloRange {
  min: number;
  max: number | null;
  maxSuffix?: '+' | null;
}

export const botLevelToEstimatedEloMap: Record<number, BotEstimatedEloRange> = {
  1: { min: 300, max: 400 },
  2: { min: 400, max: 500 },
  3: { min: 500, max: 650 },
  4: { min: 650, max: 800 },
  5: { min: 800, max: 950 },
  6: { min: 950, max: 1100 },
  7: { min: 1100, max: 1250 },
  8: { min: 1250, max: 1450 },
  9: { min: 1450, max: 1650 },
  10: { min: 1650, max: 1900, maxSuffix: '+' },
};

function clampBotLevel(level: number): number {
  if (!Number.isFinite(level)) return 5;
  return Math.min(10, Math.max(1, Math.round(level)));
}

export function getBotEstimatedEloRange(level: number): BotEstimatedEloRange {
  return botLevelToEstimatedEloMap[clampBotLevel(level)];
}

export function formatBotEstimatedEloRange(level: number): string {
  const range = getBotEstimatedEloRange(level);
  const max = range.max === null
    ? `${range.min}+`
    : `${range.max}${range.maxSuffix ?? ''}`;
  return `${range.min}-${max}`;
}

export function formatBotLevelLabel(level: number): string {
  return `Level ${clampBotLevel(level)}`;
}
