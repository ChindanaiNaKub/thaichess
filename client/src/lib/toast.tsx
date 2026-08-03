import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useTranslation } from './i18n';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type: ToastType) => void;
  dismissToast: (id: string) => void;
}

/** Success/info stay brief; errors linger so they can be read under stress. */
export const TOAST_DURATION_MS: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  error: 8000,
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>> | null>(null);
  if (timersRef.current === null) {
    timersRef.current = new Map();
  }
  const timers = timersRef.current;

  const clearToastTimer = useCallback((id: string) => {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
  }, [timers]);

  const dismissToast = useCallback((id: string) => {
    clearToastTimer(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, [clearToastTimer]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, message, type };

    setToasts((prev) => [...prev, toast]);

    const timer = setTimeout(() => {
      timers.delete(id);
      setToasts((prev) => prev.filter((entry) => entry.id !== id));
    }, TOAST_DURATION_MS[type]);
    timers.set(id, timer);
  }, [timers]);

  const value = useMemo<ToastContextValue>(() => ({
    toasts,
    showToast,
    dismissToast,
  }), [toasts, showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/** Mobile: top band clears header + thumb chrome; lg+: bottom-right. */
export const TOAST_CONTAINER_CLASS =
  'pointer-events-none fixed inset-x-4 top-[max(5rem,calc(env(safe-area-inset-top)+3.75rem))] z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 lg:inset-x-auto lg:bottom-4 lg:left-auto lg:right-4 lg:top-auto lg:mx-0';

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      data-testid="toast-container"
      className={TOAST_CONTAINER_CLASS}
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const toastSurfaceClass: Record<ToastType, string> = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-danger/30 bg-danger/10 text-danger',
  info: 'border-surface-hover/80 bg-surface-alt text-text-bright',
};

/** Felt Table lift — matches board-frame vocabulary, not SaaS card glow. */
export const TOAST_LIFT_CLASS = 'shadow-[0_10px_24px_oklch(0.10_0.02_65_/_0.14)]';

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const { t } = useTranslation();

  return (
    <div
      className={`${toastSurfaceClass[toast.type]} pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 ${TOAST_LIFT_CLASS} animate-slideIn`}
      role="alert"
      data-testid="toast-item"
    >
      <span className="min-w-0 flex-1 break-words text-sm font-medium leading-5">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg px-1.5 py-0.5 text-base leading-none opacity-80 transition-opacity hover:opacity-100"
        aria-label={t('common.close')}
      >
        ×
      </button>
    </div>
  );
}
