import { forwardRef, useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Position, PieceColor, Move, Board as BoardType, GameState } from '@shared/types';
import { createInitialBoard, posToAlgebraic } from '@shared/engine';
import {
  GameAnalysis, AnalyzedMove, MoveClassification,
  centipawnToWinPercent,
  getClassificationColor, getClassificationSymbol, getClassificationIcon, formatEval,
  AnalysisProgress,
} from '@shared/analysis';
import {
  cloneBoard,
  deserializeAnalysisPosition,
  pieceLabel,
  serializeAnalysisPosition,
  type AnalysisPositionSnapshot,
  type PositionAnalysisResult,
} from '@shared/engineAdapter';
import { buildEditorAnalysisRoute, readInlineAnalysisPayload, requestPositionAnalysis } from '../lib/analysis';
import { DEFAULT_GAME_ANALYSIS_MOVETIME_MS, getGameAnalysisCacheKey, readCachedGameAnalysis, writeCachedGameAnalysis } from '../lib/analysisCache';
import { useTranslation } from '../lib/i18n';
import { useReviewCopy } from '../lib/reviewCopy';
import { usePostGameReview } from '../hooks/usePostGameReview';
import { useReviewEngineAnalysis } from '../hooks/useReviewEngineAnalysis';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow, SquareHighlight, SquareAnnotation } from './Board';
import PieceSVG from './PieceSVG';
import Header from './Header';
import type { WorkerResponse } from '../workers/analysisWorker';
import { gameQueryOptions, type GameAnalysisData } from '../queries/analysis';

type AnalysisMode = 'game' | 'editor';
type EditorTool = 'erase' | 'move' | `${'white' | 'black'}:${'K' | 'M' | 'S' | 'R' | 'N' | 'P' | 'PM'}`;

const DEFAULT_EDITOR_TOOL: EditorTool = 'move';
const REVIEW_MOVETIME_MS = DEFAULT_GAME_ANALYSIS_MOVETIME_MS;

