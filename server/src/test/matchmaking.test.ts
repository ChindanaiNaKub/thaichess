import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MatchmakingQueue } from '../matchmaking';
import type { TimeControl } from '../../../shared/types';

const blitz: TimeControl = { initial: 300, increment: 0 };
const rapid: TimeControl = { initial: 600, increment: 5 };
const nearbyFlexible: TimeControl = { initial: 360, increment: 2 };

describe('MatchmakingQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-21T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches exact time controls immediately and tracks queue size per preset', () => {
    const queue = new MatchmakingQueue();

    queue.addToQueue('socket-a', blitz);
    queue.addToQueue('socket-b', blitz);
    queue.addToQueue('socket-c', rapid);

    expect(queue.getQueueSize()).toBe(3);
    expect(queue.getQueueSizeForTimeControl(blitz)).toBe(2);
    expect(queue.getQueueSizeForTimeControl(rapid)).toBe(1);
    expect(queue.findMatch('socket-a')?.socketId).toBe('socket-b');
  });

  it('falls back to flexible matching after enough wait time has passed', () => {
    const queue = new MatchmakingQueue();

    queue.addToQueue('socket-a', blitz);
    queue.addToQueue('socket-b', nearbyFlexible);

    expect(queue.findMatch('socket-a')).toBeNull();

    vi.advanceTimersByTime(10_001);

    expect(queue.findMatch('socket-a')?.socketId).toBe('socket-b');
  });

  it('replaces an existing queue entry for the same socket and removes stale entries', () => {
    const queue = new MatchmakingQueue();

    queue.addToQueue('socket-a', blitz);
    queue.addToQueue('socket-a', rapid);
    queue.addToQueue('socket-b', blitz);

    expect(queue.getQueueSize()).toBe(2);
    expect(queue.getEntry('socket-a')?.timeControl).toEqual(rapid);

    vi.advanceTimersByTime(300_001);
    queue.cleanupStale();

    expect(queue.getQueueSize()).toBe(0);
    expect(queue.isInQueue('socket-a')).toBe(false);
    expect(queue.removeFromQueue('missing-socket')).toBe(false);
  });
});
