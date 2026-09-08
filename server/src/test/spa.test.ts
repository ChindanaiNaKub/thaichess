import { describe, expect, it } from 'vitest';
import { shouldServeSpaShell } from '../spa';
import { isKnownAppPath } from '../appRoutes';

describe('shouldServeSpaShell', () => {
  it('serves the SPA shell for application routes', () => {
    expect(shouldServeSpaShell('/')).toBe(true);
    expect(shouldServeSpaShell('/bot')).toBe(true);
    expect(shouldServeSpaShell('/analysis/abc123')).toBe(true);
  });

  it('does not serve the SPA shell for hashed assets or static files', () => {
    expect(shouldServeSpaShell('/assets/BotGame-DOAVuS_q.js')).toBe(false);
    expect(shouldServeSpaShell('/assets/index-BkcUvuCq.css')).toBe(false);
    expect(shouldServeSpaShell('/favicon.svg')).toBe(false);
    expect(shouldServeSpaShell('/manifest.json')).toBe(false);
  });
});

describe('isKnownAppPath', () => {
  it('accepts static and dynamic application routes', () => {
    expect(isKnownAppPath('/')).toBe(true);
    expect(isKnownAppPath('/quick-play')).toBe(true);
    expect(isKnownAppPath('/puzzles/random')).toBe(true);
    expect(isKnownAppPath('/puzzle/9000')).toBe(true);
    expect(isKnownAppPath('/lessons/rook-activity')).toBe(true);
    expect(isKnownAppPath('/game/abc123')).toBe(true);
    expect(isKnownAppPath('/spectate/abc123')).toBe(true);
    expect(isKnownAppPath('/settings/board-pieces')).toBe(true);
  });

  it('rejects unknown routes so the SPA fallback can answer with 404', () => {
    expect(isKnownAppPath('/nonexistent-page-xyz')).toBe(false);
    expect(isKnownAppPath('/bot/extra')).toBe(false);
    expect(isKnownAppPath('/puzzle/9000/extra')).toBe(false);
  });
});

