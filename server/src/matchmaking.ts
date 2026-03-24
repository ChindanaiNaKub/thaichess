import { TimeControl } from '../../shared/types';

export interface QueueEntry {
  socketId: string;
  userId: string | null;
  timeControl: TimeControl;
  joinedAt: number;
}

export class MatchmakingQueue {
  private queue: QueueEntry[] = [];
  private playerInQueue: Map<string, number> = new Map();

  addToQueue(socketId: string, timeControl: TimeControl, options: { userId?: string | null } = {}): void {
    this.removeFromQueue(socketId);

    this.queue.push({
      socketId,
      userId: options.userId ?? null,
      timeControl,
      joinedAt: Date.now(),
    });
    this.playerInQueue.set(socketId, this.queue.length - 1);
  }

  removeFromQueue(socketId: string): boolean {
    const idx = this.queue.findIndex(e => e.socketId === socketId);
    if (idx >= 0) {
      this.queue.splice(idx, 1);
      this.playerInQueue.delete(socketId);
      this.rebuildIndex();
      return true;
    }
    return false;
  }

  findMatch(socketId: string): QueueEntry | null {
    const entry = this.queue.find(e => e.socketId === socketId);
    if (!entry) return null;

    for (const candidate of this.queue) {
      if (candidate.socketId === socketId) continue;

      if (
        candidate.timeControl.initial === entry.timeControl.initial &&
        candidate.timeControl.increment === entry.timeControl.increment
      ) {
        return candidate;
      }
    }

    const FLEXIBLE_WAIT_MS = 10000;
    if (Date.now() - entry.joinedAt > FLEXIBLE_WAIT_MS) {
      for (const candidate of this.queue) {
        if (candidate.socketId === socketId) continue;

        const timeDiff = Math.abs(candidate.timeControl.initial - entry.timeControl.initial);
        const incDiff = Math.abs(candidate.timeControl.increment - entry.timeControl.increment);
        if (timeDiff <= 120 && incDiff <= 3) {
          return candidate;
        }
      }
    }

    return null;
  }

  isInQueue(socketId: string): boolean {
    return this.queue.some(e => e.socketId === socketId);
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueueSizeForTimeControl(timeControl: TimeControl): number {
    return this.queue.filter(e =>
      e.timeControl.initial === timeControl.initial &&
      e.timeControl.increment === timeControl.increment
    ).length;
  }

  getEntry(socketId: string): QueueEntry | null {
    return this.queue.find(e => e.socketId === socketId) || null;
  }

  getEntries(): QueueEntry[] {
    return [...this.queue];
  }

  cleanupStale(): void {
    const fiveMinutesAgo = Date.now() - 300000;
    this.queue = this.queue.filter(e => e.joinedAt > fiveMinutesAgo);
    this.rebuildIndex();
  }

  private rebuildIndex(): void {
    this.playerInQueue.clear();
    this.queue.forEach((entry, idx) => {
      this.playerInQueue.set(entry.socketId, idx);
    });
  }
}
