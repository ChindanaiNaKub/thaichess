type Cleanup = () => void;
import { logClientPerfEvent } from './perfDebug';

interface ScheduleOnUserIntentOptions {
  timeoutMs?: number;
  allowTimeout?: boolean;
  label?: string;
}

export function scheduleOnUserIntent(
  task: () => void,
  { timeoutMs = 10_000, allowTimeout = true, label }: ScheduleOnUserIntentOptions = {},
): Cleanup {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let done = false;
  let timeoutId: number | undefined;
  let idleId: number | undefined;

  const runTask = (trigger: 'keyup' | 'scroll' | 'timeout') => {
    if (label) {
      logClientPerfEvent('deferred_task_triggered', {
        label,
        trigger,
      });
    }

    const requestIdle = window.requestIdleCallback;

    if (typeof requestIdle === 'function') {
      idleId = requestIdle(() => {
        idleId = undefined;
        if (label) {
          logClientPerfEvent('deferred_task_running', {
            label,
            trigger,
            scheduler: 'idle',
          });
        }
        task();
      }, { timeout: 1_500 });
      return;
    }

    timeoutId = window.setTimeout(() => {
      timeoutId = undefined;
      if (label) {
        logClientPerfEvent('deferred_task_running', {
          label,
          trigger,
          scheduler: 'timeout',
        });
      }
      task();
    }, 0);
  };

  const finish = (trigger: 'keyup' | 'scroll' | 'timeout') => {
    if (done) return;
    done = true;
    cleanup();
    runTask(trigger);
  };

  const cleanup = () => {
    window.removeEventListener('keyup', handleKeyup);
    window.removeEventListener('scroll', handleScroll);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (idleId !== undefined) {
      window.cancelIdleCallback?.(idleId);
      idleId = undefined;
    }
  };

  const handleKeyup = () => finish('keyup');
  const handleScroll = () => finish('scroll');

  window.addEventListener('keyup', handleKeyup, { once: true });
  window.addEventListener('scroll', handleScroll, { once: true, passive: true });

  if (allowTimeout) {
    timeoutId = window.setTimeout(() => finish('timeout'), timeoutMs);
  }
  return cleanup;
}
