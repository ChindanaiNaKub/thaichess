import { describe, expect, it } from 'vitest';
import { mapGameplayErrorMessage } from '../lib/gameplayErrors';

const t = (key: string) => key;

describe('mapGameplayErrorMessage', () => {
  it('maps known server strings to i18n keys', () => {
    expect(mapGameplayErrorMessage('You are already in the matchmaking queue.', t, 'quick.load_failed'))
      .toBe('game.error_already_queued');
    expect(mapGameplayErrorMessage('Invalid move', t, 'game.load_failed'))
      .toBe('game.error_invalid_move');
  });

  it('maps zod field errors to a generic request message', () => {
    expect(mapGameplayErrorMessage('Invalid fields: timeControl', t, 'quick.load_failed'))
      .toBe('game.error_invalid_request');
  });

  it('never surfaces unknown raw exception text', () => {
    expect(mapGameplayErrorMessage('No servers available.', t, 'quick.load_failed'))
      .toBe('quick.load_failed');
    expect(mapGameplayErrorMessage(new Error('ECONNRESET boom'), t, 'games.load_failed'))
      .toBe('games.load_failed');
  });

  it('uses the fallback when the payload is empty', () => {
    expect(mapGameplayErrorMessage('', t, 'game.load_failed')).toBe('game.load_failed');
    expect(mapGameplayErrorMessage(null, t, 'game.load_failed')).toBe('game.load_failed');
  });
});
