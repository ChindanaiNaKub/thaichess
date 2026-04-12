import { describe, expect, it } from 'vitest';

import { resolveSmokeStartTimeoutMs } from '../scripts/smokeStartConfig';

describe('resolveSmokeStartTimeoutMs', () => {
  it('uses the local default timeout outside CI', () => {
    expect(resolveSmokeStartTimeoutMs({})).toBe(45_000);
  });

  it('uses a longer CI default timeout on GitHub runners', () => {
    expect(resolveSmokeStartTimeoutMs({ CI: 'true' })).toBe(90_000);
  });

  it('accepts a valid numeric override', () => {
    expect(resolveSmokeStartTimeoutMs({ SMOKE_START_TIMEOUT_MS: '12000' })).toBe(12_000);
  });

  it('falls back to the default for invalid overrides', () => {
    expect(resolveSmokeStartTimeoutMs({ SMOKE_START_TIMEOUT_MS: 'abc' })).toBe(45_000);
    expect(resolveSmokeStartTimeoutMs({ SMOKE_START_TIMEOUT_MS: '0' })).toBe(45_000);
    expect(resolveSmokeStartTimeoutMs({ CI: 'true', SMOKE_START_TIMEOUT_MS: 'abc' })).toBe(90_000);
  });
});
