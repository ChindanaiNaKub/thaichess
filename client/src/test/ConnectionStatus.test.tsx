import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ConnectionStatus from '../components/ConnectionStatus';

const socketHandlers: Record<string, Array<(...args: unknown[]) => void>> = {};
const ioHandlers: Record<string, Array<(...args: unknown[]) => void>> = {};

vi.mock('../lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../lib/socket', () => ({
  socket: {
    connected: false,
    on: (event: string, handler: (...args: unknown[]) => void) => {
      socketHandlers[event] = socketHandlers[event] ?? [];
      socketHandlers[event].push(handler);
    },
    off: (event: string, handler: (...args: unknown[]) => void) => {
      socketHandlers[event] = (socketHandlers[event] ?? []).filter((entry) => entry !== handler);
    },
    io: {
      on: (event: string, handler: (...args: unknown[]) => void) => {
        ioHandlers[event] = ioHandlers[event] ?? [];
        ioHandlers[event].push(handler);
      },
      off: (event: string, handler: (...args: unknown[]) => void) => {
        ioHandlers[event] = (ioHandlers[event] ?? []).filter((entry) => entry !== handler);
      },
    },
  },
}));

function emitSocket(event: string) {
  for (const handler of socketHandlers[event] ?? []) handler();
}

function emitIo(event: string) {
  for (const handler of ioHandlers[event] ?? []) handler();
}

describe('ConnectionStatus', () => {
  beforeEach(() => {
    Object.keys(socketHandlers).forEach((key) => { delete socketHandlers[key]; });
    Object.keys(ioHandlers).forEach((key) => { delete ioHandlers[key]; });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses Felt success / lacquer / danger washes instead of white-on-lacquer strips', () => {
    render(<ConnectionStatus />);

    act(() => {
      emitSocket('disconnect');
    });
    let banner = screen.getByTestId('connection-status-banner');
    expect(banner).toHaveAttribute('data-status', 'disconnected');
    expect(banner.className).toContain('bg-danger/15');
    expect(banner.className).toContain('text-danger');
    expect(banner.className).not.toContain('text-white');
    expect(banner.className).not.toContain('bg-primary/90');

    act(() => {
      emitIo('reconnect_attempt');
    });
    banner = screen.getByTestId('connection-status-banner');
    expect(banner).toHaveAttribute('data-status', 'connecting');
    expect(banner.className).toContain('bg-primary/15');
    expect(banner.className).toContain('text-primary-light');
    expect(banner.className).not.toContain('text-white');

    act(() => {
      emitSocket('connect');
    });
    banner = screen.getByTestId('connection-status-banner');
    expect(banner).toHaveAttribute('data-status', 'connected');
    expect(banner.className).toContain('bg-success/15');
    expect(banner.className).toContain('text-success');
    expect(banner.className).not.toContain('text-white');
  });
});
