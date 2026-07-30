import { afterEach, describe, expect, it, vi } from 'vitest';
import { MonitoringStore } from '../monitoring';

describe('MonitoringStore ADR-0001 operational counters', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records reconnect and rated-save counters without PII labels', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const monitoring = new MonitoringStore();

    monitoring.recordEvent('game.reconnectSuccess', 'game_reconnect_success', { gameId: 'g1' });
    monitoring.recordEvent('game.reconnectFailure', 'game_reconnect_failure', {
      gameId: 'g1',
      reason: 'disconnect_ttl_expired',
    });
    monitoring.recordEvent('game.ratedSaveRetry', 'rated_game_save_retry', {
      gameId: 'g1',
      retryIndex: 1,
    });
    monitoring.recordEvent('game.ratedDuplicate', 'rated_game_duplicate', { gameId: 'g1' });

    const snapshot = monitoring.snapshot();
    expect(snapshot.game).toEqual({
      reconnectSuccess: 1,
      reconnectFailure: 1,
      ratedSaveRetry: 1,
      ratedDuplicate: 1,
    });

    const body = monitoring.getPrometheusMetrics();
    expect(body).toContain('thaichess_game_reconnect_success_total 1');
    expect(body).toContain('thaichess_game_reconnect_failure_total 1');
    expect(body).toContain('thaichess_rated_game_save_retry_total 1');
    expect(body).toContain('thaichess_rated_game_duplicate_total 1');
    expect(body).not.toMatch(/username|email|displayName/i);

    expect(logSpy).toHaveBeenCalled();
    const logged = String(logSpy.mock.calls[0]?.[0] ?? '');
    expect(logged).toContain('"event":"game_reconnect_success"');
    expect(logged).not.toMatch(/@|password/i);
  });
});
