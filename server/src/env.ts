import fs from 'fs';
import path from 'path';
import { validateServerEnv } from '../../shared/validation';

let loaded = false;

function parseEnvFile(contents: string): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function getEnvCandidates(): string[] {
  return [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env'),
  ];
}

export function loadProjectEnv(): void {
  if (loaded) return;
  loaded = true;

  for (const candidate of getEnvCandidates()) {
    if (!fs.existsSync(candidate)) continue;

    const parsed = parseEnvFile(fs.readFileSync(candidate, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }

    break;
  }
}

loadProjectEnv();

/**
 * Validate environment variables at startup
 * This ensures all required env vars are present and valid
 * Fails fast with clear error messages if configuration is invalid
 */
const env = validateServerEnv(process.env);

// Export validated environment for use throughout the application
export { env };
