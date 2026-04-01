import { BOT_PERSONAS } from './botPersonas';
import {
  classifyMove,
  evaluatePosition,
  findBestMove,
  getMoveQualityWinPercents,
  moveAccuracyFromWinPercent,
} from './analysis';
import { createInitialGameState, getAllPieces, getLegalMoves, makeMove } from './engine';
import { getBotDisplayedRating, getBotLevelConfig, getBotMoveForLevel } from './botEngine';
import { deserializeAnalysisPosition, uciToMove } from './engineAdapter';
import type { GameState, PieceColor, Position } from './types';

type BenchmarkCategory = 'opening' | 'human' | 'tactical' | 'endgame';
type MatchResult = 'white' | 'black' | 'draw';

interface BenchmarkCase {
  id: string;
  label: string;
  category: BenchmarkCategory;
  state: GameState;
}

interface BenchmarkSummary {
  averageAccuracy: number;
  bestRate: number;
  mistakeRate: number;
  blunderRate: number;
}

interface BeginnerValidationSummary {
  games: number;
  botScoreRate: number;
  botWinRate: number;
}

export interface BotCalibrationRow {
  id: string;
  name: string;
  level: number;
  displayedRating: number;
  publicLabel: string;
  observedRating: number;
  roundRobinRating: number;
  verdict: 'aligned' | 'overrated' | 'underrated';
  recommendedRating: number;
  recommendation: string;
  target: {
    expectedMistakesPer30: number;
    tacticalDepth: number;
    blunderRate: number;
    openingQuality: number;
    endgameAccuracy: number;
  };
  benchmarks: Record<BenchmarkCategory, BenchmarkSummary>;
  weightedBenchmarkScore: number;
  beginnerValidation: BeginnerValidationSummary | null;
}

export interface BotCalibrationReport {
  rows: BotCalibrationRow[];
  gamesPlayed: number;
  benchmarkCount: number;
}

