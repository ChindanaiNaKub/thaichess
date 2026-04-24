type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  event: string;
  correlationId?: string;
  userId?: string;
  gameId?: string;
  [key: string]: unknown;
}

function write(level: LogLevel, payload: LogPayload) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    ...payload,
  });

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(event: string, details: Record<string, unknown> = {}) {
  write('info', { event, ...details });
}

export function logWarn(event: string, details: Record<string, unknown> = {}) {
  write('warn', { event, ...details });
}

export function logError(event: string, error: unknown, details: Record<string, unknown> = {}) {
  const normalized = error instanceof Error
    ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    }
    : {
      message: String(error),
    };

  write('error', {
    event,
    error: normalized,
    ...details,
  });
}
