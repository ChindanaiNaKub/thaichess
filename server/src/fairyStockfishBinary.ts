import fs from 'fs';
import path from 'path';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { logInfo, logWarn } from './logger';
import type { EngineServiceAnalyzeRequest, EngineServiceAnalyzeResponse } from '../../shared/engineAdapter';

const BINARY_PATH_RAW = process.env.FAIRY_STOCKFISH_BINARY_PATH?.trim() || '';
const PROJECT_ROOT_CANDIDATES = [
  process.cwd(),
  path.resolve(process.cwd(), '..'),
  path.resolve(__dirname, '../../'),
  path.resolve(__dirname, '../../../'),
  path.resolve(__dirname, '../../../../'),
];

function resolveBinaryPath(rawPath: string): string {
  if (!rawPath) return '';
  if (path.isAbsolute(rawPath)) return rawPath;

  for (const root of PROJECT_ROOT_CANDIDATES) {
    const candidate = path.resolve(root, rawPath);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(process.cwd(), rawPath);
}

const BINARY_PATH = resolveBinaryPath(BINARY_PATH_RAW);
const ENGINE_HASH_MB = process.env.FAIRY_STOCKFISH_HASH_MB?.trim() || '';
const ENGINE_THREADS = process.env.FAIRY_STOCKFISH_THREADS?.trim() || '';

interface Waiter {
  predicate: (line: string) => boolean;
  resolve: (line: string) => void;
  reject: (error: Error) => void;
  onLine?: (line: string) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface ParsedInfo {
  depth?: number;
  selDepth?: number;
  nodes?: number;
  nps?: number;
  multipv?: number;
  evalCp?: number;
  mate?: number;
  pvUci?: string[];
}

function parseInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeEngineFen(position: string): string {
  const parts = position.trim().split(/\s+/);
  if (parts.length >= 4) return position.trim();
  if (parts.length === 2) {
    return `${parts[0]} ${parts[1]} - - 0 1`;
  }
  return position.trim();
}

function parseInfoLine(line: string): ParsedInfo {
  const tokens = line.trim().split(/\s+/);
  const parsed: ParsedInfo = {};

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === 'depth') parsed.depth = parseInteger(tokens[index + 1]);
    if (token === 'seldepth') parsed.selDepth = parseInteger(tokens[index + 1]);
    if (token === 'nodes') parsed.nodes = parseInteger(tokens[index + 1]);
    if (token === 'nps') parsed.nps = parseInteger(tokens[index + 1]);
    if (token === 'multipv') parsed.multipv = parseInteger(tokens[index + 1]);

    if (token === 'score') {
      const scoreType = tokens[index + 1];
      const scoreValue = parseInteger(tokens[index + 2]);

      if (scoreType === 'cp' && scoreValue !== undefined) {
        parsed.evalCp = scoreValue;
      }

      if (scoreType === 'mate' && scoreValue !== undefined) {
        parsed.mate = scoreValue;
        parsed.evalCp = scoreValue > 0 ? 100000 - Math.abs(scoreValue) : -100000 + Math.abs(scoreValue);
      }
    }

    if (token === 'pv') {
      parsed.pvUci = tokens.slice(index + 1);
      break;
    }
  }

  return parsed;
}

class FairyStockfishBinaryEngine {
  private process: ChildProcessWithoutNullStreams | null = null;
  private buffer = '';
  private ready: Promise<void> | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private waiters = new Set<Waiter>();

  async analyze(request: EngineServiceAnalyzeRequest): Promise<EngineServiceAnalyzeResponse | null> {
    if (!BINARY_PATH) return null;

    const run = async () => {
      try {
        await this.ensureReady();
        return await this.runSearch(request);
      } catch (error) {
        logWarn('engine_binary_failed', {
          message: error instanceof Error ? error.message : String(error),
        });
        this.dispose();
        return null;
      }
    };

    const scheduled = this.queue.then(run, run);
    this.queue = scheduled.then(() => undefined, () => undefined);
    return scheduled;
  }

  private async ensureReady(): Promise<void> {
    if (this.ready) {
      return this.ready;
    }

    this.ready = this.startProcess();
    return this.ready;
  }

