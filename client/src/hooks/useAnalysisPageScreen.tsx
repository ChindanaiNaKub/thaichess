import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Position, PieceColor, Move, Board as BoardType } from '@shared/types';
import { createInitialBoard, posToAlgebraic } from '@shared/engine';
import {
  GameAnalysis, AnalyzedMove,
  centipawnToWinPercent,
  getClassificationColor, getClassificationIcon,
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
import { requestBrowserPositionAnalysis } from '../lib/browserEngineAnalysis';
import { useTranslation } from '../lib/i18n';
import { useReviewCopy } from '../lib/reviewCopy';
import { resolveAnalysisRouteMode } from '../lib/analysisMode';
import { useBoardNavKeyboard } from './useBoardNavKeyboard';
import { usePostGameReview } from './usePostGameReview';
import { useReviewEngineAnalysis } from './useReviewEngineAnalysis';
import type { Arrow, SquareHighlight, SquareAnnotation } from '../components/Board';
import {
  getEditorAnalysisSnapshotKey,
  getEditorPositionStatus,
  movePieceOnBoard,
  withPieceAt,
  type EditorTool,
} from '../components/AnalysisEditorLogic';
import type { WorkerResponse } from '../workers/analysisWorker';
import { gameQueryOptions, type GameAnalysisData } from '../queries/analysis';
import { useAuth } from '../lib/auth';
import type { AnalysisMode } from '../components/analysisPageHelpers';
import {
  DEFAULT_EDITOR_TOOL,
  QUICK_ANALYSIS_MAIN_LINE,
  REVIEW_MOVETIME_MS,
  getAnalysisCacheKey,
  readCachedAnalysis,
  writeCachedAnalysis,
} from '../components/analysisPageHelpers';
import { AnalysisLoadingView, AnalysisErrorView } from '../components/AnalysisStatusViews';
import { AnalysisQuickView } from '../components/AnalysisQuickView';
import { AnalysisEditorView } from '../components/AnalysisEditorView';
import { AnalysisGameView } from '../components/AnalysisGameView';

export function useAnalysisPageScreen() {
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
    error: _apiError,
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
  const boardNavHandlers = useMemo(() => ({
    onBack: navigateBackward,
    onForward: navigateForward,
    onStart: navigateToStart,
    onEnd: navigateToEnd,
  }), [navigateBackward, navigateForward, navigateToEnd, navigateToStart]);

  useBoardNavKeyboard({
    enabled: mode === 'quick' || !!gameData,
    handlers: boardNavHandlers,
    capture: true,
    skipEditable: true,
    skipModified: true,
  });

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
    enabled: (mode === 'game' && Boolean(gameData) && !authLoading) || mode === 'quick',
    snapshot: currentReviewSnapshot,
    engineSource: 'browser-with-server-fallback',
    serverFallbackEnabled: Boolean(user) && !authLoading,
  });
  const currentEngineError = currentPositionError;

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
    return <AnalysisLoadingView t={t} />;
  }

  if (error) {
    return <AnalysisErrorView t={t} error={error} onBackHome={() => navigate('/')} />;
  }

  if (mode === 'quick') {
    return (
      <AnalysisQuickView
        t={t}
        reviewT={reviewT}
        review={review}
        viewAs={viewAs}
        currentEval={currentEval}
        currentMate={currentMate}
        currentWinningChances={currentWinningChances}
        currentBestMoveText={currentBestMoveText}
        currentBestMoveArrow={currentBestMoveArrow}
        arrows={arrows}
        currentPositionAnalysis={currentPositionAnalysis}
        currentPositionAnalyzing={currentPositionAnalyzing}
        currentEngineError={currentEngineError}
        analysisElapsedSeconds={analysisElapsedSeconds}
        onViewAsChange={setViewAs}
        onArrowsChange={setArrows}
        onNavigateToStart={navigateToStart}
        onNavigateBackward={navigateBackward}
        onNavigateForward={navigateForward}
        onNavigateToEnd={navigateToEnd}
        onResetQuickAnalysis={handleResetQuickAnalysis}
        onOpenEditor={() => navigate(buildEditorAnalysisRoute())}
      />
    );
  }

  if (mode === 'editor') {
    return (
      <AnalysisEditorView
        t={t}
        viewAs={viewAs}
        editorBoard={editorBoard}
        editorTurn={editorTurn}
        editorTool={editorTool}
        editorSelectedSquare={editorSelectedSquare}
        editorSnapshot={editorSnapshot}
        editorAnalysisKey={editorAnalysisKey}
        editorPositionStatus={editorPositionStatus}
        positionAnalysis={positionAnalysis}
        positionAnalysisKey={positionAnalysisKey}
        positionAnalyzing={positionAnalyzing}
        arrows={arrows}
        onViewAsChange={setViewAs}
        onEditorTurnChange={setEditorTurn}
        onEditorToolChange={setEditorTool}
        onEditorBoardChange={setEditorBoard}
        onEditorSquareClick={handleEditorSquareClick}
        onEditorPieceDrop={handleEditorPieceDrop}
        onArrowsChange={setArrows}
        onAnalyzePosition={handleAnalyzeEditorPosition}
        onCopyPosition={handleCopyEditorPosition}
        onCopyLink={handleCopyEditorLink}
        onBackHome={() => navigate('/')}
      />
    );
  }

  if (!gameData) return null;

  return (
    <AnalysisGameView
      t={t}
      reviewT={reviewT}
      review={review}
      gameData={gameData}
      analysis={analysis}
      analyzing={analyzing}
      gameAnalysisError={gameAnalysisError}
      progress={progress}
      viewAs={viewAs}
      showBestMove={showBestMove}
      currentPlyIndex={currentPlyIndex}
      highlightedMainLineMoveIndex={highlightedMainLineMoveIndex}
      currentEval={currentEval}
      currentMate={currentMate}
      currentWinningChances={currentWinningChances}
      currentBestMoveText={currentBestMoveText}
      currentPositionAnalysis={currentPositionAnalysis}
      currentPositionAnalyzing={currentPositionAnalyzing}
      currentEngineError={currentEngineError}
      currentAnalyzedMove={currentAnalyzedMove}
      reviewIsProvisional={reviewIsProvisional}
      analysisElapsedSeconds={analysisElapsedSeconds}
      analysisArrows={analysisArrows}
      analysisHighlights={analysisHighlights}
      analysisAnnotations={analysisAnnotations}
      arrows={arrows}
      scrollRef={scrollRef}
      setActiveMoveElement={setActiveMoveElement}
      onViewAsChange={setViewAs}
      onShowBestMoveChange={setShowBestMove}
      onArrowsChange={setArrows}
      onMoveClick={handleMoveClick}
      onNavigateToStart={navigateToStart}
      onNavigateBackward={navigateBackward}
      onNavigateForward={navigateForward}
      onNavigateToEnd={navigateToEnd}
    />
  );
}
