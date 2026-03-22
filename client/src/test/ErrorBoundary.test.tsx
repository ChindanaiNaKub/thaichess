import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ErrorInfo, ReactNode } from 'react';
import ErrorBoundary from '../components/ErrorBoundary';

const { reportClientErrorMock } = vi.hoisted(() => ({
  reportClientErrorMock: vi.fn(),
}));

vi.mock('../lib/errorReporting', () => ({
  reportClientError: reportClientErrorMock,
}));

vi.mock('../lib/i18n', () => ({
  translate: (key: string) => {
    const messages: Record<string, string> = {
      'error.something_wrong': 'Something went wrong',
      'error.unexpected': 'The app encountered an unexpected error. This has been noted.',
      'error.unknown': 'Unknown error',
      'common.back_home': 'Back to Home',
      'error.reload_page': 'Reload Page',
      'error.report_bug': 'Report this bug on GitHub',
    };

    return messages[key] ?? key;
  },
}));

function renderBoundary(children: ReactNode) {
  return render(<ErrorBoundary>{children}</ErrorBoundary>);
}

describe('ErrorBoundary', () => {
  const reloadMock = vi.fn();
  const originalLocation = window.location;
  const errorInfo = { componentStack: '\n    at BotGame' } as ErrorInfo;

  beforeEach(() => {
    reportClientErrorMock.mockReset();
    reloadMock.mockReset();
    window.sessionStorage.clear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        assign: vi.fn(),
        replace: vi.fn(),
        href: 'http://localhost:5173/',
        reload: reloadMock,
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('reloads once for recoverable chunk-load errors', async () => {
    const boundary = new ErrorBoundary({ children: null });
    boundary.componentDidCatch(
      new Error('TypeError: error loading dynamically imported module: https://thaichess.dev/assets/BotGame-DOAVuS_q.js'),
      errorInfo,
    );

    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem('thaichess:chunk-reload-attempted')).toBe('1');
    expect(reportClientErrorMock).not.toHaveBeenCalled();
  });

  it('shows a helpful message after the automatic reload was already attempted', async () => {
    window.sessionStorage.setItem('thaichess:chunk-reload-attempted', '1');
    const error = new Error('Failed to fetch dynamically imported module');
    const boundary = new ErrorBoundary({ children: null });

    boundary.componentDidCatch(error, errorInfo);
    boundary.state = { hasError: true, error };
    render(<>{boundary.render()}</>);

    expect(await screen.findByText('The app was updated. Reload to get the latest version.')).toBeInTheDocument();
    expect(reloadMock).not.toHaveBeenCalled();
    expect(reportClientErrorMock).toHaveBeenCalledTimes(1);
  });
});