  private async startProcess(): Promise<void> {
    this.process = spawn(BINARY_PATH, [], {
      stdio: 'pipe',
    });

    this.process.stdout.setEncoding('utf8');
    this.process.stderr.setEncoding('utf8');

    this.process.stdout.on('data', (chunk: string) => this.handleChunk(chunk));
    this.process.stderr.on('data', (chunk: string) => {
      const message = chunk.trim();
      if (message) {
        logWarn('engine_binary_stderr', { message });
      }
    });
    this.process.on('error', (error) => {
      logWarn('engine_binary_process_error', { message: error.message });
      this.dispose();
    });
    this.process.on('exit', (code, signal) => {
      logWarn('engine_binary_process_exit', { code, signal });
      this.dispose();
    });

    this.send('uci');
    await this.waitFor((line) => line === 'uciok', 5000);

    this.send('setoption name UCI_Variant value makruk');
    if (ENGINE_THREADS) {
      this.send(`setoption name Threads value ${ENGINE_THREADS}`);
    }
    if (ENGINE_HASH_MB) {
      this.send(`setoption name Hash value ${ENGINE_HASH_MB}`);
    }
    this.send('isready');
    await this.waitFor((line) => line === 'readyok', 5000);

    logInfo('engine_binary_ready', { path: BINARY_PATH });
  }

  private async runSearch(request: EngineServiceAnalyzeRequest): Promise<EngineServiceAnalyzeResponse> {
    const multiPv = Math.max(1, request.multipv ?? 1);
    this.send(`setoption name MultiPV value ${multiPv}`);
    this.send('isready');
    await this.waitFor((line) => line === 'readyok', 5000);

    this.send(`position fen ${normalizeEngineFen(request.position)}`);

    let latestInfo: ParsedInfo = {};
    const timeoutMs = request.search.depth || request.search.nodes
      ? 15000
      : Math.max(5000, (request.search.movetimeMs ?? 0) + 5000);
    const bestMovePromise = this.waitFor((line) => line.startsWith('bestmove '), timeoutMs, (line) => {
      if (!line.startsWith('info ')) return;
      const parsed = parseInfoLine(line);
      if ((parsed.multipv ?? 1) === 1) {
        latestInfo = { ...latestInfo, ...parsed };
      }
    });

    this.send(this.buildGoCommand(request.search));
    const bestMoveLine = await bestMovePromise;

    const bestMove = bestMoveLine.split(/\s+/)[1] ?? null;

    return {
      bestMoveUci: bestMove === '(none)' ? null : bestMove,
      pvUci: latestInfo.pvUci ?? [],
      evalCp: latestInfo.evalCp ?? 0,
      mate: latestInfo.mate ?? null,
      depth: latestInfo.depth,
      selDepth: latestInfo.selDepth,
      nodes: latestInfo.nodes,
      nps: latestInfo.nps,
    };
  }

  private buildGoCommand(search: EngineServiceAnalyzeRequest['search']): string {
    if (search.nodes && search.nodes > 0) return `go nodes ${search.nodes}`;
    if (search.depth && search.depth > 0) return `go depth ${search.depth}`;
    return `go movetime ${Math.max(50, search.movetimeMs ?? 400)}`;
  }

  private waitFor(
    predicate: (line: string) => boolean,
    timeoutMs: number,
    onLine?: (line: string) => void,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const waiter: Waiter = {
        predicate,
        resolve: (line) => {
          clearTimeout(waiter.timer);
          this.waiters.delete(waiter);
          resolve(line);
        },
        reject: (error) => {
          clearTimeout(waiter.timer);
          this.waiters.delete(waiter);
          reject(error);
        },
        onLine,
        timer: setTimeout(() => {
          this.send('stop');
          waiter.reject(new Error('Engine response timed out.'));
        }, timeoutMs),
      };

      this.waiters.add(waiter);
    });
  }

  private handleChunk(chunk: string): void {
    this.buffer += chunk;

    while (true) {
      const newlineIndex = this.buffer.indexOf('\n');
      if (newlineIndex < 0) break;

      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);
      if (!line) continue;

      for (const waiter of [...this.waiters]) {
        waiter.onLine?.(line);
        if (waiter.predicate(line)) {
          waiter.resolve(line);
        }
      }
    }
  }

  private send(command: string): void {
    if (!this.process?.stdin.writable) {
      throw new Error('Engine process is not writable.');
    }

    this.process.stdin.write(`${command}\n`);
  }

  private dispose(): void {
    for (const waiter of [...this.waiters]) {
      waiter.reject(new Error('Engine process stopped.'));
    }

    this.waiters.clear();
    this.buffer = '';

    if (this.process) {
      this.process.removeAllListeners();
      this.process.stdout.removeAllListeners();
      this.process.stderr.removeAllListeners();
      if (!this.process.killed) {
        this.process.kill();
      }
    }

    this.process = null;
    this.ready = null;
  }
}

const binaryEngine = new FairyStockfishBinaryEngine();

export function hasBinaryEngineConfigured(): boolean {
  return Boolean(BINARY_PATH);
}

export function getBinaryEnginePath(): string {
  return BINARY_PATH;
}

export async function analyzeWithBinaryEngine(
  request: EngineServiceAnalyzeRequest,
): Promise<EngineServiceAnalyzeResponse | null> {
  return binaryEngine.analyze(request);
}

export { normalizeEngineFen };
