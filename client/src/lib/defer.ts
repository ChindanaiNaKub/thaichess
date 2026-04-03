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
    window.removeEventListener('pointerdown', finish);
    window.removeEventListener('keydown', finish);
    window.removeEventListener('touchstart', finish);
    window.removeEventListener('scroll', finish);
    window.removeEventListener('focus', finish);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  };

  window.addEventListener('pointerdown', finish, { once: true, passive: true });
  window.addEventListener('keydown', finish, { once: true });
  window.addEventListener('touchstart', finish, { once: true, passive: true });
  window.addEventListener('scroll', finish, { once: true, passive: true });
  window.addEventListener('focus', finish, { once: true });

  timeoutId = window.setTimeout(finish, timeoutMs);
  return cleanup;
}
