export type BotPublicStrengthLabel =
  | 'New'
  | 'Beginner'
  | 'Casual'
  | 'Intermediate'
  | 'Advanced'
  | 'Expert'
  | 'Master';

export interface BotCalibrationTarget {
  displayedRating: number;
  publicLabel: BotPublicStrengthLabel;
  expectedMistakesPer30: number;
  tacticalDepth: number;
  blunderRate: number;
  openingQuality: number;
  endgameAccuracy: number;
}

export interface BotLevelConfig extends BotCalibrationTarget {
  maxDepth: number;
  maxNodes: number;
  maxMs: number;
  rootBreadth: number;
  replyBreadth: number;
  choiceWindow: number;
  randomPickChance: number;
  noise: number;
  allowExternalEngine: boolean;
  styleInfluence: number;
  styleCap: number;
  evaluationSharpness: number;
  defenseAwareness: number;
  conversionTechnique: number;
  captureGreed: number;
  passiveBias: number;
  bucketWeights: {
    best: number;
    solid: number;
    inaccuracy: number;
    mistake: number;
    blunder: number;
  };
}

const BOT_LEVEL_CONFIGS: readonly BotLevelConfig[] = [
  {
    displayedRating: 420,
    publicLabel: 'New',
    expectedMistakesPer30: 18,
    tacticalDepth: 1,
    blunderRate: 0.24,
    openingQuality: 0.2,
    endgameAccuracy: 0.18,
    maxDepth: 1,
    maxNodes: 36,
    maxMs: 16,
    rootBreadth: 10,
    replyBreadth: 3,
    choiceWindow: 3,
    randomPickChance: 0.92,
    noise: 180,
    allowExternalEngine: false,
    styleInfluence: 0.12,
    styleCap: 12,
    evaluationSharpness: 0.34,
    defenseAwareness: 0.16,
    conversionTechnique: 0.14,
    captureGreed: 0.92,
    passiveBias: 0.54,
    bucketWeights: {
      best: 0.08,
      solid: 0.2,
      inaccuracy: 0.28,
      mistake: 0.27,
      blunder: 0.17,
    },
  },
  {
    displayedRating: 560,
    publicLabel: 'Beginner',
    expectedMistakesPer30: 15,
    tacticalDepth: 1,
    blunderRate: 0.18,
    openingQuality: 0.28,
    endgameAccuracy: 0.24,
    maxDepth: 1,
    maxNodes: 52,
    maxMs: 18,
    rootBreadth: 10,
    replyBreadth: 3,
    choiceWindow: 3,
    randomPickChance: 0.82,
    noise: 150,
    allowExternalEngine: false,
    styleInfluence: 0.14,
    styleCap: 14,
    evaluationSharpness: 0.4,
    defenseAwareness: 0.22,
    conversionTechnique: 0.2,
    captureGreed: 0.84,
    passiveBias: 0.46,
    bucketWeights: {
      best: 0.12,
      solid: 0.26,
      inaccuracy: 0.27,
      mistake: 0.23,
      blunder: 0.12,
    },
  },
  {
    displayedRating: 760,
    publicLabel: 'Beginner',
    expectedMistakesPer30: 12,
    tacticalDepth: 1,
    blunderRate: 0.11,
    openingQuality: 0.42,
    endgameAccuracy: 0.35,
    maxDepth: 1,
    maxNodes: 80,
    maxMs: 24,
    rootBreadth: 9,
    replyBreadth: 4,
    choiceWindow: 3,
    randomPickChance: 0.66,
    noise: 116,
    allowExternalEngine: false,
    styleInfluence: 0.16,
    styleCap: 16,
    evaluationSharpness: 0.48,
    defenseAwareness: 0.34,
    conversionTechnique: 0.28,
    captureGreed: 0.7,
    passiveBias: 0.35,
    bucketWeights: {
      best: 0.18,
      solid: 0.31,
      inaccuracy: 0.25,
      mistake: 0.18,
      blunder: 0.08,
    },
  },
  {
    displayedRating: 980,
    publicLabel: 'Casual',
    expectedMistakesPer30: 9,
    tacticalDepth: 2,
    blunderRate: 0.07,
    openingQuality: 0.56,
    endgameAccuracy: 0.48,
    maxDepth: 2,
    maxNodes: 130,
    maxMs: 36,
    rootBreadth: 8,
    replyBreadth: 4,
    choiceWindow: 2,
    randomPickChance: 0.44,
    noise: 82,
    allowExternalEngine: false,
    styleInfluence: 0.18,
    styleCap: 18,
    evaluationSharpness: 0.58,
    defenseAwareness: 0.48,
    conversionTechnique: 0.42,
    captureGreed: 0.56,
    passiveBias: 0.24,
    bucketWeights: {
      best: 0.28,
      solid: 0.38,
      inaccuracy: 0.2,
      mistake: 0.1,
      blunder: 0.04,
    },
  },
  {
    displayedRating: 1120,
    publicLabel: 'Casual',
    expectedMistakesPer30: 7,
    tacticalDepth: 2,
    blunderRate: 0.05,
    openingQuality: 0.62,
    endgameAccuracy: 0.56,
    maxDepth: 2,
    maxNodes: 200,
    maxMs: 44,
    rootBreadth: 8,
    replyBreadth: 4,
    choiceWindow: 2,
    randomPickChance: 0.32,
    noise: 58,
    allowExternalEngine: false,
    styleInfluence: 0.2,
    styleCap: 20,
    evaluationSharpness: 0.64,
    defenseAwareness: 0.58,
    conversionTechnique: 0.54,
    captureGreed: 0.45,
    passiveBias: 0.16,
    bucketWeights: {
      best: 0.34,
      solid: 0.4,
      inaccuracy: 0.16,
      mistake: 0.07,
      blunder: 0.03,
    },
  },
  {
    displayedRating: 1360,
    publicLabel: 'Intermediate',
    expectedMistakesPer30: 5,
    tacticalDepth: 2,
    blunderRate: 0.03,
    openingQuality: 0.72,
    endgameAccuracy: 0.66,
    maxDepth: 2,
    maxNodes: 300,
    maxMs: 58,
    rootBreadth: 8,
    replyBreadth: 5,
    choiceWindow: 2,
    randomPickChance: 0.2,
    noise: 34,
    allowExternalEngine: false,
    styleInfluence: 0.22,
    styleCap: 22,
    evaluationSharpness: 0.74,
    defenseAwareness: 0.68,
    conversionTechnique: 0.66,
    captureGreed: 0.34,
    passiveBias: 0.1,
    bucketWeights: {
      best: 0.42,
      solid: 0.4,
      inaccuracy: 0.12,
      mistake: 0.05,
      blunder: 0.01,
    },
  },
  {
    displayedRating: 1520,
    publicLabel: 'Intermediate',
    expectedMistakesPer30: 4,
    tacticalDepth: 2,
    blunderRate: 0.02,
    openingQuality: 0.8,
    endgameAccuracy: 0.74,
    maxDepth: 2,
    maxNodes: 440,
    maxMs: 74,
    rootBreadth: 9,
    replyBreadth: 5,
    choiceWindow: 2,
    randomPickChance: 0.12,
    noise: 18,
    allowExternalEngine: false,
    styleInfluence: 0.24,
    styleCap: 24,
    evaluationSharpness: 0.84,
    defenseAwareness: 0.78,
    conversionTechnique: 0.76,
    captureGreed: 0.22,
    passiveBias: 0.06,
    bucketWeights: {
      best: 0.5,
      solid: 0.35,
      inaccuracy: 0.1,
      mistake: 0.04,
      blunder: 0.01,
    },
  },
  {
    displayedRating: 1660,
    publicLabel: 'Advanced',
    expectedMistakesPer30: 3,
    tacticalDepth: 3,
    blunderRate: 0.01,
    openingQuality: 0.86,
    endgameAccuracy: 0.82,
    maxDepth: 3,
    maxNodes: 700,
    maxMs: 96,
    rootBreadth: 9,
    replyBreadth: 5,
    choiceWindow: 1,
    randomPickChance: 0.05,
    noise: 10,
    allowExternalEngine: false,
    styleInfluence: 0.28,
    styleCap: 28,
    evaluationSharpness: 0.92,
    defenseAwareness: 0.86,
    conversionTechnique: 0.84,
    captureGreed: 0.14,
    passiveBias: 0.03,
    bucketWeights: {
      best: 0.6,
      solid: 0.29,
      inaccuracy: 0.07,
      mistake: 0.03,
      blunder: 0.01,
    },
  },
  {
    displayedRating: 1810,
    publicLabel: 'Expert',
    expectedMistakesPer30: 2,
    tacticalDepth: 3,
    blunderRate: 0.01,
    openingQuality: 0.92,
    endgameAccuracy: 0.9,
    maxDepth: 3,
    maxNodes: 960,
    maxMs: 126,
    rootBreadth: 10,
    replyBreadth: 6,
    choiceWindow: 1,
    randomPickChance: 0.02,
    noise: 4,
    allowExternalEngine: false,
    styleInfluence: 0.32,
    styleCap: 30,
    evaluationSharpness: 0.97,
    defenseAwareness: 0.93,
    conversionTechnique: 0.91,
    captureGreed: 0.08,
    passiveBias: 0.02,
    bucketWeights: {
      best: 0.7,
      solid: 0.23,
      inaccuracy: 0.05,
      mistake: 0.02,
      blunder: 0,
    },
  },
  {
    displayedRating: 1940,
    publicLabel: 'Master',
    expectedMistakesPer30: 1,
    tacticalDepth: 3,
    blunderRate: 0,
    openingQuality: 0.96,
    endgameAccuracy: 0.95,
    maxDepth: 3,
    maxNodes: 1240,
    maxMs: 152,
    rootBreadth: 10,
    replyBreadth: 6,
    choiceWindow: 1,
    randomPickChance: 0,
    noise: 0,
    allowExternalEngine: true,
    styleInfluence: 0.36,
    styleCap: 32,
    evaluationSharpness: 1,
    defenseAwareness: 0.98,
    conversionTechnique: 0.96,
    captureGreed: 0.04,
    passiveBias: 0.01,
    bucketWeights: {
      best: 0.8,
      solid: 0.17,
      inaccuracy: 0.03,
      mistake: 0,
      blunder: 0,
    },
  },
] as const;

export function clampBotLevel(level: number): number {
  if (!Number.isFinite(level)) return 5;
  return Math.min(10, Math.max(1, Math.round(level)));
}

export function getBotLevelConfig(level: number): BotLevelConfig {
  return BOT_LEVEL_CONFIGS[clampBotLevel(level) - 1];
}

export function getBotDisplayedStrength(level: number): { rating: number; label: BotPublicStrengthLabel } {
  const config = getBotLevelConfig(level);
  return {
    rating: config.displayedRating,
    label: config.publicLabel,
  };
}

export function getAllBotLevelConfigs(): readonly BotLevelConfig[] {
  return BOT_LEVEL_CONFIGS;
}
