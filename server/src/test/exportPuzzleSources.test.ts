import { describe, expect, it } from 'vitest';

import { mapRecentGameToExportedPuzzleSource } from '../scripts/exportPuzzleSources';
import { parsePgnLikePuzzleSources } from '../../../shared/puzzleSourceImport';
import { PuzzleGenerationSourceSchema } from '../../../shared/validation/puzzle';

describe('exportPuzzleSources source metadata', () => {
  it('accepts enriched real-game source records with attribution fields', () => {
    const parsed = PuzzleGenerationSourceSchema.parse({
      id: 'game-123',
      source: 'Exported rated game game-123',
      moves: [{ from: { row: 2, col: 4 }, to: { row: 3, col: 4 } }],
      positionSourceType: 'real-game',
      startingPlyNumber: 1,
      moveCount: 42,
      result: '1-0',
      resultReason: 'checkmate',
      sourceLicense: 'internal-real-game',
      sourceGameUrl: '/games/game-123',
      sourceGameId: 'game-123',
    });

    expect(parsed.positionSourceType).toBe('real-game');
    expect(parsed.sourceLicense).toBe('internal-real-game');
    expect(parsed.sourceGameUrl).toBe('/games/game-123');
    expect(parsed.sourceGameId).toBe('game-123');
  });

  it('exports real-game metadata from recent games', () => {
    expect(mapRecentGameToExportedPuzzleSource({
      id: 'game-789',
      rated: 1,
      game_mode: 'quick_play',
      moves: JSON.stringify([{ from: { row: 1, col: 0 }, to: { row: 2, col: 0 } }]),
      move_count: 18,
      result: '1-0',
      result_reason: 'checkmate',
      finished_at: 1234567890,
    })).toMatchObject({
      id: 'game-789',
      source: 'Exported rated game game-789',
      sourceGameId: 'game-789',
      sourceLicense: 'internal-real-game',
      sourceGameUrl: '/games/game-789',
      rated: true,
      gameMode: 'quick_play',
    });
  });

  it('preserves source metadata when importing PGN-like sources', () => {
    const sources = parsePgnLikePuzzleSources(`
[ID "game-456"]
[Source "Exported rated game game-456"]
[Result "1-0"]
[ResultReason "checkmate"]
[MoveCount "42"]
[StartingPly "1"]
[StartingTurn "black"]
[SourceGameId "game-456"]
[SourceLicense "internal-real-game"]
[SourceGameUrl "/games/game-456"]

a2-a3 b7-b6
    `);

    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      id: 'game-456',
      source: 'Exported rated game game-456',
      positionSourceType: 'real-game',
      sourceGameId: 'game-456',
      sourceLicense: 'internal-real-game',
      sourceGameUrl: '/games/game-456',
      startingTurn: 'black',
    });
  });

  it('accepts StartingTurn as an alias for Turn', () => {
    const sources = parsePgnLikePuzzleSources(`
[ID "game-457"]
[Source "Exported rated game game-457"]
[Turn "black"]

a2-a3 b7-b6
    `);

    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      id: 'game-457',
      startingTurn: 'black',
    });
  });
});
