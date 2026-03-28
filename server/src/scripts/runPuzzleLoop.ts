import fs from 'fs';
import path from 'path';

import { playSelfPlayGame } from '../../../shared/selfPlay';
import type { BotDifficulty } from '../../../shared/botEngine';
import {
  createDefaultGenerationSource,
  formatDraftAsPrettyJson,
  generatePuzzleCandidateDraftsFromMoveSequence,
} from '../../../shared/puzzleGeneration';

interface LoopOptions {
  cycles: number;
  forever: boolean;
  gamesPerCycle: number;
  outputDir: string;
  whiteDifficulty: BotDifficulty;
  blackDifficulty: BotDifficulty;
  openingMin: number;
  openingMax: number;
  maxPlies: number;
  seed: number;
  maxCandidatesPerGame: number;
  maxCycleCandidates: number;
  minSourceMoves: number;
  minCandidateScore: number;
  rejectResultReasons: string[];
  startingId: number;
}

interface StoredSelfPlayGame {
  id: string;
  source: string;
  moves: ReturnType<typeof playSelfPlayGame>['moves'];
  result: string;
  resultReason: string;
  moveCount: number;
  whiteDifficulty: BotDifficulty;
  blackDifficulty: BotDifficulty;
  openingRandomPlies: number;
  seed: number;
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

function parseDifficulty(value: string | undefined, fallback: BotDifficulty): BotDifficulty {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }
  return fallback;
}

function parseOptions(argv: string[]): LoopOptions {
  const options: LoopOptions = {
    cycles: 20,
    forever: false,
    gamesPerCycle: 25,
    outputDir: './tmp/puzzle-loop',
    whiteDifficulty: 'medium',
    blackDifficulty: 'medium',
    openingMin: 4,
    openingMax: 10,
    maxPlies: 120,
    seed: 1,
    maxCandidatesPerGame: 2,
    maxCycleCandidates: 20,
    minSourceMoves: 16,
    minCandidateScore: 900,
    rejectResultReasons: ['agreement', 'max_plies', 'stopped'],
    startingId: 9000,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === '--cycles' && value) {
      options.cycles = Math.max(1, Number.parseInt(value, 10) || options.cycles);
      index += 1;
      continue;
    }

    if (token === '--forever') {
      options.forever = true;
      continue;
    }

    if (token === '--games-per-cycle' && value) {
      options.gamesPerCycle = Math.max(1, Number.parseInt(value, 10) || options.gamesPerCycle);
      index += 1;
      continue;
    }

    if (token === '--output-dir' && value) {
      options.outputDir = value;
      index += 1;
      continue;
    }

    if (token === '--white' && value) {
      options.whiteDifficulty = parseDifficulty(value, options.whiteDifficulty);
      index += 1;
      continue;
    }

    if (token === '--black' && value) {
      options.blackDifficulty = parseDifficulty(value, options.blackDifficulty);
      index += 1;
      continue;
    }

    if (token === '--opening-min' && value) {
      options.openingMin = Math.max(0, Number.parseInt(value, 10) || options.openingMin);
      index += 1;
      continue;
    }

    if (token === '--opening-max' && value) {
      options.openingMax = Math.max(0, Number.parseInt(value, 10) || options.openingMax);
      index += 1;
      continue;
    }

    if (token === '--max-plies' && value) {
      options.maxPlies = Math.max(1, Number.parseInt(value, 10) || options.maxPlies);
      index += 1;
      continue;
    }

    if (token === '--seed' && value) {
      options.seed = Number.parseInt(value, 10) || options.seed;
      index += 1;
      continue;
    }

    if (token === '--max-candidates-per-game' && value) {
      options.maxCandidatesPerGame = Math.max(1, Number.parseInt(value, 10) || options.maxCandidatesPerGame);
      index += 1;
      continue;
    }

    if (token === '--max-cycle-candidates' && value) {
      options.maxCycleCandidates = Math.max(1, Number.parseInt(value, 10) || options.maxCycleCandidates);
      index += 1;
      continue;
    }

    if (token === '--min-source-moves' && value) {
      options.minSourceMoves = Math.max(1, Number.parseInt(value, 10) || options.minSourceMoves);
      index += 1;
      continue;
    }

    if (token === '--min-candidate-score' && value) {
      options.minCandidateScore = Number.parseInt(value, 10) || options.minCandidateScore;
      index += 1;
      continue;
    }

    if (token === '--reject-result-reasons' && value) {
      options.rejectResultReasons = value.split(',').map(part => part.trim()).filter(Boolean);
      index += 1;
      continue;
    }

    if (token === '--starting-id' && value) {
      options.startingId = Math.max(1, Number.parseInt(value, 10) || options.startingId);
      index += 1;
    }
  }

  return options;
}

