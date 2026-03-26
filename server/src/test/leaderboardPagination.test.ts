import { describe, expect, it } from 'vitest';
import { normalizeLeaderboardLimit, normalizeLeaderboardPage } from '../leaderboardPagination';

describe('leaderboard pagination normalization', () => {
  it('defaults invalid page and limit values', () => {
    expect(normalizeLeaderboardPage(undefined)).toBe(0);
    expect(normalizeLeaderboardPage('abc')).toBe(0);
    expect(normalizeLeaderboardLimit(undefined)).toBe(25);
    expect(normalizeLeaderboardLimit('abc')).toBe(25);
  });

  it('clamps page and limit into safe bounds', () => {
    expect(normalizeLeaderboardPage('-5')).toBe(0);
    expect(normalizeLeaderboardPage('2500')).toBe(1000);
    expect(normalizeLeaderboardPage('12')).toBe(12);

    expect(normalizeLeaderboardLimit('-5')).toBe(1);
    expect(normalizeLeaderboardLimit('0')).toBe(1);
    expect(normalizeLeaderboardLimit('250')).toBe(100);
    expect(normalizeLeaderboardLimit('50')).toBe(50);
  });
});
