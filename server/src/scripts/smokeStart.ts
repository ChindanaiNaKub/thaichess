import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { setTimeout as delay } from 'timers/promises';
import { spawn } from 'child_process';

const PORT = 3100;
const START_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 250;
const serverEntry = path.resolve(__dirname, '../index.js');
const tempDataDir = mkdtempSync(path.join(tmpdir(), 'thaichess-smoke-'));

const child = spawn(process.execPath, [serverEntry], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(PORT),
    HOST: '127.0.0.1',
    NODE_ENV: 'production',
    AUTH_SECRET: 'smoke-test-auth-secret',
    SITE_URL: `http://127.0.0.1:${PORT}`,
    PUBLIC_SITE_URL: `http://127.0.0.1:${PORT}`,
    DATA_DIR: tempDataDir,
    TURSO_DATABASE_URL: '',
    TURSO_AUTH_TOKEN: '',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';

child.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  stdout += text;
  process.stdout.write(text);
});

child.stderr.on('data', (chunk) => {
  const text = chunk.toString();
  stderr += text;
  process.stderr.write(text);
});

async function waitForHealthyServer() {
  const deadline = Date.now() + START_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Smoke server exited early with code ${child.exitCode}.`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      if (response.ok) {
        const body = await response.json() as { status?: string };
        if (body.status === 'ok') {
          return;
        }
      }
    } catch {
      // Wait for the listener to come up.
    }

    await delay(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting ${START_TIMEOUT_MS}ms for built server health.`);
}

async function main() {
  try {
    await waitForHealthyServer();
  } catch (error) {
    if (stdout.trim().length > 0) {
      console.error('\n--- smoke stdout ---');
      console.error(stdout.trim());
    }
    if (stderr.trim().length > 0) {
      console.error('\n--- smoke stderr ---');
      console.error(stderr.trim());
    }
    throw error;
  } finally {
    child.kill('SIGTERM');
    await delay(500);
    if (child.exitCode === null) {
      child.kill('SIGKILL');
    }
    rmSync(tempDataDir, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