function resolveOpeningRange(minimum: number, maximum: number) {
  const min = Math.max(0, Math.min(minimum, maximum));
  const max = Math.max(min, maximum);
  return { min, max };
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const outputDir = path.resolve(options.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const openingRange = resolveOpeningRange(options.openingMin, options.openingMax);
  const openingRandom = mulberry32(options.seed);
  const seenFingerprints = new Set<string>();
  let nextCandidateId = options.startingId;
  let totalGames = 0;
  let totalCandidates = 0;

  for (let cycle = 0; options.forever || cycle < options.cycles; cycle += 1) {
    const cycleGames: StoredSelfPlayGame[] = [];
    const cycleCandidates: ReturnType<typeof generatePuzzleCandidateDraftsFromMoveSequence> = [];

    for (let gameIndex = 0; gameIndex < options.gamesPerCycle; gameIndex += 1) {
      const openingRandomPlies = openingRange.min + Math.floor(openingRandom() * (openingRange.max - openingRange.min + 1));
      const seed = (options.seed + cycle * 100003 + gameIndex * 7919) >>> 0;
      const game = playSelfPlayGame({
        whiteDifficulty: options.whiteDifficulty,
        blackDifficulty: options.blackDifficulty,
        openingRandomPlies,
        maxPlies: options.maxPlies,
        seed,
      });

      const id = `cycle-${String(cycle + 1).padStart(3, '0')}-game-${String(gameIndex + 1).padStart(3, '0')}`;
      const source = `Puzzle loop ${options.whiteDifficulty} vs ${options.blackDifficulty}`;
      cycleGames.push({
        id,
        source,
        moves: game.moves,
        result: game.result,
        resultReason: game.resultReason,
        moveCount: game.moveCount,
        whiteDifficulty: game.whiteDifficulty,
        blackDifficulty: game.blackDifficulty,
        openingRandomPlies: game.openingRandomPlies,
        seed: game.seed,
      });

      const generated = generatePuzzleCandidateDraftsFromMoveSequence(
        createDefaultGenerationSource(
          id,
          source,
          game.moves,
          undefined,
          'white',
          {
            moveCount: game.moveCount,
            result: game.result,
            resultReason: game.resultReason,
          },
        ),
        {
          startingId: nextCandidateId,
          minPlies: 3,
          maxPlies: 3,
          maxCandidates: options.maxCandidatesPerGame,
          minSourceMoves: options.minSourceMoves,
          rejectResultReasons: options.rejectResultReasons,
        },
      );

      nextCandidateId += generated.length;

      for (const candidate of generated) {
        if (candidate.score < options.minCandidateScore) {
          continue;
        }

        if (seenFingerprints.has(candidate.fingerprint)) {
          continue;
        }

        seenFingerprints.add(candidate.fingerprint);
        cycleCandidates.push(candidate);
      }
    }

    cycleCandidates.sort((left, right) => right.score - left.score);
    if (cycleCandidates.length > options.maxCycleCandidates) {
      cycleCandidates.length = options.maxCycleCandidates;
    }

    totalGames += cycleGames.length;
    totalCandidates += cycleCandidates.length;

    const cycleTag = String(cycle + 1).padStart(3, '0');
    const gamesPath = path.join(outputDir, `selfplay-cycle-${cycleTag}.json`);
    const candidatesPath = path.join(outputDir, `candidates-cycle-${cycleTag}.json`);
    const summaryPath = path.join(outputDir, `summary-cycle-${cycleTag}.txt`);

    writeJson(gamesPath, cycleGames);
    writeJson(candidatesPath, cycleCandidates.map(candidate => ({
      score: candidate.score,
      sourceId: candidate.sourceId,
      windowStart: candidate.windowStart,
      warnings: candidate.validationWarnings,
      draft: candidate.draft,
    })));

    const summary = [
      `cycle=${cycle + 1}`,
      `games=${cycleGames.length}`,
      `candidates=${cycleCandidates.length}`,
      `totalGames=${totalGames}`,
      `totalCandidates=${totalCandidates}`,
    ].join('\n');
    fs.writeFileSync(summaryPath, `${summary}\n`, 'utf8');

    console.log(
      `cycle ${cycle + 1}${options.forever ? '' : `/${options.cycles}`}: ${cycleGames.length} games, ${cycleCandidates.length} candidate(s), output=${gamesPath}`,
    );

    if (cycleCandidates.length > 0) {
      const previewPath = path.join(outputDir, `candidates-cycle-${cycleTag}.md`);
      const preview = cycleCandidates
        .map(candidate => {
          const warnings = candidate.validationWarnings.length > 0
            ? `warnings: ${candidate.validationWarnings.join(' | ')}\n`
            : '';
          return `## #${candidate.draft.id} score=${candidate.score}\n${warnings}\n\`\`\`json\n${formatDraftAsPrettyJson(candidate.draft)}\n\`\`\``;
        })
        .join('\n\n');
      fs.writeFileSync(previewPath, `${preview}\n`, 'utf8');
    }
  }

  console.log(`done: ${totalGames} games, ${totalCandidates} total candidate(s), dir=${outputDir}`);
}

main();
