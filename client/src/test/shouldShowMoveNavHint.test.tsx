import { describe, expect, it } from 'vitest';
import { shouldShowMoveNavHint } from '../components/gamePageHelpers';

describe('shouldShowMoveNavHint', () => {
  it('stays quiet mid-play and appears when reviewing or finished', () => {
    expect(shouldShowMoveNavHint(12, false, false)).toBe(false);
    expect(shouldShowMoveNavHint(12, false, true)).toBe(true);
    expect(shouldShowMoveNavHint(12, true, false)).toBe(true);
    expect(shouldShowMoveNavHint(0, true, false)).toBe(false);
  });
});
