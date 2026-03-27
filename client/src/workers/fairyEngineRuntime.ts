import {
  type AnalyzedMove,
  type AnalysisEngine,
  type AnalysisProgress,
  type GameAnalysis,
  type MoveClassification,
  classifyMove,
} from '@shared/analysis';
import { createInitialGameState, makeMove } from '@shared/engine';
import type { Move, PieceColor, Position } from '@shared/types';
import { moveToUci, parseUciMove } from '@shared/uci';
// @ts-expect-error Vite handles CJS interop for this package at bundle time.
import StockfishFactory from 'fairy-stockfish-nnue.wasm/stockfish.js';
import stockfishScriptSource from 'fairy-stockfish-nnue.wasm/stockfish.js?raw';
import stockfishWasmUrl from 'fairy-stockfish-nnue.wasm/stockfish.wasm?url';
import stockfishWorkerSource from 'fairy-stockfish-nnue.wasm/stockfish.worker.js?raw';

interface EngineScore {
  kind: 'cp' | 'mate';
  value: number;
}

interface SearchResult {
  bestMove: { from: Position; to: Position } | null;
  scoreWhite: number;
}

type StockfishModule = {
  addMessageListener: (listener: (line: string) => void) => void;
  removeMessageListener: (listener: (line: string) => void) => void;
  postMessage: (message: string) => void;
  terminate?: () => void;
};

let runtimePromise: Promise<FairyEngineRuntime | null> | null = null;
const ENGINE_INIT_TIMEOUT_MS = 8000;
const ENGINE_SEARCH_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function supportsBrowserEngine(): boolean {
  return typeof SharedArrayBuffer !== 'undefined'
    && typeof crossOriginIsolated !== 'undefined'
    && crossOriginIsolated
    && typeof Worker !== 'undefined'
    && typeof WebAssembly !== 'undefined';
}

function normalizeSearchDepth(depth: number): number {
  return Math.max(6, Math.min(8, depth * 2 + 2));
}

function createEmptySummary(): Record<MoveClassification, number> {
  return { best: 0, excellent: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
}

function computeAccuracy(classifications: MoveClassification[]): number {
  if (classifications.length === 0) return 100;

  const weights: Record<MoveClassification, number> = {
    best: 1.0,
    excellent: 0.95,
    good: 0.85,
    inaccuracy: 0.6,
    mistake: 0.3,
    blunder: 0.0,
  };

  const total = classifications.reduce((sum, classification) => sum + weights[classification], 0);
  return Math.round((total / classifications.length) * 100);
}

function normalizeScoreForWhite(score: EngineScore | null, turn: PieceColor): number {
  if (!score) return 0;

  let normalized: number;
  if (score.kind === 'cp') {
    normalized = score.value;
  } else {
    const mateScore = 100000 - Math.min(Math.abs(score.value), 99) * 100;
    normalized = score.value >= 0 ? mateScore : -mateScore;
  }

  return turn === 'white' ? normalized : -normalized;
}

function parseInfoScore(line: string): EngineScore | null {
  const mateMatch = line.match(/\bscore mate (-?\d+)/);
  if (mateMatch) {
    return { kind: 'mate', value: Number(mateMatch[1]) };
  }

  const cpMatch = line.match(/\bscore cp (-?\d+)/);
  if (cpMatch) {
    return { kind: 'cp', value: Number(cpMatch[1]) };
  }

  return null;
}

function parseBestMove(line: string): string | null {
  const match = line.match(/^bestmove\s+(\S+)/);
  if (!match) return null;

  const bestMove = match[1];
  if (bestMove === '(none)' || bestMove === '0000') return null;
  return bestMove;
}

class FairyEngineRuntime {
  constructor(private readonly engine: StockfishModule) {}

  static async create(): Promise<FairyEngineRuntime | null> {
    if (!supportsBrowserEngine()) return null;

    const stockfishScriptUrl = URL.createObjectURL(new Blob([stockfishScriptSource], { type: 'text/javascript' }));
    const stockfishWorkerUrl = URL.createObjectURL(new Blob([stockfishWorkerSource], { type: 'text/javascript' }));
    const cleanupUrls = () => {
      URL.revokeObjectURL(stockfishScriptUrl);
      URL.revokeObjectURL(stockfishWorkerUrl);
    };

    let engine: StockfishModule | null = null;
    try {
      engine = await withTimeout(
        StockfishFactory({
          locateFile: (file: string) => {
            if (file.endsWith('stockfish.wasm')) return stockfishWasmUrl;
            if (file.endsWith('stockfish.worker.js')) return stockfishWorkerUrl;
            return file;
          },
          mainScriptUrlOrBlob: stockfishScriptUrl,
        }) as Promise<StockfishModule>,
        ENGINE_INIT_TIMEOUT_MS,
        'Fairy-Stockfish startup',
      );

      const runtime = new FairyEngineRuntime(engine);
      await withTimeout(runtime.initialize(), ENGINE_INIT_TIMEOUT_MS, 'Fairy-Stockfish initialization');
      return runtime;
    } catch {
      engine?.terminate?.();
      cleanupUrls();
      return null;
    }
  }

  async search(moves: Move[], depth: number): Promise<SearchResult> {
    const moveList = moves.map(moveToUci).join(' ');
    const positionCommand = moveList.length > 0 ? `position startpos moves ${moveList}` : 'position startpos';
    const turn: PieceColor = moves.length % 2 === 0 ? 'white' : 'black';

    let latestScore: EngineScore | null = null;
    let principalVariationMove: string | null = null;

    const bestMoveUci = await withTimeout(
      this.runUntil<string | null>(
        [positionCommand, `go depth ${normalizeSearchDepth(depth)}`],
        (line) => {
          if (line.startsWith('info ')) {
            const score = parseInfoScore(line);
            if (score) latestScore = score;

            const pvMatch = line.match(/\bpv\s+(\S+)/);
            if (pvMatch) principalVariationMove = pvMatch[1];
            return undefined;
          }

          if (line.startsWith('bestmove ')) {
            return parseBestMove(line) ?? principalVariationMove;
          }

          return undefined;
        },
        ENGINE_SEARCH_TIMEOUT_MS,
      ),
      ENGINE_SEARCH_TIMEOUT_MS,
      'Fairy-Stockfish search',
    );

    return {
      bestMove: bestMoveUci ? parseUciMove(bestMoveUci) : null,
      scoreWhite: normalizeScoreForWhite(latestScore, turn),
    };
  }

  private async initialize(): Promise<void> {
    await this.runUntil(['uci'], line => line === 'uciok' ? true : undefined, 15000);

    await this.runUntil(
      [
        'setoption name UCI_Variant value makruk',
        'setoption name Threads value 1',
        'setoption name Hash value 16',
        'setoption name MultiPV value 1',
        'setoption name UCI_AnalyseMode value true',
        'isready',
      ],
      line => line === 'readyok' ? true : undefined,
      15000,
    );
  }

  private runUntil<T>(
    commands: string[],
    onLine: (line: string) => T | undefined,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(new Error('Fairy-Stockfish command timed out'));
      }, timeoutMs);

      const listener = (line: string) => {
        const maybeResult = onLine(line);
        if (typeof maybeResult === 'undefined') return;
        cleanup();
        resolve(maybeResult);
      };

      const cleanup = () => {
        clearTimeout(timer);
        this.engine.removeMessageListener(listener);
      };

      this.engine.addMessageListener(listener);
      for (const command of commands) {
        this.engine.postMessage(command);
      }
    });
  }
}

