type PerfDebugDetail = Record<string, string | number | boolean | null | undefined>;

interface PerfDebugEntry {
  event: string;
  ts: number;
  path: string;
  detail?: PerfDebugDetail;
}

declare global {
  interface Window {
    __thaichessPerfDebugInitialized?: boolean;
  }
}

const STORAGE_KEY = 'thaichess-debug-perf';
const MAX_QUEUE_SIZE = 20;
const FLUSH_INTERVAL_MS = 2_000;
const LONG_TASK_THRESHOLD_MS = 50;

let enabled = false;
let queue: PerfDebugEntry[] = [];
let flushTimer: number | undefined;

function trimText(value: string | null | undefined, max = 120) {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!normalized) return undefined;
  return normalized.slice(0, max);
}

function toDetail(value: unknown): string | number | boolean | null | undefined {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.slice(0, 240);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return trimText(String(value), 240);
}

function normalizeDetail(detail: Record<string, unknown> = {}): PerfDebugDetail {
  return Object.fromEntries(
    Object.entries(detail)
      .map(([key, value]) => [key, toDetail(value)])
      .filter(([, value]) => value !== undefined),
  );
}

function isPerfDebugEnabled() {
  if (typeof window === 'undefined') return false;

  const url = new URL(window.location.href);
  const param = url.searchParams.get('debug_perf');
  if (param === '1') {
    window.localStorage.setItem(STORAGE_KEY, '1');
    return true;
  }

  if (param === '0') {
    window.localStorage.removeItem(STORAGE_KEY);
    return false;
  }

  return window.localStorage.getItem(STORAGE_KEY) === '1';
}

function scheduleFlush() {
  if (flushTimer !== undefined || !enabled || typeof window === 'undefined') return;

  flushTimer = window.setTimeout(() => {
    flushTimer = undefined;
    void flushPerfDebugQueue();
  }, FLUSH_INTERVAL_MS);
}

async function postEntries(entries: PerfDebugEntry[]) {
  if (typeof fetch !== 'function' || entries.length === 0) return;

  await fetch('/api/client-debug', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entries,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
    keepalive: true,
  });
}

export async function flushPerfDebugQueue() {
  if (!enabled || queue.length === 0) return;

  const entries = queue.slice(0, MAX_QUEUE_SIZE);
  queue = queue.slice(MAX_QUEUE_SIZE);

  try {
    await postEntries(entries);
  } catch (error) {
    console.error('[perfDebug] Failed to post client perf logs', error);
    queue = [...entries, ...queue].slice(-MAX_QUEUE_SIZE);
  }

  if (queue.length > 0) {
    scheduleFlush();
  }
}

export function logClientPerfEvent(event: string, detail: Record<string, unknown> = {}) {
  if (!enabled || typeof window === 'undefined') return;

  queue.push({
    event,
    ts: Number(performance.now().toFixed(2)),
    path: `${window.location.pathname}${window.location.search}`,
    detail: normalizeDetail(detail),
  });

  if (queue.length >= MAX_QUEUE_SIZE) {
    void flushPerfDebugQueue();
    return;
  }

  scheduleFlush();
}

function observeLongTasks() {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration < LONG_TASK_THRESHOLD_MS) continue;
        logClientPerfEvent('long_task', {
          name: entry.name,
          durationMs: Number(entry.duration.toFixed(2)),
          startMs: Number(entry.startTime.toFixed(2)),
        });
      }
    });

    observer.observe({ type: 'longtask', buffered: true });
  } catch {
    // Not all browsers support longtask entries.
  }
}

function observePaintTimings() {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logClientPerfEvent('paint', {
          name: entry.name,
          startMs: Number(entry.startTime.toFixed(2)),
          durationMs: Number(entry.duration.toFixed(2)),
        });
      }
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch {
    // Not all browsers expose paint entries.
  }
}

function logResourceSummary() {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const resources = entries
    .filter((entry) => entry.name.startsWith(window.location.origin))
    .filter((entry) => entry.initiatorType === 'script' || entry.initiatorType === 'link' || entry.initiatorType === 'css')
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 8);

  for (const entry of resources) {
    const pathname = (() => {
      try {
        return new URL(entry.name).pathname;
      } catch {
        return entry.name;
      }
    })();

    logClientPerfEvent('resource_timing', {
      initiatorType: entry.initiatorType,
      resourcePath: pathname,
      durationMs: Number(entry.duration.toFixed(2)),
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    });
  }
}

function describeClickTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return {};
  }

  return {
    tag: target.tagName.toLowerCase(),
    role: target.getAttribute('role'),
    id: target.id || undefined,
    testId: target.getAttribute('data-testid') || undefined,
    text: trimText(target.textContent),
  };
}

export function initializeClientPerfDebug() {
  if (typeof window === 'undefined' || window.__thaichessPerfDebugInitialized) return;
  window.__thaichessPerfDebugInitialized = true;

  enabled = isPerfDebugEnabled();
  if (!enabled) return;

  logClientPerfEvent('perf_debug_enabled', {
    readyState: document.readyState,
    href: window.location.href,
  });

  window.addEventListener('click', (event) => {
    logClientPerfEvent('click', describeClickTarget(event.target));
  }, { capture: true, passive: true });

  window.addEventListener('load', () => {
    logClientPerfEvent('window_load', {
      readyState: document.readyState,
    });
    window.setTimeout(logResourceSummary, 500);
  }, { once: true });

  window.addEventListener('pagehide', () => {
    void flushPerfDebugQueue();
  });

  observeLongTasks();
  observePaintTimings();
}
