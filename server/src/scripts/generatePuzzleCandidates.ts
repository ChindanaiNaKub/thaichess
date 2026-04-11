import fs from 'fs';
import path from 'path';

import { getRecentGames, initDatabase, type RecentGamesFilter } from '../database';
import type { Board, Move, PieceColor } from '../../../shared/types';
import {
  createDefaultGenerationSource,
  formatDraftAsPrettyJson,
  generatePuzzleCandidateDraftsFromMoveSequence,
  type PuzzleGenerationSource,
} from '../../../shared/puzzleGeneration';
import { parsePgnLikePuzzleSources } from '../../../shared/puzzleSourceImport';
import { SEED_PUZZLE_SOURCES } from '../../../shared/puzzleSeedSources';

const DEFAULT_SEED_LABEL = 'seed corpus';
const DOCTRINE_TAGS = new Set([
  'forcing',
  'quiet-but-forcing',
  'mate-preparation',
  'restriction',
  'trap-conversion',
  'count-pressure',
  'structural-win',
]);

interface ScriptOptions {
  limit: number;
  filter: RecentGamesFilter;
  maxPerGame: number;
  startingId: number;
  minSourceMoves: number;
  rejectResultReasons: string[];
  inputPath?: string;
  markdownOutputPath?: string;
}

interface InputFileGame {
  id?: string;
  source?: string;
  moves: Move[];
  initialBoard?: Board;
  startingTurn?: PieceColor;
  startingPlyNumber?: number;
  moveCount?: number;
  result?: string;
  resultReason?: string;
}

