const DEFAULT_SMOKE_START_TIMEOUT_MS = 45_000;
const DEFAULT_CI_SMOKE_START_TIMEOUT_MS = 90_000;

export function resolveSmokeStartTimeoutMs(
  env: NodeJS.ProcessEnv,
): number {
  const rawValue = env.SMOKE_START_TIMEOUT_MS?.trim();
  if (!rawValue) {
    return env.CI ? DEFAULT_CI_SMOKE_START_TIMEOUT_MS : DEFAULT_SMOKE_START_TIMEOUT_MS;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return env.CI ? DEFAULT_CI_SMOKE_START_TIMEOUT_MS : DEFAULT_SMOKE_START_TIMEOUT_MS;
  }

  return parsedValue;
}
