import { afterEach, describe, expect, it } from 'vitest';
import {
  SHARE_CARD_SITE_HOST,
  buildPostGameShareText,
  buildPostGameShareUrl,
  getShareCardSiteOrigin,
} from '../lib/shareCardExport';

describe('shareCardExport URLs', () => {
  afterEach(() => {
    // jsdom keeps window.location; no cleanup needed beyond assertions
  });

  it('brands share images with the production host', () => {
    expect(SHARE_CARD_SITE_HOST).toBe('thaichess.dev');
  });

  it('uses the current origin for share links', () => {
    expect(getShareCardSiteOrigin()).toBe(window.location.origin.replace(/\/$/, ''));
  });

  it('points real analysis ids at the analysis/replay route', () => {
    expect(buildPostGameShareUrl('abc-123')).toBe(`${window.location.origin}/analysis/abc-123`);
  });

  it('falls back to the site origin for local ephemeral ids', () => {
    expect(buildPostGameShareUrl('local-12')).toBe(window.location.origin.replace(/\/$/, ''));
    expect(buildPostGameShareUrl(null)).toBe(window.location.origin.replace(/\/$/, ''));
  });

  it('appends the share URL to Web Share text', () => {
    expect(buildPostGameShareText('Alice won 1-0', 'game-1')).toBe(
      `Alice won 1-0\n${window.location.origin}/analysis/game-1`,
    );
  });
});
