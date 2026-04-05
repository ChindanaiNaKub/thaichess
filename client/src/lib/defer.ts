type Cleanup = () => void;

export function scheduleOnUserIntent(task: () => void, timeoutMs = 10_000): Cleanup {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let done = false;
  let timeoutId: number | undefined;
  let idleId: number | undefined;

  const runTask = () => {
    const requestIdle = window.requestIdleCallback;

    if (typeof requestIdle === 'function') {
      idleId = requestIdle(() => {
        idleId = undefined;
        task();
      }, { timeout: 1_500 });
      return;
    }

    timeoutId = window.setTimeout(() => {
      timeoutId = undefined;
      task();
    }, 0);
  };

  const finish = () => {
    if (done) return;
    done = true;
    cleanup();
    runTask();
  };

  const cleanup = () => {
    window.removeEventListener('keyup', finish);
    window.removeEventListener('scroll', finish);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (idleId !== undefined) {
      window.cancelIdleCallback?.(idleId);
      idleId = undefined;
    }
  };

  window.addEventListener('keyup', finish, { once: true });
  window.addEventListener('scroll', finish, { once: true, passive: true });

  timeoutId = window.setTimeout(finish, timeoutMs);
  return cleanup;
}
