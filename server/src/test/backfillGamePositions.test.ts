import { describe, expect, it } from 'vitest';
import {
  ALL_FINISHED_GAMES_SQL,
  GAMES_NEEDING_POSITIONS_SQL,
} from '../scripts/backfillGamePositions';

describe('backfillGamePositions selection SQL', () => {
  it('excludes games that already have positions via NOT EXISTS without LIMIT', () => {
    const normalized = GAMES_NEEDING_POSITIONS_SQL.replace(/\s+/g, ' ').trim();

    expect(normalized).toContain('NOT EXISTS ( SELECT 1 FROM game_positions gp WHERE gp.game_id = games.id )');
    expect(normalized).not.toMatch(/NOT IN\s*\(/i);
    expect(normalized).not.toMatch(/game_positions[^)]*LIMIT\s+1/i);
  });

  it('force rebuild selects all finished games without a positions filter', () => {
    const normalized = ALL_FINISHED_GAMES_SQL.replace(/\s+/g, ' ').trim();

    expect(normalized).toContain('WHERE finished_at IS NOT NULL');
    expect(normalized).not.toContain('game_positions');
  });
});
