import { describe, expect, it } from 'vitest';
import { shouldServeSpaShell } from '../spa';

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