async function getRuntime(): Promise<FairyEngineRuntime | null> {
  runtimePromise ??= FairyEngineRuntime.create();

  try {
    const runtime = await runtimePromise;
    if (!runtime) {
      runtimePromise = null;
    }
    return runtime;
  } catch {
    runtimePromise = null;
    return null;
  }
}

export async function findBestMoveWithFairyStockfish(
  moves: Move[],
  depth: number,
): Promise<{ from: Position; to: Position } | null> {
  const runtime = await getRuntime();
  if (!runtime) return null;

  try {
    const result = await runtime.search(moves, depth);
    return result.bestMove;
  } catch {
    runtimePromise = null;
    return null;
  }
}

export async function analyzeWithFairyStockfish(
  moves: Move[],
  depth: number,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<GameAnalysis | null> {
  const runtime = await getRuntime();
  if (!runtime) return null;

  try {
    const analyzedMoves: AnalyzedMove[] = [];
    const evaluations: number[] = [];
    const whiteSummary = createEmptySummary();
    const blackSummary = createEmptySummary();
    const whiteClassifications: MoveClassification[] = [];
    const blackClassifications: MoveClassification[] = [];

    let state = createInitialGameState(0, 0);
    let currentSearch = await runtime.search(state.moveHistory, depth);
    evaluations.push(currentSearch.scoreWhite);

    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      const color = state.turn;
      const evalBefore = currentSearch.scoreWhite;
      const bestMove = currentSearch.bestMove;

      const nextState = makeMove(state, move.from, move.to);
      if (!nextState) return null;

      const nextSearch = await runtime.search(nextState.moveHistory, depth);
      const evalAfter = nextSearch.scoreWhite;
      const bestEval = evalBefore;
      const evalDelta = color === 'white' ? bestEval - evalAfter : evalAfter - bestEval;

      const isExactBestMove = Boolean(
        bestMove
        && bestMove.from.row === move.from.row
        && bestMove.from.col === move.from.col
        && bestMove.to.row === move.to.row
        && bestMove.to.col === move.to.col,
      );

      const classification = classifyMove(evalDelta, isExactBestMove);

      analyzedMoves.push({
        move,
        moveIndex: i,
        evalBefore,
        evalAfter,
        evalDelta,
        bestMove,
        bestEval,
        classification,
        color,
      });

      if (color === 'white') {
        whiteSummary[classification]++;
        whiteClassifications.push(classification);
      } else {
        blackSummary[classification]++;
        blackClassifications.push(classification);
      }

      state = nextState;
      currentSearch = nextSearch;
      evaluations.push(evalAfter);
      onProgress?.({ current: i + 1, total: moves.length, done: i === moves.length - 1 });
    }

    return {
      moves: analyzedMoves,
      evaluations,
      engine: 'fairy-stockfish' satisfies AnalysisEngine,
      whiteAccuracy: computeAccuracy(whiteClassifications),
      blackAccuracy: computeAccuracy(blackClassifications),
      summary: { white: whiteSummary, black: blackSummary },
    };
  } catch {
    runtimePromise = null;
    return null;
  }
}
