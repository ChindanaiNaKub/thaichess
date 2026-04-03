type Cleanup = () => void;

export function scheduleOnUserIntent(task: () => void, timeoutMs = 10_000): Cleanup {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let done = false;
  let timeoutId: number | undefined;

  const finish = () => {
    if (done) return;
    done = true;
    cleanup();
    task();
  };

  const cleanup = () => {
    window.removeEventListener('click', finish);
    window.removeEventListener('keyup', finish);
    window.removeEventListener('scroll', finish);
    window.removeEventListener('focus', finish);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  };

  window.addEventListener('click', finish, { once: true, passive: true });
  window.addEventListener('keyup', finish, { once: true });
  window.addEventListener('scroll', finish, { once: true, passive: true });
  window.addEventListener('focus', finish, { once: true });

  timeoutId = window.setTimeout(finish, timeoutMs);
  return cleanup;
}
