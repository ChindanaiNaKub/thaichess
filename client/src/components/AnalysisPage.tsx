import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
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
  serializeAnalysisPosition,
  type AnalysisPositionSnapshot,
  type PositionAnalysisResult,
} from '@shared/engineAdapter';
import { buildEditorAnalysisRoute, readInlineAnalysisPayload, requestPositionAnalysis } from '../lib/analysis';
import { DEFAULT_GAME_ANALYSIS_MOVETIME_MS, getGameAnalysisCacheKey, readCachedGameAnalysis, writeCachedGameAnalysis } from '../lib/analysisCache';
import { requestBrowserPositionAnalysis } from '../lib/browserEngineAnalysis';
import { useTranslation } from '../lib/i18n';
import { useReviewCopy } from '../lib/reviewCopy';
import { resolveAnalysisRouteMode } from '../lib/analysisMode';
import { usePostGameReview } from '../hooks/usePostGameReview';
import { useReviewEngineAnalysis } from '../hooks/useReviewEngineAnalysis';
import { BoardErrorBoundary } from './BoardErrorBoundary';
import Board from './Board';
import type { Arrow, SquareHighlight, SquareAnnotation } from './Board';
import {
  createEmptyEditorBoard,
  getEditorAnalysisSnapshotKey,
  getEditorPositionStatus,
  getEditorValidationMessage,
  movePieceOnBoard,
  withPieceAt,
  type EditorPieceTool,
  type EditorTool,
} from './AnalysisEditorLogic';
import { EditorPieceBank } from './AnalysisEditorTools';
import Header from './Header';
import { EvalBar } from './analysis/EvalBar';
import { AccuracyCard } from './analysis/AccuracyCard';
import { EvalGraph } from './analysis/EvalGraph';
import { CompactEnginePanel } from './analysis/CompactEnginePanel';
import { VariationLine } from './analysis/VariationLine';
import type { WorkerResponse } from '../workers/analysisWorker';
import { gameQueryOptions, type GameAnalysisData } from '../queries/analysis';
import { useAuth } from '../lib/auth';

type AnalysisMode = 'game' | 'editor' | 'quick';

const DEFAULT_EDITOR_TOOL: EditorTool = 'move';
const REVIEW_MOVETIME_MS = DEFAULT_GAME_ANALYSIS_MOVETIME_MS;
const QUICK_ANALYSIS_MAIN_LINE: Move[] = [];

export default function AnalysisPage() {
  return useAnalysisPageScreen();
}

