import fs from 'fs';
import path from 'path';

import { getRecentGames, initDatabase, type RecentGamesFilter } from '../database';
import type { Move } from '../../../shared/types';

interface ScriptOptions {
  limit: number;
  filter: RecentGamesFilter;
  minSourceMoves: number;
  rejectResultReasons: string[];
  outputPath: string;
}

interface ExportedPuzzleSource {
  id: string;
  source: string;
  moves: Move[];
  moveCount: number;
  result: string;
  resultReason: string;
  rated: boolean;
  gameMode: string;
  finishedAt: number;
}

function parseOptions(argv: string[]): ScriptOptions {
  const options: ScriptOptions = {
    limit: 200,
    filter: 'rated',
    minSourceMoves: 16,
    rejectResultReasons: ['agreement', 'max_plies', 'stopped'],
    outputPath: './tmp/turso-puzzle-sources.json',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === '--limit' && value) {
      options.limit = Math.max(1, Number.parseInt(value, 10) || options.limit);
      index += 1;
      continue;
    }

    if (token === '--filter' && value && (value === 'all' || value === 'rated' || value === 'casual')) {
      options.filter = value;
      index += 1;
      continue;
    }

    if (token === '--min-source-moves' && value) {
      options.minSourceMoves = Math.max(1, Number.parseInt(value, 10) || options.minSourceMoves);
      index += 1;
      continue;
    }

    if (token === '--reject-result-reasons' && value) {
      options.rejectResultReasons = value
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (token === '--output' && value) {
      options.outputPath = value;
      index += 1;
    }
  }

  return options;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  await initDatabase();

  const recentGames = await getRecentGames(options.limit, 0, options.filter);
  const rejectedReasons = new Set(options.rejectResultReasons);

  const exported: ExportedPuzzleSource[] = recentGames
    .filter(game => game.move_count >= options.minSourceMoves)
    .filter(game => !rejectedReasons.has(game.result_reason))
    .map(game => ({
      id: game.id,
      source: `Exported ${game.rated ? 'rated' : 'casual'} game ${game.id}`,
      moves: JSON.parse(game.moves) as Move[],
      moveCount: game.move_count,
      result: game.result,
      resultReason: game.result_reason,
      rated: game.rated === 1,
      gameMode: game.game_mode,
      finishedAt: game.finished_at,
    }));

  const absoluteOutputPath = path.resolve(options.outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(exported, null, 2)}\n`, 'utf8');

  console.log(
    `Exported ${exported.length} puzzle source game(s) from ${recentGames.length} finished game(s) to ${absoluteOutputPath}.`,
  );

  if (exported.length === 0) {
    console.log('No games survived the export filters.');
    console.log('Try increasing --limit, lowering --min-source-moves, or changing --filter.');
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
