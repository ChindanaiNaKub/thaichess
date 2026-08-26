import type { ToastType } from './toast';

/** Success/info stay brief; errors linger so they can be read under stress. */
export const TOAST_DURATION_MS: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  error: 8000,
};

/** Mobile: top band clears header + thumb chrome; lg+: bottom-right. */
export const TOAST_CONTAINER_CLASS =
  'pointer-events-none fixed inset-x-4 top-[max(5rem,calc(env(safe-area-inset-top)+3.75rem))] z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 lg:inset-x-auto lg:bottom-4 lg:left-auto lg:right-4 lg:top-auto lg:mx-0';

/** Felt Table lift — matches board-frame vocabulary, not SaaS card glow. */
export const TOAST_LIFT_CLASS = 'shadow-[0_10px_24px_oklch(0.10_0.02_65_/_0.14)]';