function useAnalysisPageScreen() {
  const workerRef = useRef<Worker | null>(null);
  const analysisRunKeyRef = useRef<string | null>(null);
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const reviewT = useReviewCopy();
  const { user, loading: authLoading } = useAuth();

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
  const [gameAnalysisError, setGameAnalysisError] = useState<string | null>(null);
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
  const [positionAnalysisKey, setPositionAnalysisKey] = useState<string | null>(null);
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
    setGameAnalysisError(null);
    setProgress(null);
    setAnalysisStartedAt(null);
    setAnalysisElapsedMs(0);
    setError(null);
    setLoading(true);
    setGameData(null);
    setPositionAnalysis(null);
    setPositionAnalysisKey(null);
    setPositionAnalyzing(false);
    setEditorSelectedSquare(null);
    setEditorTool(DEFAULT_EDITOR_TOOL);

    const localMoves = searchParams.get('moves');
    const inlinePayloadKey = searchParams.get('payload');
    const localResult = searchParams.get('result');
    const localReason = searchParams.get('reason');
    const routeMode = resolveAnalysisRouteMode({ gameId, searchParams });
    const encodedPosition = searchParams.get('position');
    const encodedCounting = searchParams.get('counting');

    if (routeMode === 'editor') {
      setMode('editor');
      const snapshot = encodedPosition
        ? deserializeAnalysisPosition(encodedPosition, encodedCounting)
        : null;
      setEditorBoard(snapshot ? cloneBoard(snapshot.board) : createInitialBoard());
      setEditorTurn(snapshot?.turn ?? 'white');
      setLoading(false);
      return;
    }

    if (routeMode === 'quick') {
      setMode('quick');
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
    if (authLoading) return;

    if (!user) {
      workerRef.current?.terminate();
      workerRef.current = null;
      analysisRunKeyRef.current = null;
      setAnalyzing(false);
      setGameAnalysisError(t('analysis.sign_in_required'));
      setProgress(null);
      setAnalysisStartedAt(null);
      setAnalysisElapsedMs(0);
      return;
    }

    const cacheKey = getAnalysisCacheKey(gameData, REVIEW_MOVETIME_MS);

    if (analysisRunKeyRef.current === cacheKey) return;
    analysisRunKeyRef.current = cacheKey;

    setAnalyzing(true);
    setGameAnalysisError(null);
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
        setGameAnalysisError(null);
        setProgress(null);
        setAnalysisStartedAt(null);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        return;
      }

      setGameAnalysisError(message.message || t('analysis.failed'));
      setAnalyzing(false);
      setProgress(null);
      setAnalysisStartedAt(null);
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };

    worker.postMessage({
      type: 'analyze',
      analysisId: gameData.id,
      moves: gameData.moves,
      movetimeMs: REVIEW_MOVETIME_MS,
      depth: 2,
    });

    return () => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
    };
  }, [analysis, authLoading, gameData, mode, t, user]);

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
    enabled: (mode === 'game' && Boolean(gameData)) || mode === 'quick',
    mainLine: mode === 'quick' ? QUICK_ANALYSIS_MAIN_LINE : gameData?.moves ?? QUICK_ANALYSIS_MAIN_LINE,
  });

  useEffect(() => {
    if (mode !== 'quick' || review.mode === 'analysis') return;
    review.jumpToAnalysisRoot(-1);
  }, [mode, review]);

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
    if (mode !== 'quick' && !gameData) return;

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
  }, [gameData, mode, navigateBackward, navigateForward, navigateToEnd, navigateToStart]);

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
    gameData || mode === 'quick'
      ? {
          board: review.currentState.board,
          turn: review.currentState.turn,
          counting: review.currentState.counting,
        }
      : null
  ), [gameData, mode, review.currentState.board, review.currentState.counting, review.currentState.turn]);

  const {
    analysis: currentPositionAnalysis,
    analyzing: currentPositionAnalyzing,
    error: currentPositionError,
  } = useReviewEngineAnalysis({
    enabled: (mode === 'game' && Boolean(gameData) && Boolean(user) && !authLoading) || mode === 'quick',
    snapshot: currentReviewSnapshot,
    engineSource: mode === 'quick' ? 'browser-with-server-fallback' : 'server',
    serverFallbackEnabled: Boolean(user) && !authLoading,
  });
  const currentEngineError = mode !== 'quick' && !authLoading && !user
    ? t('analysis.sign_in_required')
    : currentPositionError;

  const editorSnapshot = useMemo<AnalysisPositionSnapshot>(() => ({
    board: editorBoard,
    turn: editorTurn,
    counting: null,
  }), [editorBoard, editorTurn]);
  const editorAnalysisKey = useMemo(
    () => getEditorAnalysisSnapshotKey(editorSnapshot),
    [editorSnapshot],
  );
  const editorPositionStatus = useMemo(
    () => getEditorPositionStatus(editorBoard),
    [editorBoard],
  );

  const handleAnalyzeEditorPosition = useCallback(async () => {
    if (!editorPositionStatus.canAnalyze) return;

    setPositionAnalyzing(true);
    setError(null);

    try {
      const result = await requestBrowserPositionAnalysis(editorSnapshot, {
        movetimeMs: 700,
      }).catch((browserError) => {
        if (!user || authLoading) throw browserError;
        return requestPositionAnalysis(editorSnapshot, {
          movetimeMs: 700,
          multipv: 1,
        });
      });
      setPositionAnalysis(result);
      setPositionAnalysisKey(editorAnalysisKey);
    } catch {
      setError(!user && !authLoading ? t('analysis.sign_in_required') : t('analysis.editor.error'));
    } finally {
      setPositionAnalyzing(false);
    }
  }, [authLoading, editorAnalysisKey, editorPositionStatus.canAnalyze, editorSnapshot, t, user]);

  const handleEditorSquareClick = useCallback((pos: Position) => {
    if (editorTool === 'erase') {
      setEditorBoard((prev) => withPieceAt(prev, pos, null));
      setEditorSelectedSquare(null);
      return;
    }

    if (editorTool !== 'move') {
      const [color, type] = editorTool.split(':') as ['white' | 'black', 'K' | 'M' | 'S' | 'R' | 'N' | 'P' | 'PM'];
      setEditorBoard((prev) => withPieceAt(prev, pos, { color, type }));
      setEditorSelectedSquare(null);
      return;
    }

    if (!editorSelectedSquare) {
      setEditorSelectedSquare(editorBoard[pos.row][pos.col] ? pos : null);
      return;
    }

    setEditorBoard((prev) => movePieceOnBoard(prev, editorSelectedSquare, pos));
    setEditorSelectedSquare(null);
  }, [editorBoard, editorSelectedSquare, editorTool]);

  const handleEditorPieceDrop = useCallback((from: Position, to: Position) => {
    setEditorBoard((prev) => movePieceOnBoard(prev, from, to));
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

  const currentBestMoveArrow = useMemo((): Arrow[] => (
    currentPositionAnalysis?.bestMove
      ? [{
          from: currentPositionAnalysis.bestMove.from,
          to: currentPositionAnalysis.bestMove.to,
          color: '#56b33080',
        }]
      : []
  ), [currentPositionAnalysis?.bestMove]);

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
    const primaryIcon = getClassificationIcon(cls);
    const primaryColor = getClassificationColor(cls);

    const annotations: SquareAnnotation[] = [{
      pos: analyzed.move.to,
      icon: primaryIcon,
      bgColor: primaryColor,
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
  const currentMate = currentPositionAnalysis?.mate ?? null;
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

  const handleResetQuickAnalysis = useCallback(() => {
    review.resetAnalysis();
    review.jumpToAnalysisRoot(-1);
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
            <button type="button" data-testid="analysis-back-home" onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold">
              {t('common.back_home')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'quick') {
    const quickSelectedPlyIndex = review.mode === 'analysis' ? review.selectedAnalysisMoveIndex : currentPlyIndex;
    const quickMoveCount = review.analysisLine.length;
    const quickVariationLine = review.analysisLine.length > 0 ? (
      <VariationLine
        rootMoveIndex={null}
        analysisLine={review.analysisLine}
        selectedMoveIndex={review.selectedAnalysisMoveIndex}
        onSelectMove={review.jumpToAnalysisMove}
        t={reviewT}
      />
    ) : null;

    return (
      <div data-testid="analysis-quick-view" className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
        <Header subtitle={t('analysis.quick.title')} />

        <main id="main-content" className="flex-1 flex items-start justify-center px-4 py-4 overflow-y-auto">
          <div className="grid w-full max-w-[1240px] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-start">
            <div className="flex gap-2 w-full max-w-[760px] lg:max-w-[calc(100vh-6rem)] lg:sticky lg:top-4 lg:self-start">
              <EvalBar eval={currentEval} mate={currentMate} />

              <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm w-full justify-between rounded-lg border border-surface-hover bg-surface-alt/80 px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-text-dim text-xs">{t('local.view_as')}</span>
                    <button type="button"
                      onClick={() => setViewAs('white')}
                      className={`px-3 py-1 rounded text-xs ${viewAs === 'white' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                    >
                      {t('common.white')}
                    </button>
                    <button type="button"
                      onClick={() => setViewAs('black')}
                      className={`px-3 py-1 rounded text-xs ${viewAs === 'black' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                    >
                      {t('common.black')}
                    </button>
                  </div>
                  <div className="text-text-dim text-xs">
                    {formatEval(currentEval, currentMate)}
                  </div>
                </div>

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
                    arrows={[...currentBestMoveArrow, ...arrows]}
                    onArrowsChange={setArrows}
                  />
                </BoardErrorBoundary>

                <div className="flex items-center justify-center gap-1 rounded-lg border border-surface-hover bg-surface-alt/80 px-2 py-1.5">
                  <button type="button"
                    onClick={navigateToStart}
                    className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    aria-label={t('analysis.quick.to_start')}
                  >
                    ⏮
                  </button>
                  <button type="button"
                    onClick={navigateBackward}
                    className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    aria-label={t('analysis.quick.back')}
                  >
                    ◀
                  </button>
                  <button type="button"
                    onClick={navigateForward}
                    className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    aria-label={t('analysis.quick.forward')}
                  >
                    ▶
                  </button>
                  <button type="button"
                    onClick={navigateToEnd}
                    className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    aria-label={t('analysis.quick.to_end')}
                  >
                    ⏭
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 w-full max-w-[760px] lg:self-start lg:sticky lg:top-4">
              <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-text-bright">{t('analysis.quick.title')}</h2>
                    <p className="mt-1 text-sm text-text-dim">{t('analysis.quick.desc')}</p>
                  </div>
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-light">
                    {reviewT('review.analysis_branch')}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => setViewAs(viewAs === 'white' ? 'black' : 'white')}
                    className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text transition-colors hover:bg-surface-hover"
                  >
                    {t('analysis.quick.flip_board')}
                  </button>
                  <button type="button"
                    onClick={handleResetQuickAnalysis}
                    disabled={!review.canResetAnalysis && review.analysisLine.length === 0}
                    className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/15 disabled:opacity-50"
                  >
                    {t('analysis.quick.reset')}
                  </button>
                  <button type="button"
                    onClick={() => navigate(buildEditorAnalysisRoute())}
                    className="col-span-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    {t('analysis.quick.open_editor')}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-text-bright">{t('analysis.quick.variation')}</h3>
                  <span className="text-xs text-text-dim">
                    {t('analysis.quick.moves', { count: quickMoveCount })}
                  </span>
                </div>
                <div className="mt-3 min-h-20 rounded-lg border border-surface-hover bg-surface-alt/70 px-2 py-3">
                  {quickVariationLine ?? (
                    <p className="px-2 text-sm text-text-dim">{t('analysis.quick.empty_variation')}</p>
                  )}
                </div>
              </div>

              <CompactEnginePanel
                currentPlyIndex={quickSelectedPlyIndex}
                moveCount={quickMoveCount}
                currentEval={currentEval}
                currentMate={currentMate}
                winningChances={currentWinningChances}
                turn={review.currentState.turn}
                bestMoveText={currentBestMoveText}
                principalVariation={currentPositionAnalysis?.principalVariation ?? []}
                analyzing={currentPositionAnalyzing}
                error={currentEngineError}
                reviewMode={review.mode}
                currentAnalyzedMove={null}
                reviewIsProvisional={false}
                analyzingGame={false}
                progress={null}
                analysisElapsedSeconds={analysisElapsedSeconds}
                t={t}
                reviewT={reviewT}
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (mode === 'editor') {
    const visiblePositionAnalysis = positionAnalysisKey === editorAnalysisKey ? positionAnalysis : null;
    const editorArrow = visiblePositionAnalysis?.bestMove
      ? [{
          from: visiblePositionAnalysis.bestMove.from,
          to: visiblePositionAnalysis.bestMove.to,
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
              <EvalBar eval={positionAnalysis?.evaluation ?? 0} mate={positionAnalysis?.mate ?? null} />

              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="flex items-center gap-2 text-sm w-full justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-text-dim">{t('analysis.editor.label')}</span>
                    <button type="button"
                      onClick={() => setEditorTurn('white')}
                      className={`px-3 py-1 rounded text-xs ${editorTurn === 'white' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                    >
                      {t('analysis.editor.turn_to_move', { color: t('common.white') })}
                    </button>
                    <button type="button"
                      onClick={() => setEditorTurn('black')}
                      className={`px-3 py-1 rounded text-xs ${editorTurn === 'black' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                    >
                      {t('analysis.editor.turn_to_move', { color: t('common.black') })}
                    </button>
                  </div>
                  <div className="text-text-dim text-xs">{formatEval(visiblePositionAnalysis?.evaluation ?? 0, visiblePositionAnalysis?.mate)}</div>
                </div>

                <EditorPieceBank
                  color="black"
                  label={t('analysis.editor.black_pieces')}
                  selectedTool={editorTool}
                  onSelectTool={(tool: EditorPieceTool) => setEditorTool(tool)}
                />

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

                <EditorPieceBank
                  color="white"
                  label={t('analysis.editor.white_pieces')}
                  selectedTool={editorTool}
                  onSelectTool={(tool: EditorPieceTool) => setEditorTool(tool)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:w-80 w-full max-w-[720px] lg:self-start">
              <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.tools')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => setEditorTool('move')}
                    className={`rounded-lg border px-3 py-2 text-sm ${editorTool === 'move' ? 'border-primary bg-primary/15 text-primary-light' : 'border-surface-hover bg-surface-alt text-text'}`}
                  >
                    {t('analysis.editor.move_pieces')}
                  </button>
                  <button type="button"
                    onClick={() => setEditorTool('erase')}
                    className={`rounded-lg border px-3 py-2 text-sm ${editorTool === 'erase' ? 'border-primary bg-primary/15 text-primary-light' : 'border-surface-hover bg-surface-alt text-text'}`}
                  >
                    {t('analysis.editor.erase_square')}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.validation')}</h3>
                {editorPositionStatus.canAnalyze ? (
                  <div className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    {t('analysis.editor.position_legal')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                      {t('analysis.editor.position_needs_work')}
                    </div>
                    <ul className="space-y-1 text-sm text-text-dim">
                      {editorPositionStatus.errors.map(errorMessage => (
                        <li key={errorMessage} className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2">
                          {getEditorValidationMessage(errorMessage, t)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.actions')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button"
                    onClick={() => setViewAs(viewAs === 'white' ? 'black' : 'white')}
                    className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text"
                  >
                    {t('analysis.editor.flip_board')}
                  </button>
                  <button type="button"
                    onClick={() => setEditorBoard(createInitialBoard())}
                    className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text"
                  >
                    {t('analysis.editor.reset_board')}
                  </button>
                  <button type="button"
                    onClick={() => setEditorBoard(createEmptyEditorBoard())}
                    className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text"
                  >
                    {t('analysis.editor.clear_board')}
                  </button>
                  <button type="button"
                    onClick={handleAnalyzeEditorPosition}
                    disabled={positionAnalyzing || !editorPositionStatus.canAnalyze}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {positionAnalyzing
                      ? t('analysis.editor.analyzing_position')
                      : t('analysis.editor.analyze_position')}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.position')}</h3>
                <textarea
                  readOnly
                  aria-label={t('analysis.editor.position')}
                  value={serialized.position}
                  className="min-h-24 w-full rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 font-mono text-xs text-text"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={handleCopyEditorPosition} className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text">
                    {t('analysis.editor.copy_position')}
                  </button>
                  <button type="button" onClick={handleCopyEditorLink} className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 text-sm text-text">
                    {t('analysis.editor.copy_link')}
                  </button>
                </div>
              </div>

              {visiblePositionAnalysis && (
                <div className="rounded-xl border border-white/10 bg-surface p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
                  <h3 className="mb-2 text-sm font-semibold text-text-bright">{t('analysis.editor.engine')}</h3>
                  <div className="space-y-2 text-sm text-text">
                    <div className="flex items-center justify-between">
                      <span>{t('analysis.editor.eval')}</span>
                        <span className="font-mono text-text-bright">{formatEval(visiblePositionAnalysis.evaluation, visiblePositionAnalysis.mate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('analysis.editor.best_move')}</span>
                      <span className="font-mono text-text-bright">
                        {visiblePositionAnalysis.bestMove
                          ? `${posToAlgebraic(visiblePositionAnalysis.bestMove.from)}-${posToAlgebraic(visiblePositionAnalysis.bestMove.to)}`
                          : t('analysis.editor.none')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('analysis.editor.source')}</span>
                      <span className="text-text-bright">{visiblePositionAnalysis.stats.source}</span>
                    </div>
                    {visiblePositionAnalysis.stats.depth && (
                      <div className="flex items-center justify-between">
                        <span>{t('analysis.editor.depth')}</span>
                        <span className="font-mono text-text-bright">{visiblePositionAnalysis.stats.depth}</span>
                      </div>
                    )}
                    {visiblePositionAnalysis.principalVariation.length > 0 && (
                      <div>
                        <div className="mb-1 text-xs uppercase tracking-[0.18em] text-text-dim">{t('analysis.editor.pv')}</div>
                        <div className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-2 font-mono text-xs text-text">
                          {visiblePositionAnalysis.principalVariation.join(' ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                <button type="button"
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
            <EvalBar eval={currentEval} mate={currentMate} />

            <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
              {/* View controls */}
              <div className="flex items-center gap-2 text-sm w-full justify-between rounded-lg border border-surface-hover bg-surface-alt/80 px-2.5 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-text-dim text-xs">{t('local.view_as')}</span>
                  <button type="button"
                    onClick={() => setViewAs('white')}
                    className={`px-3 py-1 rounded text-xs ${viewAs === 'white' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                  >
                    {t('common.white')}
                  </button>
                  <button type="button"
                    onClick={() => setViewAs('black')}
                    className={`px-3 py-1 rounded text-xs ${viewAs === 'black' ? 'bg-primary text-white' : 'bg-surface-hover text-text'}`}
                  >
                    {t('common.black')}
                  </button>
                </div>
                <div className="text-text-dim text-xs">
                  {formatEval(currentEval, currentMate)}
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
                <button type="button"
                  onClick={navigateToStart}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ⏮
                </button>
                <button type="button"
                  onClick={navigateBackward}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ◀
                </button>
                <button type="button"
                  onClick={navigateForward}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ▶
                </button>
                <button type="button"
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
                    <button type="button"
                      onClick={navigateToStart}
                      className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    >
                      ⏮
                    </button>
                    <button type="button"
                      onClick={navigateBackward}
                      className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    >
                      ◀
                    </button>
                    <button type="button"
                      onClick={navigateForward}
                      className="px-2.5 py-1 text-xs rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                    >
                      ▶
                    </button>
                    <button type="button"
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
                        <button
                          type="button"
                          ref={highlightedMainLineMoveIndex === whiteIdx ? setActiveMoveElement : undefined}
                          data-testid={`analysis-main-move-${whiteIdx}`}
                          className={`bg-transparent border-0 text-left px-2 py-1 font-mono rounded cursor-pointer transition-colors ${
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
                        </button>
                        <button
                          type="button"
                          ref={highlightedMainLineMoveIndex === blackIdx ? setActiveMoveElement : undefined}
                          data-testid={black ? `analysis-main-move-${blackIdx}` : undefined}
                          className={`bg-transparent border-0 text-left px-2 py-1 font-mono rounded ${
                            black
                              ? highlightedMainLineMoveIndex === blackIdx ? 'move-active cursor-pointer shadow-[inset_0_0_0_1px_rgba(134,204,99,0.2)]' : 'move-clickable cursor-pointer'
                              : ''
                          }`}
                          onClick={() => black && handleMoveClick(blackIdx)}
                          disabled={!black}
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
                        </button>
                        {review.analysisVariations.flatMap((variation) => (
                            variation.rootMoveIndex >= 0 && Math.floor(variation.rootMoveIndex / 2) === pairIndex
                              ? [renderVariationLine(variation.rootMoveIndex)]
                              : []
                          ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="shrink-0 border-t border-surface-hover px-2.5 py-2 flex flex-wrap items-center gap-2">
                {review.mode === 'analysis' ? (
                  <>
                    <button type="button"
                      onClick={review.returnToMainLine}
                      className="rounded-lg border border-surface-hover bg-surface-alt px-3 py-1.5 text-xs font-semibold text-text-bright transition-colors hover:bg-surface-hover"
                    >
                      {reviewT('review.return_to_game')}
                    </button>
                    <button type="button"
                      onClick={review.resetAnalysis}
                      disabled={!review.canResetAnalysis}
                      className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-light transition-colors hover:bg-primary/15 disabled:opacity-50"
                    >
                      {reviewT('review.reset_variation')}
                    </button>
                  </>
                ) : (
                  <button type="button"
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
                currentMate={currentMate}
                winningChances={currentWinningChances}
                turn={review.currentState.turn}
                bestMoveText={currentBestMoveText}
                principalVariation={currentPositionAnalysis?.principalVariation ?? []}
                analyzing={currentPositionAnalyzing}
                error={currentEngineError || gameAnalysisError}
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
    case 'brilliant':
      return {
        iconBg: '#35c8c3',
        iconBorder: '#8fe5e1',
        iconText: '#0f2f2d',
        pillBg: 'rgba(43, 183, 179, 0.2)',
        pillBorder: 'rgba(127, 226, 221, 0.38)',
        pillText: '#8fe5e1',
        buttonBg: '#1b4d4a',
        buttonText: '#9beae6',
      };
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
