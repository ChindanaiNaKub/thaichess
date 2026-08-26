import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { I18nProvider } from '../lib/i18n';
import { preloadDetectedTranslations } from '../lib/i18nRuntime';
import { ToastProvider, useToast } from '../lib/toast';
import { TOAST_CONTAINER_CLASS, TOAST_DURATION_MS, TOAST_LIFT_CLASS } from '../lib/toastConstants';

function Probe() {
  const { showToast } = useToast();
  return (
    <div>
      <button type="button" onClick={() => showToast('Saved.', 'success')}>
        success
      </button>
      <button type="button" onClick={() => showToast('Something failed.', 'error')}>
        error
      </button>
    </div>
  );
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ToastProvider>{children}</ToastProvider>
    </I18nProvider>
  );
}

describe('toast', () => {
  beforeEach(async () => {
    await preloadDetectedTranslations();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('anchors toasts above the mobile thumb zone and keeps error toasts longer than success', () => {
    render(<Probe />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'success' }));
    expect(screen.getByText('Saved.')).toBeInTheDocument();
    expect(screen.getByTestId('toast-container')).toHaveClass(...TOAST_CONTAINER_CLASS.split(/\s+/));
    expect(screen.getByTestId('toast-item').className).toContain(TOAST_LIFT_CLASS);
    expect(screen.getByTestId('toast-item').className).not.toMatch(/rgba\(0,0,0,0\.28\)/);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS.success);
    });
    expect(screen.queryByText('Saved.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'error' }));
    expect(screen.getByText('Something failed.')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS.success);
    });
    expect(screen.getByText('Something failed.')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION_MS.error - TOAST_DURATION_MS.success);
    });
    expect(screen.queryByText('Something failed.')).not.toBeInTheDocument();
  });

  it('clears a toast immediately when the player closes it', () => {
    render(<Probe />, { wrapper });

    fireEvent.click(screen.getByRole('button', { name: 'error' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByText('Something failed.')).not.toBeInTheDocument();
  });
});