function parseOptions(argv: string[]): ScriptOptions {
  const options: ScriptOptions = {
    limit: 50,
    filter: 'rated',
    maxPerGame: 3,
    startingId: 3000,
    minSourceMoves: 12,
    rejectResultReasons: ['agreement', 'max_plies', 'stopped'],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if (token === '--limit' && value) {
      options.limit = Number.parseInt(value, 10) || options.limit;
      index += 1;
      continue;
    }

    if (token === '--filter' && value && (value === 'all' || value === 'rated' || value === 'casual')) {
      options.filter = value;
      index += 1;
      continue;
    }

    if (token === '--max-per-game' && value) {
      options.maxPerGame = Number.parseInt(value, 10) || options.maxPerGame;
      index += 1;
      continue;
    }

    if (token === '--starting-id' && value) {
      options.startingId = Number.parseInt(value, 10) || options.startingId;
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

    if (token === '--input' && value) {
      options.inputPath = value;
      index += 1;
      continue;
    }

    if (token === '--markdown-output' && value) {
      options.markdownOutputPath = value;
      index += 1;
    }
  }

  return options;
}

function parseInputFile(filePath: string): PuzzleGenerationSource[] {
  const absolutePath = path.resolve(filePath);
  if (!absolutePath.toLowerCase().endsWith('.json')) {
    return parsePgnLikePuzzleSources(fs.readFileSync(absolutePath, 'utf8'));
  }

  const raw = fs.readFileSync(absolutePath, 'utf8');
  const parsed = JSON.parse(raw) as InputFileGame[];

  if (!Array.isArray(parsed)) {
    throw new Error('Input file must be a JSON array of { id?, source?, moves } objects.');
  }

  return parsed.map((game, index) =>
    createDefaultGenerationSource(
      game.id ?? `input-${index + 1}`,
      game.source ?? `Imported JSON game ${index + 1}`,
      game.moves,
      game.initialBoard,
      game.startingTurn ?? 'white',
      {
        moveCount: game.moveCount ?? game.moves.length,
        result: game.result,
        resultReason: game.resultReason,
        startingPlyNumber: game.startingPlyNumber ?? 1,
      },
    ),
  );
}

async function loadSources(options: ScriptOptions): Promise<PuzzleGenerationSource[]> {
  if (options.inputPath) {
    return parseInputFile(options.inputPath);
  }

  await initDatabase();
  const recentGames = await getRecentGames(options.limit, 0, options.filter);
  if (recentGames.length === 0) {
    return SEED_PUZZLE_SOURCES;
  }

  return recentGames.map(game =>
    createDefaultGenerationSource(
      game.id,
      `Saved game ${game.id}`,
      JSON.parse(game.moves) as Move[],
      undefined,
      'white',
      {
        moveCount: game.move_count,
        result: game.result,
        resultReason: game.result_reason,
        startingPlyNumber: 1,
      },
    ),
  );
}

function compareCandidates(
  left: ReturnType<typeof generatePuzzleCandidateDraftsFromMoveSequence>[number],
  right: ReturnType<typeof generatePuzzleCandidateDraftsFromMoveSequence>[number],
): number {
  return (
    right.score - left.score ||
    left.draft.theme.localeCompare(right.draft.theme) ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.windowStart - right.windowStart ||
    left.draft.id - right.draft.id
  );
}

function resolveMarkdownOutputPath(outputPath: string): string {
  const absoluteOutputPath = path.resolve(outputPath);
  const looksLikeDirectory =
    outputPath === '.' ||
    outputPath === './' ||
    outputPath === '..' ||
    outputPath.endsWith(path.sep) ||
    (fs.existsSync(absoluteOutputPath) && fs.statSync(absoluteOutputPath).isDirectory());

  return looksLikeDirectory
    ? path.join(absoluteOutputPath, 'puzzle-candidate-review.md')
    : absoluteOutputPath;
}

function writeMarkdownReview(
  outputPath: string,
  sources: PuzzleGenerationSource[],
  candidates: ReturnType<typeof generatePuzzleCandidateDraftsFromMoveSequence>,
) {
  const absoluteOutputPath = resolveMarkdownOutputPath(outputPath);
  fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });

  const themeCounts = new Map<string, number>();
  for (const candidate of candidates) {
    themeCounts.set(candidate.draft.theme, (themeCounts.get(candidate.draft.theme) ?? 0) + 1);
  }

  const themeSummary = [...themeCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([theme, count]) => `- ${theme}: ${count}`)
    .join('\n');

  const body = candidates.map(candidate => {
    const warnings = candidate.validationWarnings.length > 0
      ? candidate.validationWarnings.join(' | ')
      : 'none';
    const doctrine = (candidate.draft.tags ?? []).filter(tag => DOCTRINE_TAGS.has(tag));

    return [
      `## #${candidate.draft.id} ${candidate.draft.theme} score=${candidate.score}`,
      '',
      `- source: ${candidate.sourceId}`,
      `- ply: ${candidate.windowStart + 1}`,
      `- motif: ${candidate.draft.motif}`,
      `- doctrine: ${doctrine.length > 0 ? doctrine.join(', ') : 'none'}`,
      `- warnings: ${warnings}`,
      '',
      '```json',
      formatDraftAsPrettyJson(candidate.draft),
      '```',
    ].join('\n');
  }).join('\n\n');

  const markdown = [
    '# Puzzle Candidate Review',
    '',
    `- source games scanned: ${sources.length}`,
    `- candidate drafts: ${candidates.length}`,
    '',
    '## Theme Summary',
    '',
    themeSummary || '- none',
    '',
    body,
    '',
  ].join('\n');

  fs.writeFileSync(absoluteOutputPath, markdown, 'utf8');
  console.log(`Wrote markdown review to ${absoluteOutputPath}`);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const sources = await loadSources(options);

  if (sources.length === 0) {
    console.log('No completed games available to mine.');
    console.log(`Using the bundled ${DEFAULT_SEED_LABEL} is recommended until you export real finished games.`);
    console.log('Run with --input <file.json|file.pgn> to mine from exported move lists instead.');
    console.log('Expected JSON shape: [{ "id": "game-1", "source": "Rated game", "moves": [...] }]');
    return;
  }

  let nextId = options.startingId;
  const allGenerated = sources.flatMap(source => {
    const generated = generatePuzzleCandidateDraftsFromMoveSequence(source, {
      startingId: nextId,
      minPlies: 3,
      maxPlies: 5,
      maxCandidates: options.maxPerGame,
      minSourceMoves: options.minSourceMoves,
      rejectResultReasons: options.rejectResultReasons,
    });
    nextId += generated.length;
    return generated;
  }).sort(compareCandidates);

  if (allGenerated.length === 0) {
    console.log(`Scanned ${sources.length} source game(s) but found no valid 3- or 5-ply candidates.`);
    console.log('Try a larger --limit, different --filter, or an --input file with stronger tactical games.');
    return;
  }

  console.log(`Generated ${allGenerated.length} candidate draft(s) from ${sources.length} source game(s).\n`);

  if (options.markdownOutputPath) {
    writeMarkdownReview(options.markdownOutputPath, sources, allGenerated);
  }

  for (const candidate of allGenerated) {
    const doctrine = (candidate.draft.tags ?? []).filter(tag => DOCTRINE_TAGS.has(tag));
    console.log(`#${candidate.draft.id} from ${candidate.sourceId} at ply ${candidate.windowStart + 1}`);
    console.log(`score=${candidate.score} theme=${candidate.draft.theme} motif=${candidate.draft.motif}`);
    console.log(`doctrine=${doctrine.length > 0 ? doctrine.join(', ') : 'none'}`);
    if (candidate.validationWarnings.length > 0) {
      console.log(`warnings=${candidate.validationWarnings.join(' | ')}`);
    }
    console.log(formatDraftAsPrettyJson(candidate.draft));
    console.log('');
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
