import { describe, it, expect } from 'vitest';
import { gameQueryOptions } from '../../queries/analysis';

/**
 * REGRESSION TEST: API Query Enable Logic for Inline Sources
 *
 * Bug: TanStack Query was enabled for 'bot' and 'local' game IDs,
 *      causing API calls to non-existent endpoints.
 *
 * Root cause: enabled: Boolean(gameId) was true for all truthy strings
 *
 * Fixed: 2026-04-07 - Added isRealGameId check to disable queries for
 *        inline sources ('bot', 'local', 'editor')
 */
describe('Regression: API Query Enable Logic for Inline Sources', () => {
  it('should DISABLE query for bot game source', () => {
    const options = gameQueryOptions('bot');
    expect(options.enabled).toBe(false);
  });

  it('should DISABLE query for local game source', () => {
    const options = gameQueryOptions('local');
    expect(options.enabled).toBe(false);
  });

  it('should DISABLE query for editor source', () => {
    const options = gameQueryOptions('editor');
    expect(options.enabled).toBe(false);
  });

  it('should ENABLE query for real game IDs', () => {
    const options = gameQueryOptions('abc123-def456');
    expect(options.enabled).toBe(true);
  });

  it('should ENABLE query for UUID-style game IDs', () => {
    const options = gameQueryOptions('6c158623-9e9d-4a3f-b468-f4f563095ae7');
    expect(options.enabled).toBe(true);
  });

  it('should DISABLE query when gameId is undefined', () => {
    const options = gameQueryOptions(undefined);
    expect(options.enabled).toBe(false);
  });

  it('should DISABLE query when gameId is empty string', () => {
    const options = gameQueryOptions('');
    expect(options.enabled).toBe(false);
  });
});
