import { createInitialBoard } from './engine';
import type { Board, Move, PieceColor } from './types';
import type { PuzzleGenerationSource } from './puzzleGeneration';
import { validateMakrukReplay } from './makrukPositionValidation';
import { PuzzleGenerationSourceSchema } from './validation/puzzle';

interface ParsedHeaders {
  id?: string;
  source?: string;
  result?: string;
  resultReason?: string;
  moveCount?: number;
  startingPlyNumber?: number;
  startingTurn?: PieceColor;
}

function parseMoveToken(token: string): Move | null {
  const match = token.match(/^([a-h][1-8])[-x]([a-h][1-8])$/i);
  if (!match) return null;

  const from = match[1].toLowerCase();
  const to = match[2].toLowerCase();

  return {
    from: {
      col: from.charCodeAt(0) - 97,
      row: Number.parseInt(from[1], 10) - 1,
    },
    to: {
      col: to.charCodeAt(0) - 97,
      row: Number.parseInt(to[1], 10) - 1,
    },
  };
}

function buildSource(headers: ParsedHeaders, moves: Move[], index: number): PuzzleGenerationSource {
  return {
    id: headers.id ?? `pgnlike-${index + 1}`,
    source: headers.source ?? `Imported PGN-like game ${index + 1}`,
    moves,
    initialBoard: createInitialBoard(),
    startingTurn: headers.startingTurn ?? 'white',
    positionSourceType: 'real-game',
    moveCount: headers.moveCount ?? moves.length,
    result: headers.result,
    resultReason: headers.resultReason,
    startingPlyNumber: headers.startingPlyNumber ?? 1,
  };
}

/**
 * Validates a puzzle generation source using Zod schema.
 * Returns null if validation fails, logging errors for debugging.
 */
function validateSource(source: PuzzleGenerationSource, index: number): PuzzleGenerationSource | null {
  const result = PuzzleGenerationSourceSchema.safeParse(source);
  
  if (!result.success) {
    const errors = result.error.issues.map(issue => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    
    console.warn(`[PuzzleImport] Source ${source.id ?? index} validation failed:`, errors.join(', '));
    return null;
  }
  
  return result.data;
}

export function parsePgnLikePuzzleSources(raw: string): PuzzleGenerationSource[] {
  const sources: PuzzleGenerationSource[] = [];
  const lines = raw.split(/\r?\n/);

  let headers: ParsedHeaders = {};
  let moveTokens: string[] = [];

  const flush = () => {
    const parsedMoves = moveTokens
      .map(parseMoveToken)
      .filter((move): move is Move => move !== null);

    if (parsedMoves.length > 0) {
      const source = buildSource(headers, parsedMoves, sources.length);
      const validatedSource = validateSource(source, sources.length);
      
      if (validatedSource) {
        sources.push(validatedSource);
      }
    }

    headers = {};
    moveTokens = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (moveTokens.length > 0) {
        flush();
      }
      continue;
    }

    const headerMatch = trimmed.match(/^\[([A-Za-z]+)\s+"([^"]+)"\]$/);
    if (headerMatch) {
      const [, key, value] = headerMatch;
      switch (key.toLowerCase()) {
        case 'game':
        case 'id':
          headers.id = value;
          break;
        case 'source':
          headers.source = value;
          break;
        case 'result':
          headers.result = value;
          break;
        case 'resultreason':
          headers.resultReason = value;
          break;
        case 'movecount':
          headers.moveCount = Number.parseInt(value, 10);
          break;
        case 'startingply':
          headers.startingPlyNumber = Number.parseInt(value, 10);
          break;
        case 'turn':
          headers.startingTurn = value === 'black' ? 'black' : 'white';
          break;
      }
      continue;
    }

    const tokens = trimmed
      .replace(/\{[^}]*\}/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0)
      .filter(token => !/^\d+\.$/.test(token))
      .filter(token => !/^(1-0|0-1|1\/2-1\/2|\*)$/i.test(token));

    moveTokens.push(...tokens);
  }

  if (moveTokens.length > 0) {
    flush();
  }

  return sources;
}

export function createSeedPuzzleSource(
  source: Omit<PuzzleGenerationSource, 'initialBoard' | 'startingTurn'> & {
    initialBoard?: Board;
    startingTurn?: PieceColor;
  },
): PuzzleGenerationSource {
  if (source.setupMoves && source.setupMoves.length > 0) {
    const replay = validateMakrukReplay({
      moves: source.setupMoves,
      expectedBoard: source.initialBoard,
      expectedTurn: source.startingTurn,
    });

    if (!replay.valid || !replay.finalState) {
      throw new Error(`Seed puzzle source "${source.id}" must provide a legal replayable setup.`);
    }

    return {
      ...source,
      initialBoard: replay.finalState.board,
      startingTurn: replay.finalState.turn,
      positionSourceType: source.positionSourceType ?? 'constructed',
      startingPlyNumber: source.startingPlyNumber ?? 1,
    };
  }

  const defaultBoard = createInitialBoard();
  const initialBoard = source.initialBoard ?? defaultBoard;
  const startingTurn = source.startingTurn ?? 'white';
  const usesCustomStart = startingTurn !== 'white' ||
    JSON.stringify(initialBoard) !== JSON.stringify(defaultBoard);

  if (usesCustomStart) {
    throw new Error(`Seed puzzle source "${source.id}" must use setupMoves instead of an arbitrary start board.`);
  }

  return {
    ...source,
    initialBoard,
    startingTurn,
    positionSourceType: source.positionSourceType ?? 'constructed',
    startingPlyNumber: source.startingPlyNumber ?? 1,
  };
}

export function createConstructedPuzzleSource(
  source: Omit<PuzzleGenerationSource, 'positionSourceType'>,
): PuzzleGenerationSource {
  return createSeedPuzzleSource({
    ...source,
    positionSourceType: 'constructed',
  });
}

export function createEnginePuzzleSource(
  source: Omit<PuzzleGenerationSource, 'positionSourceType'>,
): PuzzleGenerationSource {
  return createSeedPuzzleSource({
    ...source,
    positionSourceType: 'engine-generated',
  });
}
