import fs from 'fs';
import path from 'path';

import { playSelfPlayGame } from '../../../shared/selfPlay';
import type { BotDifficulty } from '../../../shared/botEngine';

interface ScriptOptions {
  count: number;
  outputPath?: string;
  whiteDifficulty: BotDifficulty;
  blackDifficulty: BotDifficulty;
  openingMin: number;
  openingMax: number;
  maxPlies: number;
  seed: number;
}

interface ExportedSelfPlayGame {
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

function clampOpeningRange(minimum: number, maximum: number) {
  const min = Math.max(0, Math.min(minimum, maximum));
  const max = Math.max(min, maximum);
  return { min, max };
}

function parseDifficulty(value: string | undefined, fallback: BotDifficulty): BotDifficulty {
  if (value === 'easy' || value === 'medium' || value === 'hard') {
    return value;
  }
  return fallback;
}

function parseOptions(argv: string[]): ScriptOptions {
  const options: ScriptOptions = {
    count: 20,
    whiteDifficulty: 'hard',
    blackDifficulty: 'hard',
    openingMin: 4,
    openingMax: 10,
    maxPlies: 160,
    seed: 1,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === '--count' && value) {
      options.count = Math.max(1, Number.parseInt(value, 10) || options.count);
      index += 1;
      continue;
    }

    if (token === '--output' && value) {
      options.outputPath = value;
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
    }
  }

  return options;
}

function writeOutput(filePath: string, games: ExportedSelfPlayGame[]): void {
  const absolutePath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(games, null, 2)}\n`, 'utf8');
}

function main() {
  const options = parseOptions(process.argv.slice(2));
  const openingRange = clampOpeningRange(options.openingMin, options.openingMax);
  const random = mulberry32(options.seed);
  const games: ExportedSelfPlayGame[] = [];

  for (let index = 0; index < options.count; index += 1) {
    const openingRandomPlies = openingRange.min + Math.floor(random() * (openingRange.max - openingRange.min + 1));
    const seed = (options.seed + index * 7919) >>> 0;
    const game = playSelfPlayGame({
      whiteDifficulty: options.whiteDifficulty,
      blackDifficulty: options.blackDifficulty,
      openingRandomPlies,
      maxPlies: options.maxPlies,
      seed,
    });

    games.push({
      id: `selfplay-${String(index + 1).padStart(4, '0')}`,
      source: `Offline self-play ${options.whiteDifficulty} vs ${options.blackDifficulty}`,
      moves: game.moves,
      result: game.result,
      resultReason: game.resultReason,
      moveCount: game.moveCount,
      whiteDifficulty: game.whiteDifficulty,
      blackDifficulty: game.blackDifficulty,
      openingRandomPlies: game.openingRandomPlies,
      seed: game.seed,
    });
  }

  if (options.outputPath) {
    writeOutput(options.outputPath, games);
    console.log(`Wrote ${games.length} self-play game(s) to ${path.resolve(options.outputPath)}.`);
  } else {
    console.log(JSON.stringify(games, null, 2));
  }

  const averageMoves = games.reduce((sum, game) => sum + game.moveCount, 0) / games.length;
  const finished = games.filter(game => game.resultReason !== 'max_plies' && game.resultReason !== 'stopped').length;
  console.log(`Average moves: ${averageMoves.toFixed(1)} | finished naturally: ${finished}/${games.length}`);
}

main();
