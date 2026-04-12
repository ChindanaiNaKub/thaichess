const DEFAULT_SMOKE_START_TIMEOUT_MS = 45_000;

export function resolveSmokeStartTimeoutMs(
  env: NodeJS.ProcessEnv,
): number {
  const rawValue = env.SMOKE_START_TIMEOUT_MS?.trim();
  if (!rawValue) {
    return DEFAULT_SMOKE_START_TIMEOUT_MS;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_SMOKE_START_TIMEOUT_MS;
  }

  return parsedValue;
}