export default function AnalysisPage() {
  const workerRef = useRef<Worker | null>(null);
  const analysisRunKeyRef = useRef<string | null>(null);
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reviewT = useReviewCopy();

  // TanStack Query for fetching game data from API
  const {
    data: apiGameData,
    isLoading: isLoadingApi,
    isError: isApiError,
    error: apiError,
  } = useQuery(gameQueryOptions(gameId));

  const [gameData, setGameData] = useState<GameAnalysisData | null>(null);
  const [mode, setMode] = useState<AnalysisMode>('game');
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [analysisStartedAt, setAnalysisStartedAt] = useState<number | null>(null);
  const [analysisElapsedMs, setAnalysisElapsedMs] = useState(0);
  const [viewAs, setViewAs] = useState<PieceColor>('white');
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [showBestMove, setShowBestMove] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorBoard, setEditorBoard] = useState<BoardType>(() => createInitialBoard());
  const [editorTurn, setEditorTurn] = useState<PieceColor>('white');
  const [editorTool, setEditorTool] = useState<EditorTool>(DEFAULT_EDITOR_TOOL);
  const [editorSelectedSquare, setEditorSelectedSquare] = useState<Position | null>(null);
  const [positionAnalysis, setPositionAnalysis] = useState<PositionAnalysisResult | null>(null);
  const [positionAnalyzing, setPositionAnalyzing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMoveRef = useRef<HTMLElement | null>(null);
  const setActiveMoveElement = useCallback((node: HTMLElement | null) => {
    activeMoveRef.current = node;
  }, []);

  // Load game from URL params (local) or API
  useEffect(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    analysisRunKeyRef.current = null;
    setAnalysis(null);
    setAnalyzing(false);
    setProgress(null);
    setAnalysisStartedAt(null);
    setAnalysisElapsedMs(0);
    setError(null);
    setLoading(true);
    setGameData(null);
    setPositionAnalysis(null);
    setPositionAnalyzing(false);
    setEditorSelectedSquare(null);
    setEditorTool(DEFAULT_EDITOR_TOOL);

    const localMoves = searchParams.get('moves');
    const inlinePayloadKey = searchParams.get('payload');
    const localResult = searchParams.get('result');
    const localReason = searchParams.get('reason');
    const editorMode = searchParams.get('mode') === 'editor' || (!gameId && !localMoves);
    const encodedPosition = searchParams.get('position');
    const encodedCounting = searchParams.get('counting');

    if (editorMode) {
      setMode('editor');
      const snapshot = encodedPosition
        ? deserializeAnalysisPosition(encodedPosition, encodedCounting)
        : null;
      setEditorBoard(snapshot ? cloneBoard(snapshot.board) : createInitialBoard());
      setEditorTurn(snapshot?.turn ?? 'white');
      setLoading(false);
      return;
    }

    const storedInlinePayload = inlinePayloadKey ? readInlineAnalysisPayload(inlinePayloadKey) : null;

    if (storedInlinePayload) {
      setMode('game');
      setGameData({
        id: gameId || storedInlinePayload.source,
        moves: storedInlinePayload.moves,
        result: storedInlinePayload.result || localResult || 'unknown',
        resultReason: storedInlinePayload.reason || localReason || 'unknown',
        moveCount: storedInlinePayload.moves.length,
      });
      setLoading(false);
      return;
    }

    if (localMoves) {
      try {
        const moves = JSON.parse(localMoves) as Move[];
        setMode('game');
        setGameData({
          id: gameId || 'local',
          moves,
          result: localResult || 'unknown',
          resultReason: localReason || 'unknown',
          moveCount: moves.length,
        });
        setLoading(false);
      } catch {
        setError(t('analysis.parse_failed'));
        setLoading(false);
      }
      return;
    }

    // Check if gameId is an inline source that requires sessionStorage data
    const inlineSources = ['bot', 'local'];
    if (gameId && inlineSources.includes(gameId)) {
      // Inline source but no sessionStorage data - show session expired error
      setError(t('analysis.session_expired'));
      setLoading(false);
      return;
    }

    if (gameId) {
      setMode('game');
      // Data will be set by the apiGameData effect below
    } else {
      setMode('editor');
      setLoading(false);
    }
  }, [gameId, searchParams, t, isLoadingApi, isApiError]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  // Handle API game data from TanStack Query
  useEffect(() => {
    if (!gameId || mode !== 'game') return;

    if (isLoadingApi) {
      setLoading(true);
      return;
    }

    if (isApiError) {
      setError(t('analysis.game_not_found'));
      setLoading(false);
      return;
    }

    if (apiGameData) {
      if (apiGameData.moves) {
        setGameData({
          id: apiGameData.id,
          moves: apiGameData.moves,
          result: apiGameData.result || apiGameData.status || 'unknown',
          resultReason: apiGameData.resultReason || '',
          moveCount: apiGameData.moveCount || apiGameData.moves.length,
        });
      } else {
        setError(t('analysis.no_moves'));
      }
      setLoading(false);
    }
  }, [gameId, mode, apiGameData, isLoadingApi, isApiError, t]);

  // Run analysis when game data is loaded
  useEffect(() => {
    if (mode !== 'game' || !gameData || analysis) return;

    const cacheKey = getAnalysisCacheKey(gameData, REVIEW_MOVETIME_MS);

    if (analysisRunKeyRef.current === cacheKey) return;
    analysisRunKeyRef.current = cacheKey;

    setAnalyzing(true);
    setProgress(null);
    setAnalysisStartedAt(Date.now());
    setAnalysisElapsedMs(0);
    const cached = readCachedAnalysis(cacheKey);
    if (cached) {
        setAnalysis(cached);
        setAnalyzing(false);
        setAnalysisStartedAt(null);
        return;
      }

    workerRef.current?.terminate();
    const worker = new Worker(new URL('../workers/analysisWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === 'progress') {
        setProgress({ ...message.progress });
        return;
      }

      if (message.type === 'result') {
        writeCachedAnalysis(cacheKey, message.analysis);
        setAnalysis(message.analysis);
        setAnalyzing(false);
        setProgress(null);
        setAnalysisStartedAt(null);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        return;
      }

      setError(message.message || t('analysis.failed'));
      setAnalyzing(false);
      setProgress(null);
      setAnalysisStartedAt(null);
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };

    worker.postMessage({ type: 'analyze', moves: gameData.moves, movetimeMs: REVIEW_MOVETIME_MS, depth: 2 });

    return () => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
  }, [analysis, gameData, mode, t]);

  useEffect(() => {
    if (!analyzing || analysisStartedAt === null) {
      setAnalysisElapsedMs(0);
      return;
    }

    setAnalysisElapsedMs(Date.now() - analysisStartedAt);
    const timer = window.setInterval(() => {
      setAnalysisElapsedMs(Date.now() - analysisStartedAt);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [analysisStartedAt, analyzing]);

  const review = usePostGameReview({
    enabled: mode === 'game' && Boolean(gameData),
    mainLine: gameData?.moves ?? [],
  });
  const currentPlyIndex = review.selectedMainLineMoveIndex;
  const highlightedMainLineMoveIndex = review.mode === 'analysis'
    ? review.analysisRootMoveIndex ?? review.selectedMainLineMoveIndex
    : review.selectedMainLineMoveIndex;

  const navigateBackward = useCallback(() => {
    if (review.mode === 'analysis' && review.selectedAnalysisMoveIndex < 0) {
      const rootIndex = review.analysisRootMoveIndex ?? review.selectedMainLineMoveIndex;
      review.jumpToAnalysisRoot(rootIndex - 1);
      return;
    }

    review.stepBackward();
  }, [review]);

  const navigateForward = useCallback(() => {
    if (
      review.mode === 'analysis'
      && review.selectedAnalysisMoveIndex < 0
      && review.analysisLine.length === 0
    ) {
      const rootIndex = review.analysisRootMoveIndex ?? review.selectedMainLineMoveIndex;
      review.jumpToAnalysisRoot(rootIndex + 1);
      return;
    }

    review.stepForward();
  }, [review]);

  const navigateToStart = useCallback(() => {
    if (review.mode === 'analysis') {
      review.jumpToAnalysisRoot(-1);
      return;
    }

    review.jumpToStart();
  }, [review]);

  const navigateToEnd = useCallback(() => {
    if (review.mode === 'analysis') {
      review.jumpToAnalysisRoot((gameData?.moves.length ?? 0) - 1);
      return;
    }

    review.jumpToEnd();
  }, [gameData?.moves.length, review]);

  // Keyboard navigation
  useEffect(() => {
    if (!gameData) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableKeyboardTarget(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateBackward();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        navigateForward();
      } else if (e.key === 'Home') {
        e.preventDefault();
        navigateToStart();
      } else if (e.key === 'End') {
        e.preventDefault();
        navigateToEnd();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [gameData, navigateBackward, navigateForward, navigateToEnd, navigateToStart]);

  // Auto-scroll active move within the move list container only (never scroll the page).
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // When viewing the initial position, reset move list to top
    if (review.mode === 'mainLine' && currentPlyIndex < 0) {
      container.scrollTop = 0;
      return;
    }

    const el = activeMoveRef.current;
    if (!el) return;

    const frame = window.requestAnimationFrame(() => {
      // Use bounding boxes (not offsetTop) to avoid incorrect math when
      // grid/contents layout changes the offset parent.
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const topDelta = elRect.top - containerRect.top;
      const bottomDelta = elRect.bottom - containerRect.bottom;

      if (topDelta < 0) {
        container.scrollTop += topDelta - 12;
      } else if (bottomDelta > 0) {
        container.scrollTop += bottomDelta + 12;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    currentPlyIndex,
    highlightedMainLineMoveIndex,
    review.analysisLine.length,
    review.mode,
    review.selectedAnalysisMoveIndex,
  ]);

  const currentReviewSnapshot = useMemo<AnalysisPositionSnapshot | null>(() => (
    gameData
      ? {
          board: review.currentState.board,
          turn: review.currentState.turn,
          counting: review.currentState.counting,
        }
      : null
  ), [gameData, review.currentState.board, review.currentState.counting, review.currentState.turn]);

  const {
    analysis: currentPositionAnalysis,
    analyzing: currentPositionAnalyzing,
    error: currentPositionError,
  } = useReviewEngineAnalysis({
    enabled: mode === 'game' && Boolean(gameData),
    snapshot: currentReviewSnapshot,
  });

  const editorSnapshot = useMemo<AnalysisPositionSnapshot>(() => ({
    board: editorBoard,
    turn: editorTurn,
    counting: null,
  }), [editorBoard, editorTurn]);

  const handleAnalyzeEditorPosition = useCallback(async () => {
    setPositionAnalyzing(true);
    setError(null);

    try {
      const result = await requestPositionAnalysis(editorSnapshot, {
        movetimeMs: 700,
        multipv: 1,
      });
      setPositionAnalysis(result);
    } catch {
      setError(t('analysis.editor.error'));
    } finally {
      setPositionAnalyzing(false);
    }
  }, [editorSnapshot, t]);

  const handleEditorSquareClick = useCallback((pos: Position) => {
    setEditorBoard(prev => {
      const next = cloneBoard(prev);

      if (editorTool === 'erase') {
        next[pos.row][pos.col] = null;
        setEditorSelectedSquare(null);
        return next;
      }

      if (editorTool !== 'move') {
        const [color, type] = editorTool.split(':') as ['white' | 'black', 'K' | 'M' | 'S' | 'R' | 'N' | 'P' | 'PM'];
        next[pos.row][pos.col] = { color, type };
        setEditorSelectedSquare(null);
        return next;
      }

      if (!editorSelectedSquare) {
        setEditorSelectedSquare(next[pos.row][pos.col] ? pos : null);
        return next;
      }

      const movingPiece = next[editorSelectedSquare.row][editorSelectedSquare.col];
      if (!movingPiece) {
        setEditorSelectedSquare(null);
        return next;
      }

      next[editorSelectedSquare.row][editorSelectedSquare.col] = null;
      next[pos.row][pos.col] = movingPiece;
      setEditorSelectedSquare(null);
      return next;
    });
  }, [editorSelectedSquare, editorTool]);

  const handleEditorPieceDrop = useCallback((from: Position, to: Position) => {
    setEditorBoard(prev => {
      const next = cloneBoard(prev);
      const movingPiece = next[from.row][from.col];
      if (!movingPiece) return prev;

      next[from.row][from.col] = null;
      next[to.row][to.col] = movingPiece;
      return next;
    });
    setEditorSelectedSquare(null);
    setEditorTool(DEFAULT_EDITOR_TOOL);
  }, []);

  const handleCopyEditorPosition = useCallback(async () => {
    const serialized = serializeAnalysisPosition(editorSnapshot);
    await navigator.clipboard.writeText(serialized.position);
  }, [editorSnapshot]);

  const handleCopyEditorLink = useCallback(async () => {
    const url = new URL(buildEditorAnalysisRoute(editorSnapshot), window.location.origin);
    await navigator.clipboard.writeText(url.toString());
  }, [editorSnapshot]);

  const analysisArrows = useMemo((): Arrow[] => {
    if (review.mode !== 'mainLine' || !analysis || currentPlyIndex < 0 || currentPlyIndex >= analysis.moves.length) return [];
    const analyzed = analysis.moves[currentPlyIndex];
    const result: Arrow[] = [];

    if (showBestMove && analyzed.bestMove) {
      const cls = analyzed.classification;
      if (cls === 'inaccuracy' || cls === 'mistake' || cls === 'blunder') {
        result.push({
          from: analyzed.bestMove.from,
          to: analyzed.bestMove.to,
          color: '#56b33080',
        });
      }
    }

    return result;
  }, [analysis, currentPlyIndex, review.mode, showBestMove]);

  const analysisHighlights = useMemo((): SquareHighlight[] => {
    if (review.mode !== 'mainLine' || !analysis || currentPlyIndex < 0 || currentPlyIndex >= analysis.moves.length) return [];
    const analyzed = analysis.moves[currentPlyIndex];
    const cls = analyzed.classification;
    const color = getClassificationColor(cls);

    const highlights: SquareHighlight[] = [
      { pos: analyzed.move.to, color: `${color}40` },
      { pos: analyzed.move.from, color: `${color}25` },
    ];

    if (showBestMove && analyzed.bestMove && (cls === 'inaccuracy' || cls === 'mistake' || cls === 'blunder')) {
      highlights.push({ pos: analyzed.bestMove.to, color: '#56b33030' });
    }

    return highlights;
  }, [analysis, currentPlyIndex, review.mode, showBestMove]);

  const analysisAnnotations = useMemo((): SquareAnnotation[] => {
    if (review.mode !== 'mainLine' || !analysis || currentPlyIndex < 0 || currentPlyIndex >= analysis.moves.length) return [];
    const analyzed = analysis.moves[currentPlyIndex];
    const cls = analyzed.classification;

    const annotations: SquareAnnotation[] = [{
      pos: analyzed.move.to,
      icon: getClassificationIcon(cls),
      bgColor: getClassificationColor(cls),
    }];

    if (showBestMove && analyzed.bestMove && (cls === 'inaccuracy' || cls === 'mistake' || cls === 'blunder')) {
      annotations.push({
        pos: analyzed.bestMove.to,
        icon: '⭐',
        bgColor: '#56b330',
      });
    }

    return annotations;
  }, [analysis, currentPlyIndex, review.mode, showBestMove]);

  const currentAnalyzedMove = useMemo((): AnalyzedMove | null => {
    if (review.mode !== 'mainLine' || !analysis || currentPlyIndex < 0 || currentPlyIndex >= analysis.moves.length) return null;
    return analysis.moves[currentPlyIndex];
  }, [analysis, currentPlyIndex, review.mode]);

  const fallbackEval = useMemo((): number => {
    if (!analysis) return 0;
    const evalIdx = currentPlyIndex + 1;
    if (evalIdx < 0 || evalIdx >= analysis.evaluations.length) return 0;
    return analysis.evaluations[evalIdx];
  }, [analysis, currentPlyIndex]);

  const currentEval = currentPositionAnalysis?.evaluation ?? fallbackEval;
  const currentWinningChances = useMemo(() => {
    const white = Math.round(centipawnToWinPercent(currentEval));
    return {
      white,
      black: 100 - white,
    };
  }, [currentEval]);
  const currentBestMoveText = currentPositionAnalysis?.bestMove
    ? `${posToAlgebraic(currentPositionAnalysis.bestMove.from)}-${posToAlgebraic(currentPositionAnalysis.bestMove.to)}`
    : t('analysis.editor.none');

  const analysisElapsedSeconds = Math.max(1, Math.floor(analysisElapsedMs / 1000));
  const showSlowAnalysisHint = analyzing && analysisElapsedSeconds >= 15;
  const reviewIsProvisional = analysis?.engine?.confidence === 'provisional';

  const handleMoveClick = useCallback((index: number) => {
    if (review.mode === 'analysis') {
      review.jumpToAnalysisRoot(index);
      return;
    }

    review.jumpToMainLine(index);
  }, [review]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div data-testid="analysis-loading" className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-dim">{t('analysis.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center p-4">
          <div data-testid="analysis-error" className="bg-surface-alt border border-surface-hover rounded-xl p-6 max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 data-testid="analysis-error-title" className="text-lg font-bold text-danger mb-2">{t('game.error')}</h2>
            <p data-testid="analysis-error-message" className="text-text-dim mb-4">{error}</p>
            <button data-testid="analysis-back-home" onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold">
              {t('common.back_home')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'editor') {
    const editorArrow = positionAnalysis?.bestMove
      ? [{
          from: positionAnalysis.bestMove.from,
          to: positionAnalysis.bestMove.to,
          color: '#56b33080',
        }]
      : [];
    const serialized = serializeAnalysisPosition(editorSnapshot);

    return (
      <div className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
        <Header subtitle={t('analysis.title')} />

        <main id="main-content" className="flex-1 flex items-start justify-center px-4 py-4 overflow-y-auto">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 w-full max-w-[1200px]">
            <div className="flex gap-2 w-full lg:flex-1 lg:max-w-[calc(100vh-140px)] max-w-[720px] lg:sticky lg:top-4 lg:self-start">
              <EvalBar eval={positionAnalysis?.evaluation ?? 0} />

              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex items-center gap-2 text-sm w-full justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-text-dim">{t('analysis.editor.label')}</span>
                    <button
                      onClick={() => setEditorTurn('white')}
                      className={`px-3 py-1 rounded text-xs ${editorTurn === 'white' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                    >
                      {t('analysis.editor.turn_to_move', { color: t('common.white') })}
                    </button>
                    <button
                      onClick={() => setEditorTurn('black')}
                      className={`px-3 py-1 rounded text-xs ${editorTurn === 'black' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                    >
                      {t('analysis.editor.turn_to_move', { color: t('common.black') })}
                    </button>
                  </div>
                  <div className="text-text-dim text-xs">{formatEval(positionAnalysis?.evaluation ?? 0)}</div>
                </div>

                <BoardErrorBoundary onRetry={() => window.location.reload()}>
                  <Board
                    board={editorBoard}
                    playerColor={viewAs}
                    draggableColor={null}
                    allowAnyPieceDrag={editorTool === 'move'}
                    isMyTurn={true}
                    legalMoves={[]}
                    selectedSquare={editorSelectedSquare}
                    lastMove={null}
                    isCheck={false}
                    checkSquare={null}
                    onSquareClick={handleEditorSquareClick}
                    onPieceDrop={handleEditorPieceDrop}
                    disabled={false}
                    arrows={[...editorArrow, ...arrows]}
                    onArrowsChange={setArrows}
                  />
                </BoardErrorBoundary>

                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setEditorBoard(createInitialBoard())}
                    className="flex-1 rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text"
                  >
                    {t('analysis.editor.reset_board')}
                  </button>
                  <button
                    onClick={() => setEditorBoard(Array.from({ length: 8 }, () => Array(8).fill(null)))}
                    className="flex-1 rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text"
                  >
                    {t('analysis.editor.clear_board')}
                  </button>
                  <button
                    onClick={handleAnalyzeEditorPosition}
                    disabled={positionAnalyzing}
                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {positionAnalyzing ? t('analysis.editor.analyzing_position') : t('analysis.editor.analyze_position')}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-80 w-full max-w-[720px] lg:self-start">
              <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.tools')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditorTool('move')}
                    className={`rounded-lg border px-3 py-2 text-sm ${editorTool === 'move' ? 'border-primary bg-primary/15 text-primary-light' : 'border-surface-hover bg-surface-alt text-text'}`}
                  >
                    {t('analysis.editor.move_pieces')}
                  </button>
                  <button
                    onClick={() => setEditorTool('erase')}
                    className={`rounded-lg border px-3 py-2 text-sm ${editorTool === 'erase' ? 'border-primary bg-primary/15 text-primary-light' : 'border-surface-hover bg-surface-alt text-text'}`}
                  >
                    {t('analysis.editor.erase_square')}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(['white', 'black'] as const).flatMap(color => (
                    (['K', 'M', 'S', 'R', 'N', 'P', 'PM'] as const).map(type => {
                      const tool = `${color}:${type}` as EditorTool;

                      return (
                        <button
                          key={tool}
                          onClick={() => setEditorTool(tool)}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-sm ${editorTool === tool ? 'border-primary bg-primary/15 text-primary-light' : 'border-surface-hover bg-surface-alt text-text'}`}
                        >
                          <PieceSVG type={type} color={color} size={22} />
                          <span className="font-mono text-xs">{pieceLabel({ type, color })}</span>
                        </button>
                      );
                    })
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.position')}</h3>
                <textarea
                  readOnly
                  value={serialized.position}
                  className="min-h-24 w-full rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 font-mono text-xs text-text"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={handleCopyEditorPosition} className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text">
                    {t('analysis.editor.copy_position')}
                  </button>
                  <button onClick={handleCopyEditorLink} className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text">
                    {t('analysis.editor.copy_link')}
                  </button>
                </div>
              </div>

              {positionAnalysis && (
                <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                  <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.engine')}</h3>
                  <div className="space-y-2 text-sm text-text">
                    <div className="flex items-center justify-between">
                      <span>{t('analysis.editor.eval')}</span>
                      <span className="font-mono text-text-bright">{formatEval(positionAnalysis.evaluation)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('analysis.editor.best_move')}</span>
                      <span className="font-mono text-text-bright">
                        {positionAnalysis.bestMove
                          ? `${posToAlgebraic(positionAnalysis.bestMove.from)}-${posToAlgebraic(positionAnalysis.bestMove.to)}`
                          : t('analysis.editor.none')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('analysis.editor.source')}</span>
                      <span className="text-text-bright">{positionAnalysis.stats.source}</span>
                    </div>
                    {positionAnalysis.stats.depth && (
                      <div className="flex items-center justify-between">
                        <span>{t('analysis.editor.depth')}</span>
                        <span className="font-mono text-text-bright">{positionAnalysis.stats.depth}</span>
                      </div>
                    )}
                    {positionAnalysis.principalVariation.length > 0 && (
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-[0.18em] text-text-dim">{t('analysis.editor.pv')}</div>
                        <div className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 font-mono text-xs text-text">
                          {positionAnalysis.principalVariation.join(' ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setViewAs(viewAs === 'white' ? 'black' : 'white')}
                  className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text"
                >
                  Flip board
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"
                >
                  {t('common.back_home')}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!gameData) return null;

  const movePairs = buildMovePairs(gameData.moves, analysis);
  const analysisVariationsByRoot = new Map(
    review.analysisVariations.map((variation) => [variation.rootMoveIndex, variation.line]),
  );
  const renderVariationLine = (rootMoveIndex: number) => {
    const analysisLine = analysisVariationsByRoot.get(rootMoveIndex);
    if (!analysisLine) return null;

    const isActiveVariation = review.mode === 'analysis' && review.analysisRootMoveIndex === rootMoveIndex;

    return (
      <div key={`variation-${rootMoveIndex}`} className="col-span-3 pb-1">
        <VariationLine
          ref={isActiveVariation && review.selectedAnalysisMoveIndex >= 0 ? setActiveMoveElement : undefined}
          rootMoveIndex={rootMoveIndex}
          analysisLine={analysisLine}
          selectedMoveIndex={isActiveVariation ? review.selectedAnalysisMoveIndex : -1}
          onSelectMove={(moveIndex) => review.jumpToAnalysisVariationMove(rootMoveIndex, moveIndex)}
          t={reviewT}
        />
      </div>
    );
  };

  return (
    <div data-testid="analysis-game-view" className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
      <Header subtitle={t('analysis.title')} />

      <main id="main-content" className="flex-1 flex items-start justify-center px-4 py-4 overflow-y-auto">
        <div className="grid w-full max-w-[1400px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(30rem,36rem)] xl:grid-cols-[minmax(0,1fr)_38rem] lg:items-start">
          {/* Board + Eval Bar (sticky on desktop) */}
          <div className="flex gap-2 w-full max-w-[760px] lg:max-w-[calc(100vh-6rem)] lg:sticky lg:top-4 lg:self-start">
            {/* Eval Bar */}
            <EvalBar eval={currentEval} />

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {/* View controls */}
              <div className="flex items-center gap-2 text-sm w-full justify-between rounded-lg border border-surface-hover bg-surface-alt/80 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-text-dim text-xs">{t('local.view_as')}</span>
                  <button
                    onClick={() => setViewAs('white')}
                    className={`px-3 py-1 rounded text-xs ${viewAs === 'white' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                  >
                    {t('common.white')}
                  </button>
                  <button
                    onClick={() => setViewAs('black')}
                    className={`px-3 py-1 rounded text-xs ${viewAs === 'black' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                  >
                    {t('common.black')}
                  </button>
                </div>
                <div className="text-text-dim text-xs">
                  {formatEval(currentEval)}
                </div>
              </div>

              {/* Board */}
              <BoardErrorBoundary onRetry={() => window.location.reload()}>
                <Board
                  board={review.currentState.board}
                  playerColor={viewAs}
                  draggableColor={review.currentState.turn}
                  isMyTurn={review.mode === 'analysis'}
                  legalMoves={review.mode === 'analysis' ? review.legalMoves : []}
                  selectedSquare={review.mode === 'analysis' ? review.selectedSquare : null}
                  lastMove={review.currentLastMove}
                  isCheck={review.currentState.isCheck}
                  checkSquare={review.currentCheckSquare}
                  onSquareClick={review.handleSquareClick}
                  onPieceDrop={review.handlePieceDrop}
                  disabled={review.mode !== 'analysis'}
                  arrows={[...analysisArrows, ...arrows]}
                  onArrowsChange={setArrows}
                  squareHighlights={analysisHighlights}
                  squareAnnotations={analysisAnnotations}
                />
              </BoardErrorBoundary>

              {/* Nav buttons */}
              <div className="flex items-center justify-center gap-1 rounded-lg border border-surface-hover bg-surface-alt/80 px-2 py-1.5">
                <button
                  onClick={navigateToStart}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ⏮
                </button>
                <button
                  onClick={navigateBackward}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ◀
                </button>
                <button
                  onClick={navigateForward}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ▶
                </button>
                <button
                  onClick={navigateToEnd}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ⏭
                </button>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="flex min-w-0 flex-col gap-2 w-full max-w-[760px] lg:h-[calc(100dvh-6rem)] lg:self-start lg:sticky lg:top-4 lg:overflow-hidden">
            <div className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-surface overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.16)] lg:flex-1">
              <div className="shrink-0 px-3 py-2 border-b border-surface-hover flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-semibold text-text-bright">{t('moves.title')}</h3>
                    {review.mode === 'analysis' && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-light">
                        {reviewT('review.analysis_branch')}
                      </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                  {analysis && (
                    <label className="flex items-center gap-1.5 text-[11px] text-text cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={showBestMove}
                        onChange={e => setShowBestMove(e.target.checked)}
                        className="w-3.5 h-3.5 rounded accent-primary"
                      />
                      {t('analysis.show_best')}
                    </label>
                  )}
                  <div className="hidden sm:flex items-center gap-1">
                    <button
                      onClick={navigateToStart}
                      className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    >
                      ⏮
                    </button>
                    <button
                      onClick={navigateBackward}
                      className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    >
                      ◀
                    </button>
                    <button
                      onClick={navigateForward}
                      className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    >
                      ▶
                    </button>
                    <button
                      onClick={navigateToEnd}
                      className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    >
                      ⏭
                    </button>
                  </div>
                </div>
              </div>
              <div ref={scrollRef} data-testid="analysis-move-list" className="max-h-[460px] min-h-[12rem] overflow-y-auto p-1.5 lg:min-h-0 lg:max-h-none lg:flex-1">
                {movePairs.length === 0 ? (
                  <div className="text-text-dim text-sm text-center py-4">{t('moves.empty')}</div>
                ) : (
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 text-[15px] leading-6">
                    {renderVariationLine(-1)}
                    {movePairs.map(({ num, white, black, whiteIdx, blackIdx, whiteClass, blackClass }, pairIndex) => (
                      <div key={num} className="contents">
                        <span className="text-text px-2 py-1 text-right">{num}.</span>
                        <span
                          ref={highlightedMainLineMoveIndex === whiteIdx ? setActiveMoveElement : undefined}
                          data-testid={`analysis-main-move-${whiteIdx}`}
                          className={`px-2 py-1 font-mono rounded cursor-pointer transition-colors ${
                            highlightedMainLineMoveIndex === whiteIdx ? 'move-active shadow-[inset_0_0_0_1px_rgba(134,204,99,0.2)]' : 'move-clickable'
                          }`}
                          onClick={() => handleMoveClick(whiteIdx)}
                        >
                          <span className="text-text-bright">{white}</span>
                          {whiteClass && (
                            <span className="ml-0.5 text-xs font-bold" style={{ color: getClassificationColor(whiteClass) }}>
                              {getClassificationSymbol(whiteClass)}
                            </span>
                          )}
                        </span>
                        <span
                          ref={highlightedMainLineMoveIndex === blackIdx ? setActiveMoveElement : undefined}
                          data-testid={black ? `analysis-main-move-${blackIdx}` : undefined}
                          className={`px-2 py-1 font-mono rounded ${
                            black
                              ? highlightedMainLineMoveIndex === blackIdx ? 'move-active cursor-pointer shadow-[inset_0_0_0_1px_rgba(134,204,99,0.2)]' : 'move-clickable cursor-pointer'
                              : ''
                          }`}
                          onClick={() => black && handleMoveClick(blackIdx)}
                        >
                          {black && (
                            <>
                              <span className="text-text-bright">{black}</span>
                              {blackClass && (
                                <span className="ml-0.5 text-xs font-bold" style={{ color: getClassificationColor(blackClass) }}>
                                  {getClassificationSymbol(blackClass)}
                                </span>
                              )}
                            </>
                          )}
                        </span>
                        {review.analysisVariations
                          .filter((variation) => variation.rootMoveIndex >= 0 && Math.floor(variation.rootMoveIndex / 2) === pairIndex)
                          .map((variation) => renderVariationLine(variation.rootMoveIndex))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 border-t border-surface-hover px-2.5 py-2 flex flex-wrap items-center gap-2">
                {review.mode === 'analysis' ? (
                  <>
                    <button
                      onClick={review.returnToMainLine}
                      className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-1.5 text-xs font-semibold text-text-bright transition-colors hover:bg-surface-hover"
                    >
                      {reviewT('review.return_to_game')}
                    </button>
                    <button
                      onClick={review.resetAnalysis}
                      disabled={!review.canResetAnalysis}
                      className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-light transition-colors hover:bg-primary/15 disabled:opacity-50"
                    >
                      {reviewT('review.reset_variation')}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={review.enterAnalysis}
                    disabled={!review.canEnterAnalysis}
                    data-testid="analysis-enter-analysis"
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-light disabled:opacity-50"
                  >
                    {reviewT('review.enter_analysis')}
                  </button>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <CompactEnginePanel
                currentPlyIndex={currentPlyIndex}
                moveCount={gameData.moves.length}
                currentEval={currentEval}
                winningChances={currentWinningChances}
                turn={review.currentState.turn}
                bestMoveText={currentBestMoveText}
                principalVariation={currentPositionAnalysis?.principalVariation ?? []}
                analyzing={currentPositionAnalyzing}
                error={currentPositionError}
                reviewMode={review.mode}
                currentAnalyzedMove={currentAnalyzedMove}
                reviewIsProvisional={reviewIsProvisional}
                analyzingGame={analyzing}
                progress={progress}
                analysisElapsedSeconds={analysisElapsedSeconds}
                t={t}
                reviewT={reviewT}
              />
            </div>

            {analysis && analysis.evaluations.length > 1 && (
              <div className="shrink-0 rounded-xl border border-white/10 bg-surface p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <EvalGraph
                  evaluations={analysis.evaluations}
                  moves={analysis.moves}
                  currentIndex={currentPlyIndex}
                  onClickIndex={handleMoveClick}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function EvalBar({ eval: rawEval }: { eval: number }) {
  const clamped = Math.max(-2000, Math.min(2000, rawEval));
  const whitePercent = 50 + (clamped / 2000) * 50;
  const isWhiteAdvantage = rawEval >= 0;

  return (
    <div className="eval-bar w-6 sm:w-7 rounded-lg overflow-hidden flex flex-col relative shadow-[0_10px_20px_rgba(0,0,0,0.18)]" style={{ minHeight: '100%' }}>
      <div
        className="transition-all duration-500 ease-out"
        style={{ backgroundColor: 'oklch(0.23 0.015 65)', height: `${100 - whitePercent}%` }}
      />
      <div
        className="transition-all duration-500 ease-out"
        style={{ backgroundColor: 'oklch(0.93 0.01 65)', height: `${whitePercent}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[9px] font-bold tracking-[0.08em]"
          style={{
            color: isWhiteAdvantage ? 'oklch(0.16 0.015 65)' : 'oklch(0.92 0.01 65)',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
          }}
        >
          {formatEval(rawEval)}
        </span>
      </div>
    </div>
  );
}

function AccuracyCard({
  color, accuracy, summary, t,
}: {
  color: PieceColor;
  accuracy: number;
  summary: Record<MoveClassification, number>;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const classifications: MoveClassification[] = ['best', 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'];

  return (
    <div className="rounded-xl border border-white/8 bg-surface-hover/70 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <PieceSVG type="K" color={color} size={18} />
        <span className="text-xs font-medium text-text">{t(color === 'white' ? 'common.white' : 'common.black')}</span>
      </div>
      <div className="text-2xl font-bold text-text-bright mb-2">{accuracy}%</div>
      <div className="space-y-1">
        {classifications.map(cls => {
          const count = summary[cls];
          if (count === 0 && (cls === 'excellent')) return null;
          return (
            <div key={cls} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block ring-1 ring-black/15" style={{ backgroundColor: getClassificationColor(cls) }} />
                <span className="text-text">{t(`analysis.${cls}`)}</span>
              </span>
              <span className="text-text-bright font-mono">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvalGraph({
  evaluations, moves, currentIndex, onClickIndex,
}: {
  evaluations: number[];
  moves: AnalyzedMove[];
  currentIndex: number;
  onClickIndex: (index: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 320;
  const height = 80;
  const padding = { top: 4, bottom: 4, left: 2, right: 2 };
  const graphW = width - padding.left - padding.right;
  const graphH = height - padding.top - padding.bottom;

  const maxAbs = Math.max(500, ...evaluations.map(e => Math.abs(e)));
  const clamp = (v: number) => Math.max(-maxAbs, Math.min(maxAbs, v));

  const points = evaluations.map((e, i) => {
    const x = padding.left + (i / Math.max(1, evaluations.length - 1)) * graphW;
    const y = padding.top + ((maxAbs - clamp(e)) / (2 * maxAbs)) * graphH;
    return { x, y };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const fillPath = `${pathData} L ${points[points.length - 1].x} ${padding.top + graphH} L ${padding.left} ${padding.top + graphH} Z`;

  const zeroY = padding.top + graphH / 2;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = (x - padding.left) / graphW;
    const moveIdx = Math.round(ratio * (evaluations.length - 1)) - 1;
    onClickIndex(Math.max(-1, Math.min(moves.length - 1, moveIdx)));
  };

  const currentX = currentIndex >= 0
    ? padding.left + ((currentIndex + 1) / Math.max(1, evaluations.length - 1)) * graphW
    : padding.left;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full cursor-pointer rounded-lg"
      onClick={handleClick}
    >
      <rect x={padding.left} y={padding.top} width={graphW} height={graphH} rx="8" fill="rgba(255,255,255,0.03)" />
      <rect x={padding.left} y={padding.top} width={graphW} height={graphH / 2} rx="8" fill="rgba(255,255,255,0.05)" />
      <rect x={padding.left} y={zeroY} width={graphW} height={graphH / 2} fill="rgba(0,0,0,0.14)" />

      <line x1={padding.left} y1={zeroY} x2={padding.left + graphW} y2={zeroY} stroke="rgba(255,255,255,0.22)" strokeWidth="0.75" />

      <path d={fillPath} fill="rgba(255,255,255,0.12)" />

      {moves.map((m, i) => {
        const pt = points[i + 1];
        if (!pt) return null;
        const cls = m.classification;
        if (cls === 'best' || cls === 'excellent' || cls === 'good') return null;
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={cls === 'blunder' ? 3 : 2}
            fill={getClassificationColor(cls)}
            opacity={0.95}
          />
        );
      })}

      <path d={pathData} fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="1.75" />

      <line x1={currentX} y1={padding.top} x2={currentX} y2={padding.top + graphH} stroke="var(--color-primary-light)" strokeWidth="1.5" opacity="0.95" />
    </svg>
  );
}

function CompactEnginePanel({
  currentPlyIndex,
  moveCount,
  currentEval,
  winningChances,
  turn,
  bestMoveText,
  principalVariation,
  analyzing,
  error,
  reviewMode,
  currentAnalyzedMove,
  reviewIsProvisional,
  analyzingGame,
  progress,
  analysisElapsedSeconds,
  t,
  reviewT,
}: {
  currentPlyIndex: number;
  moveCount: number;
  currentEval: number;
  winningChances: { white: number; black: number };
  turn: PieceColor;
  bestMoveText: string;
  principalVariation: string[];
  analyzing: boolean;
  error: string | null;
  reviewMode: 'mainLine' | 'analysis';
  currentAnalyzedMove: AnalyzedMove | null;
  reviewIsProvisional: boolean;
  analyzingGame: boolean;
  progress: AnalysisProgress | null;
  analysisElapsedSeconds: number;
  t: (key: string, params?: Record<string, string | number>) => string;
  reviewT: (key: 'analysis.current_position' | 'analysis.position_before_start' | 'analysis.position_after_move' | 'analysis.turn_to_move' | 'analysis.win_chances' | 'analysis.best_continuation' | 'analysis.eval_swing' | 'analysis.expected_score' | 'review.engine_loading' | 'review.engine_error' | 'review.engine' | 'review.analysis_branch', params?: Record<string, string | number>) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const classification = currentAnalyzedMove?.classification ?? null;
  const classificationColor = classification ? getClassificationColor(classification) : null;
  const swing = currentAnalyzedMove ? currentAnalyzedMove.evalAfter - currentAnalyzedMove.evalBefore : null;
  const swingLabel = swing === null ? null : `${swing >= 0 ? '+' : ''}${formatEval(swing)}`;
  const currentMoveText = currentAnalyzedMove
    ? `${posToAlgebraic(currentAnalyzedMove.move.from)}${currentAnalyzedMove.move.captured ? 'x' : '-'}${posToAlgebraic(currentAnalyzedMove.move.to)}`
    : null;
  const pvText = principalVariation.join(' ');
  const pvPreview = principalVariation.slice(0, 5).join(' ');
  const positionLabel = currentPlyIndex < 0
    ? reviewT('analysis.position_before_start')
    : reviewT('analysis.position_after_move', { move: currentPlyIndex + 1, total: moveCount });

  return (
    <div className="rounded-xl border border-white/10 bg-surface p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h3 className="text-sm font-semibold text-text-bright">{reviewT('review.engine')}</h3>
          {reviewMode === 'analysis' && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-light">
              {reviewT('review.analysis_branch')}
            </span>
          )}
          {reviewIsProvisional && (
            <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200">
              Local
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline rounded-full border border-surface-hover bg-surface-hover/70 px-2 py-1 text-[11px] font-semibold text-text whitespace-nowrap">
            {positionLabel}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-lg border border-surface-hover bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-text transition-colors hover:bg-surface-hover"
          >
            {expanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
          <div className="text-[11px] text-text-dim">{t('analysis.editor.eval')}</div>
          <div className="font-mono text-lg font-semibold text-text-bright">{formatEval(currentEval)}</div>
        </div>
        <div className="rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
          <div className="text-[11px] text-text-dim">{t('analysis.editor.best_move')}</div>
          <div className="font-mono font-semibold text-text-bright truncate">
            {analyzing ? reviewT('review.engine_loading') : error ? reviewT('review.engine_error') : bestMoveText}
          </div>
        </div>
      </div>

      {currentAnalyzedMove && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full border border-surface-hover bg-surface-hover/70 px-2 py-1 font-mono text-text-bright">
            {currentMoveText}
          </span>
          {classification && classificationColor && (
            <span
              className="rounded-full px-2 py-1 font-semibold"
              style={{ backgroundColor: `${classificationColor}22`, color: classificationColor }}
            >
              {t(`analysis.${classification}`)}
            </span>
          )}
          {swingLabel && (
            <span className={`rounded-full border border-surface-hover bg-surface-hover/70 px-2 py-1 font-mono ${swing !== null && swing >= 0 ? 'text-primary-light' : 'text-danger'}`}>
              {reviewT('analysis.eval_swing')} {swingLabel}
            </span>
          )}
          <span className="rounded-full border border-surface-hover bg-surface-hover/70 px-2 py-1 font-semibold text-text">
            {reviewT('analysis.expected_score')} {Math.round(currentAnalyzedMove.winPercentBefore)}% {'->'} {Math.round(currentAnalyzedMove.winPercentAfter)}%
          </span>
        </div>
      )}

      {!expanded && pvPreview && (
        <div className="mt-2 rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            <span>PV</span>
            <span className="text-[10px] normal-case tracking-normal text-text-dim">{pvPreview}</span>
          </div>
        </div>
      )}

      {analyzingGame && (
        <div className="mt-2 rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-[11px] text-text-dim">
            <span>{t('analysis.analyzing')}</span>
            <span>{progress ? `${progress.current}/${progress.total}` : t('analysis.elapsed', { seconds: analysisElapsedSeconds })}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-surface">
            <div
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress ? (progress.current / progress.total) * 100 : 18}%` }}
            />
          </div>
        </div>
      )}

      {expanded && (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
            <div className="text-[11px] text-text-dim">{reviewT('analysis.turn_to_move')}</div>
            <div className="font-semibold text-text-bright">{t(turn === 'white' ? 'common.white' : 'common.black')}</div>
          </div>
          <div className="rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
            <div className="text-[11px] text-text-dim">{reviewT('analysis.win_chances')}</div>
            <div className="font-semibold text-text-bright">{winningChances.white}% / {winningChances.black}%</div>
          </div>
          {pvText && (
            <div className="sm:col-span-2 rounded-lg border border-surface-hover bg-surface-hover/60 px-3 py-2">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                PV
              </div>
              <div className="font-mono text-xs leading-5 text-text-bright break-words">{pvText}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getClassificationTheme(classification: MoveClassification): {
  iconBg: string;
  iconBorder: string;
  iconText: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  buttonBg: string;
  buttonText: string;
} {
  switch (classification) {
    case 'best':
    case 'excellent':
    case 'good':
      return {
        iconBg: '#a9cc57',
        iconBorder: '#d7ec9c',
        iconText: '#233012',
        pillBg: 'rgba(169, 204, 87, 0.2)',
        pillBorder: 'rgba(191, 226, 109, 0.4)',
        pillText: '#c6e57c',
        buttonBg: '#37411f',
        buttonText: '#b6db63',
      };
    case 'inaccuracy':
      return {
        iconBg: '#ffd04a',
        iconBorder: '#ffe391',
        iconText: '#4d3400',
        pillBg: 'rgba(247, 198, 49, 0.18)',
        pillBorder: 'rgba(255, 221, 113, 0.4)',
        pillText: '#ffd457',
        buttonBg: '#4b3c13',
        buttonText: '#ffd04a',
      };
    case 'mistake':
      return {
        iconBg: '#f0a53e',
        iconBorder: '#f7c474',
        iconText: '#4a2600',
        pillBg: 'rgba(230, 157, 40, 0.18)',
        pillBorder: 'rgba(243, 186, 90, 0.4)',
        pillText: '#f3b85a',
        buttonBg: '#4d3010',
        buttonText: '#f1b14e',
      };
    case 'blunder':
      return {
        iconBg: '#df5a56',
        iconBorder: '#f08a86',
        iconText: '#3f1110',
        pillBg: 'rgba(202, 52, 49, 0.18)',
        pillBorder: 'rgba(233, 109, 106, 0.38)',
        pillText: '#f37f7b',
        buttonBg: '#52201f',
        buttonText: '#f08a86',
      };
  }
}

function findCheckSquare(state: GameState): Position | null {
  if (!state.isCheck) return null;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = state.board[row][col];
      if (piece && piece.type === 'K' && piece.color === state.turn) {
        return { row, col };
      }
    }
  }

  return null;
}

function getAnalysisCacheKey(gameData: GameAnalysisData, movetimeMs: number): string {
  return getGameAnalysisCacheKey({
    analysisId: gameData.id,
    moves: gameData.moves,
    movetimeMs,
  });
}

function readCachedAnalysis(cacheKey: string): GameAnalysis | null {
  return readCachedGameAnalysis(cacheKey);
}

function writeCachedAnalysis(cacheKey: string, analysis: GameAnalysis): void {
  writeCachedGameAnalysis(cacheKey, analysis);
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select';
}

/* ─── Helpers ─────────────────────────────────────────────────── */

interface MovePair {
  num: number;
  white: string;
  black?: string;
  whiteIdx: number;
  blackIdx: number;
  whiteClass?: MoveClassification;
  blackClass?: MoveClassification;
}

interface VariationToken {
  label: string;
  moveText: string;
  moveIndex: number;
  isSelected: boolean;
}

const VariationLine = forwardRef<HTMLDivElement, {
  rootMoveIndex: number | null;
  analysisLine: Move[];
  selectedMoveIndex: number;
  onSelectMove: (moveIndex: number) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}>(({ rootMoveIndex, analysisLine, selectedMoveIndex, onSelectMove, t }, ref) => {
  const tokens = buildVariationTokens(rootMoveIndex, analysisLine, selectedMoveIndex);

  return (
    <div
      ref={ref}
      data-testid="analysis-variation-line"
      data-root-move-index={rootMoveIndex ?? ''}
      className="ml-6 border-l border-primary/25 pl-3 py-1 text-[12px] text-text"
    >
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-light">
          {t('review.analysis_branch')}
        </span>
        {tokens.map((token) => (
          <span key={`${token.label}-${token.moveText}`} className="contents">
            <span className="text-text-dim">{token.label}</span>
            <button
              type="button"
              onClick={() => onSelectMove(token.moveIndex)}
              data-testid={token.isSelected ? 'analysis-active-variation-move' : undefined}
              aria-current={token.isSelected ? 'step' : undefined}
              className={`rounded px-1.5 py-0.5 text-left transition-colors ${
                token.isSelected
                  ? 'bg-primary/25 text-text-bright ring-1 ring-primary/30'
                  : 'text-text hover:bg-surface-hover/70'
              }`}
            >
              {token.moveText}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
});

VariationLine.displayName = 'VariationLine';

function buildMovePairs(moves: Move[], analysis: GameAnalysis | null): MovePair[] {
  const pairs: MovePair[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    const whiteMove = moves[i];
    const blackMove = moves[i + 1];

    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: formatReviewMove(whiteMove),
      black: blackMove ? formatReviewMove(blackMove) : undefined,
      whiteIdx: i,
      blackIdx: i + 1,
      whiteClass: analysis?.moves[i]?.classification,
      blackClass: analysis?.moves[i + 1]?.classification,
    });
  }

  return pairs;
}

function formatReviewMove(move: Move): string {
  const from = posToAlgebraic(move.from);
  const dest = posToAlgebraic(move.to);
  const promo = move.promoted ? '=M' : '';
  return `${from}${move.captured ? 'x' : '-'}${dest}${promo}`;
}

function buildVariationTokens(rootMoveIndex: number | null, analysisLine: Move[], selectedMoveIndex: number): VariationToken[] {
  if (rootMoveIndex === null) return [];

  let ply = rootMoveIndex + 1;

  return analysisLine.map((move, index) => {
    const moveNumber = Math.floor(ply / 2) + 1;
    const label = ply % 2 === 0 ? `${moveNumber}.` : `${moveNumber}...`;
    ply += 1;

    return {
      label,
      moveText: formatReviewMove(move),
      moveIndex: index,
      isSelected: index === selectedMoveIndex,
    };
  });
}