export interface BotCalibrationOptions {
  benchmarkDepth?: number;
  gamesPerPairing?: number;
  maxPlies?: number;
  openingRandomPlies?: number;
  beginnerValidationGames?: number;
  personaIds?: string[];
  benchmarkIds?: string[];
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value += 0x6D2B79F5;
    let next = Math.imul(value ^ (value >>> 15), value | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function createStateFromSnapshot(position: string): GameState {
  const snapshot = deserializeAnalysisPosition(position);
  if (!snapshot) {
    throw new Error(`Invalid calibration position: ${position}`);
  }

  const base = createInitialGameState(0, 0);
  return {
    ...base,
    board: snapshot.board.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
    turn: snapshot.turn,
    counting: snapshot.counting ? { ...snapshot.counting } : null,
  };
}

function applyMoveSequence(moves: string[]): GameState {
  let state = createInitialGameState(0, 0);

  for (const uci of moves) {
    const move = uciToMove(uci);
    if (!move) {
      throw new Error(`Invalid UCI move in calibration sequence: ${uci}`);
    }

    const next = makeMove(state, move.from, move.to);
    if (!next) {
      throw new Error(`Illegal calibration move sequence step: ${uci}`);
    }

    state = next;
  }

  return state;
}

function buildBenchmarkSuite(): BenchmarkCase[] {
  return [
    {
      id: 'opening-start',
      label: 'Initial position development',
      category: 'opening',
      state: createInitialGameState(0, 0),
    },
    {
      id: 'opening-shape',
      label: 'Early structure with minor-piece development',
      category: 'opening',
      state: applyMoveSequence(['d3d4', 'd6d5', 'b1d2', 'g8e7', 'c3c4', 'f6f5']),
    },
    {
      id: 'human-greed-trap',
      label: 'Greedy rook capture trap',
      category: 'human',
      state: createStateFromSnapshot('3r3k/3p4/8/8/8/2N5/8/K2R4 w'),
    },
    {
      id: 'human-under-pressure',
      label: 'Loose rook under direct pressure',
      category: 'human',
      state: createStateFromSnapshot('7k/8/3r4/8/8/2N5/8/K2R4 w'),
    },
    {
      id: 'tactic-hanging-rook',
      label: 'Take the hanging rook',
      category: 'tactical',
      state: createStateFromSnapshot('7k/3r4/8/8/8/2N5/8/K2R4 w'),
    },
    {
      id: 'tactic-loose-knight',
      label: 'Punish the loose minor piece',
      category: 'tactical',
      state: createStateFromSnapshot('7k/8/5n2/4R3/8/8/8/K7 w'),
    },
    {
      id: 'endgame-rook-conversion',
      label: 'Simple rook conversion',
      category: 'endgame',
      state: createStateFromSnapshot('8/6k1/8/4R3/8/8/2K5/8 w'),
    },
    {
      id: 'endgame-pawn-technique',
      label: 'Extra pawn king ending',
      category: 'endgame',
      state: createStateFromSnapshot('8/5k2/8/3P4/2K5/8/8/8 w'),
    },
  ];
}

function round(value: number): number {
  return Math.round(value);
}

function summarizeBucket(values: number[]): BenchmarkSummary {
  if (values.length === 0) {
    return {
      averageAccuracy: 0,
      bestRate: 0,
      mistakeRate: 0,
      blunderRate: 0,
    };
  }

  const bests = values.filter((value) => value >= 99).length;
  const mistakes = values.filter((value) => value < 75 && value >= 50).length;
  const blunders = values.filter((value) => value < 50).length;

  return {
    averageAccuracy: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    bestRate: round((bests / values.length) * 100),
    mistakeRate: round((mistakes / values.length) * 100),
    blunderRate: round((blunders / values.length) * 100),
  };
}

function getAllLegalMoves(state: GameState): { from: Position; to: Position }[] {
  const moves: { from: Position; to: Position }[] = [];

  for (const { pos } of getAllPieces(state.board, state.turn)) {
    for (const target of getLegalMoves(state.board, pos)) {
      moves.push({
        from: { ...pos },
        to: { ...target },
      });
    }
  }

  return moves;
}

function pickOpeningMove(state: GameState, randomFn: () => number): { from: Position; to: Position } | null {
  const legalMoves = getAllLegalMoves(state);
  if (legalMoves.length === 0) return null;

  const weightedMoves = legalMoves.map((move) => {
    const piece = state.board[move.from.row][move.from.col];
    const target = state.board[move.to.row][move.to.col];
    let score = 1;

    if (target) score += 4;
    if (piece?.type === 'K') score -= 2;
    if (move.to.col >= 2 && move.to.col <= 5 && move.to.row >= 2 && move.to.row <= 5) score += 2;

    return { move, score: Math.max(1, score) };
  });

  const total = weightedMoves.reduce((sum, entry) => sum + entry.score, 0);
  let threshold = randomFn() * total;

  for (const entry of weightedMoves) {
    threshold -= entry.score;
    if (threshold <= 0) {
      return entry.move;
    }
  }

  return weightedMoves[weightedMoves.length - 1]?.move ?? null;
}

function chooseBeginnerBaselineMove(state: GameState, randomFn: () => number): { from: Position; to: Position } | null {
  const legalMoves = getAllLegalMoves(state);
  if (legalMoves.length === 0) return null;

  const scored = legalMoves
    .map((move) => {
      const piece = state.board[move.from.row][move.from.col];
      const target = state.board[move.to.row][move.to.col];
      let score = 1;

      if (target) score += 5;
      if (piece?.type === 'K') score -= 3;
      if (piece?.type === 'N' || piece?.type === 'S') score += 2;
      if (move.to.col >= 2 && move.to.col <= 5 && move.to.row >= 2 && move.to.row <= 5) score += 2;
      if (move.to.row === move.from.row) score -= 1;

      return { move, score: Math.max(1, score) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const total = scored.reduce((sum, entry) => sum + entry.score, 0);
  let threshold = randomFn() * total;

  for (const entry of scored) {
    threshold -= entry.score;
    if (threshold <= 0) {
      return entry.move;
    }
  }

  return scored[scored.length - 1]?.move ?? null;
}

function estimateRatingsFromGames(
  games: Array<{ whiteId: string; blackId: string; result: MatchResult }>,
): Map<string, number> {
  const ratings = new Map(BOT_PERSONAS.map((persona) => [persona.id, persona.rating]));
  const k = 20;

  for (let pass = 0; pass < 10; pass += 1) {
    for (const game of games) {
      const whiteRating = ratings.get(game.whiteId) ?? 1500;
      const blackRating = ratings.get(game.blackId) ?? 1500;
      const expectedWhite = 1 / (1 + 10 ** ((blackRating - whiteRating) / 400));
      const actualWhite = game.result === 'white' ? 1 : game.result === 'draw' ? 0.5 : 0;
      const delta = k * (actualWhite - expectedWhite);
      ratings.set(game.whiteId, whiteRating + delta);
      ratings.set(game.blackId, blackRating - delta);
    }
  }

  return ratings;
}

function playCalibrationMatch(
  whiteBot: { level: number; id: string },
  blackBot: { level: number; id: string },
  seed: number,
  openingRandomPlies: number,
  maxPlies: number,
  blackUsesBaseline: boolean = false,
): MatchResult {
  const randomFn = mulberry32(seed);
  let state = createInitialGameState(0, 0);

  while (!state.gameOver && state.moveCount < maxPlies) {
    let move = null;

    if (state.moveCount < openingRandomPlies) {
      move = pickOpeningMove(state, randomFn);
    } else if (state.turn === 'white') {
      move = getBotMoveForLevel(state, whiteBot.level, { botId: whiteBot.id, randomFn });
    } else if (blackUsesBaseline) {
      move = chooseBeginnerBaselineMove(state, randomFn);
    } else {
      move = getBotMoveForLevel(state, blackBot.level, { botId: blackBot.id, randomFn });
    }

    if (!move) {
      break;
    }

    const next = makeMove(state, move.from, move.to);
    if (!next) {
      break;
    }

    state = next;
  }

  return state.winner ?? 'draw';
}

function getExpectedOpeningAccuracy(level: number): number {
  const profile = getBotLevelConfig(level);
  return round(28 + profile.openingQuality * 52);
}

function getExpectedEndgameAccuracy(level: number): number {
  const profile = getBotLevelConfig(level);
  return round(24 + profile.endgameAccuracy * 56);
}

function getExpectedTacticalAccuracy(level: number): number {
  const profile = getBotLevelConfig(level);
  return round(24 + (profile.tacticalDepth * 14) + ((1 - profile.blunderRate) * 18));
}

function buildRecommendation(
  level: number,
  observedRating: number,
  displayedRating: number,
  benchmarks: Record<BenchmarkCategory, BenchmarkSummary>,
  beginnerValidation: BeginnerValidationSummary | null,
): string {
  const notes: string[] = [];
  const tacticalTarget = getExpectedTacticalAccuracy(level);
  const openingTarget = getExpectedOpeningAccuracy(level);
  const endgameTarget = getExpectedEndgameAccuracy(level);

  if (benchmarks.tactical.averageAccuracy > tacticalTarget + 8) {
    notes.push('Still too tactically clean for the displayed strength.');
  } else if (benchmarks.tactical.averageAccuracy < tacticalTarget - 12) {
    notes.push('Missing more basic tactics than the label suggests.');
  }

  if (benchmarks.opening.averageAccuracy > openingTarget + 8) {
    notes.push('Opening play is more principled than this tier should show.');
  }

  if (benchmarks.endgame.averageAccuracy > endgameTarget + 8) {
    notes.push('Endgame conversion is too reliable for this level.');
  }

  if (beginnerValidation && beginnerValidation.botScoreRate > 0.72) {
    notes.push('This bot still punishes the beginner baseline too consistently.');
  }

  if (notes.length === 0) {
    if (observedRating >= displayedRating + 75) {
      return 'Raise the displayed rating or weaken tactical punishment slightly.';
    }
    if (observedRating <= displayedRating - 75) {
      return 'Lower the displayed rating or restore a little consistency.';
    }
    return 'Current tuning is aligned closely enough to keep the displayed rating.';
  }

  return notes[0];
}

export function createBotCalibrationReport(options: BotCalibrationOptions = {}): BotCalibrationReport {
  const benchmarkDepth = options.benchmarkDepth ?? 3;
  const gamesPerPairing = options.gamesPerPairing ?? 2;
  const maxPlies = options.maxPlies ?? 72;
  const openingRandomPlies = options.openingRandomPlies ?? 4;
  const beginnerValidationGames = options.beginnerValidationGames ?? 6;
  const personas = options.personaIds?.length
    ? BOT_PERSONAS.filter((persona) => options.personaIds?.includes(persona.id))
    : BOT_PERSONAS;
  const benchmarks = options.benchmarkIds?.length
    ? buildBenchmarkSuite().filter((benchmark) => options.benchmarkIds?.includes(benchmark.id))
    : buildBenchmarkSuite();
  const roundRobinGames: Array<{ whiteId: string; blackId: string; result: MatchResult }> = [];

  for (let whiteIndex = 0; whiteIndex < personas.length; whiteIndex += 1) {
    for (let blackIndex = whiteIndex + 1; blackIndex < personas.length; blackIndex += 1) {
      const whitePersona = personas[whiteIndex];
      const blackPersona = personas[blackIndex];

      for (let gameIndex = 0; gameIndex < gamesPerPairing; gameIndex += 1) {
        const swapColors = gameIndex % 2 === 1;
        const seed = ((whiteIndex + 1) * 104729 + (blackIndex + 1) * 9187 + gameIndex * 31337) >>> 0;
        const result = swapColors
          ? playCalibrationMatch(
            { level: blackPersona.engine.level, id: blackPersona.id },
            { level: whitePersona.engine.level, id: whitePersona.id },
            seed,
            openingRandomPlies,
            maxPlies,
          )
          : playCalibrationMatch(
            { level: whitePersona.engine.level, id: whitePersona.id },
            { level: blackPersona.engine.level, id: blackPersona.id },
            seed,
            openingRandomPlies,
            maxPlies,
          );

        roundRobinGames.push(
          swapColors
            ? { whiteId: blackPersona.id, blackId: whitePersona.id, result }
            : { whiteId: whitePersona.id, blackId: blackPersona.id, result },
        );
      }
    }
  }

  const estimatedRatings = estimateRatingsFromGames(roundRobinGames);

  const rows: BotCalibrationRow[] = personas.map((persona, index) => {
    const level = persona.engine.level;
    const benchmarkScores = {
      opening: [] as number[],
      human: [] as number[],
      tactical: [] as number[],
      endgame: [] as number[],
    };

    for (const benchmark of benchmarks) {
      const state = {
        ...benchmark.state,
        board: benchmark.state.board.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
      };
      const chosenMove = getBotMoveForLevel(state, level, {
        botId: persona.id,
        randomFn: mulberry32(((index + 1) * 65537 + benchmark.id.length * 811) >>> 0),
      });
      const best = findBestMove(state, benchmarkDepth);

      if (!chosenMove || !best.move) {
        benchmarkScores[benchmark.category].push(0);
        continue;
      }

      const playedState = makeMove(state, chosenMove.from, chosenMove.to);
      if (!playedState) {
        benchmarkScores[benchmark.category].push(0);
        continue;
      }

      const playedEval = evaluatePosition(playedState.board, state.turn);
      const quality = getMoveQualityWinPercents(best.eval, playedEval, state.turn);
      const accuracy = moveAccuracyFromWinPercent(quality.best, quality.played);
      const classification = classifyMove(accuracy, Boolean(
        best.move.from.row === chosenMove.from.row
          && best.move.from.col === chosenMove.from.col
          && best.move.to.row === chosenMove.to.row
          && best.move.to.col === chosenMove.to.col,
      ));

      benchmarkScores[benchmark.category].push(classification === 'best' ? 100 : round(accuracy));
    }

    let beginnerValidation: BeginnerValidationSummary | null = null;
    if (level <= 2) {
      let botPoints = 0;
      let botWins = 0;

      for (let gameIndex = 0; gameIndex < beginnerValidationGames; gameIndex += 1) {
        const result = playCalibrationMatch(
          { level, id: persona.id },
          { level: 1, id: persona.id },
          ((index + 1) * 12347 + gameIndex * 97) >>> 0,
          4,
          64,
          true,
        );

        if (result === 'white') {
          botPoints += 1;
          botWins += 1;
        } else if (result === 'draw') {
          botPoints += 0.5;
        }
      }

      beginnerValidation = {
        games: beginnerValidationGames,
        botScoreRate: Number((botPoints / beginnerValidationGames).toFixed(2)),
        botWinRate: Number((botWins / beginnerValidationGames).toFixed(2)),
      };
    }

    const summarizedBenchmarks = {
      opening: summarizeBucket(benchmarkScores.opening),
      human: summarizeBucket(benchmarkScores.human),
      tactical: summarizeBucket(benchmarkScores.tactical),
      endgame: summarizeBucket(benchmarkScores.endgame),
    };
    const weightedBenchmarkScore = round(
      (summarizedBenchmarks.opening.averageAccuracy * 0.18)
      + (summarizedBenchmarks.human.averageAccuracy * 0.28)
      + (summarizedBenchmarks.tactical.averageAccuracy * 0.32)
      + (summarizedBenchmarks.endgame.averageAccuracy * 0.22),
    );
    const roundRobinRating = round(estimatedRatings.get(persona.id) ?? persona.rating);
    const beginnerAdjustment = beginnerValidation ? (beginnerValidation.botScoreRate - 0.62) * 120 : 0;
    const observedRating = round(roundRobinRating + ((weightedBenchmarkScore - 72) * 2.1) + beginnerAdjustment);
    const displayedRating = getBotDisplayedRating(level);
    const verdict: BotCalibrationRow['verdict'] = observedRating >= displayedRating + 75
      ? 'underrated'
      : observedRating <= displayedRating - 75
        ? 'overrated'
        : 'aligned';
    const recommendedRating = round(observedRating / 20) * 20;
    const profile = getBotLevelConfig(level);

    return {
      id: persona.id,
      name: persona.name,
      level,
      displayedRating,
      publicLabel: profile.publicLabel,
      observedRating,
      roundRobinRating,
      verdict,
      recommendedRating,
      recommendation: buildRecommendation(level, observedRating, displayedRating, summarizedBenchmarks, beginnerValidation),
      target: {
        expectedMistakesPer30: profile.expectedMistakesPer30,
        tacticalDepth: profile.tacticalDepth,
        blunderRate: profile.blunderRate,
        openingQuality: profile.openingQuality,
        endgameAccuracy: profile.endgameAccuracy,
      },
      benchmarks: summarizedBenchmarks,
      weightedBenchmarkScore,
      beginnerValidation,
    };
  }).sort((a, b) => a.displayedRating - b.displayedRating);

  return {
    rows,
    gamesPlayed: roundRobinGames.length,
    benchmarkCount: benchmarks.length,
  };
}
