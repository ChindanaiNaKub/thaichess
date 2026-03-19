import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Position, PieceColor, Move, Board as BoardType } from '@shared/types';
import { createInitialBoard, getBoardAtMove, isInCheck, posToAlgebraic } from '@shared/engine';
import {
  analyzeGame, GameAnalysis, AnalyzedMove, MoveClassification,
  getClassificationColor, getClassificationSymbol, getClassificationIcon, formatEval,
  AnalysisProgress,
} from '@shared/analysis';
import { useTranslation } from '../lib/i18n';
import Board from './Board';
import type { Arrow, SquareHighlight, SquareAnnotation } from './Board';
import PieceSVG from './PieceSVG';
import Header from './Header';

interface GameData {
  id: string;
  moves: Move[];
  result: string;
  resultReason: string;
  moveCount: number;
}

export default function AnalysisPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [viewMoveIndex, setViewMoveIndex] = useState<number>(-1);
  const [viewAs, setViewAs] = useState<PieceColor>('white');
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [showBestMove, setShowBestMove] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeMoveRef = useRef<HTMLSpanElement>(null);

  // Load game from URL params (local) or API
  useEffect(() => {
    const localMoves = searchParams.get('moves');
    const localResult = searchParams.get('result');
    const localReason = searchParams.get('reason');

    if (localMoves) {
      try {
        const moves = JSON.parse(decodeURIComponent(localMoves)) as Move[];
        setGameData({
          id: gameId || 'local',
          moves,
          result: localResult || 'unknown',
          resultReason: localReason || 'unknown',
          moveCount: moves.length,
        });
        setLoading(false);
      } catch {
        setError('Failed to parse game data');
        setLoading(false);
      }
      return;
    }

    if (gameId) {
      fetch(`/api/game/${gameId}`)
        .then(r => {
          if (!r.ok) throw new Error('Game not found');
          return r.json();
        })
        .then(data => {
          if (data.moves) {
            setGameData({
              id: data.id,
              moves: data.moves,
              result: data.result || data.status,
              resultReason: data.resultReason || '',
              moveCount: data.moveCount || data.moves.length,
            });
          } else {
            setError('Game has no moves to analyze');
          }
          setLoading(false);
        })
        .catch(() => {
          setError('Game not found');
          setLoading(false);
        });
    } else {
      setError('No game specified');
      setLoading(false);
    }
  }, [gameId, searchParams]);

  // Run analysis when game data is loaded
  useEffect(() => {
    if (!gameData || analysis || analyzing) return;
    setAnalyzing(true);

    const depth = gameData.moves.length > 60 ? 2 : 2;

    setTimeout(() => {
      const result = analyzeGame(gameData.moves, depth, (p) => {
        setProgress({ ...p });
      });
      setAnalysis(result);
      setAnalyzing(false);
      setViewMoveIndex(0);
    }, 50);
  }, [gameData, analysis, analyzing]);

  // Keyboard navigation
  useEffect(() => {
    if (!gameData) return;
    const moveCount = gameData.moves.length;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setViewMoveIndex(prev => Math.max(-1, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setViewMoveIndex(prev => Math.min(moveCount - 1, prev + 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setViewMoveIndex(-1);
      } else if (e.key === 'End') {
        e.preventDefault();
        setViewMoveIndex(moveCount - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameData]);

  // Auto-scroll active move within the move list container only (never scroll the page)
  useEffect(() => {
    const el = activeMoveRef.current;
    const container = scrollRef.current;
    if (!el || !container) return;

    const elTop = el.offsetTop;
    const elBottom = elTop + el.offsetHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    if (elTop < containerTop) {
      container.scrollTop = elTop - 4;
    } else if (elBottom > containerBottom) {
      container.scrollTop = elBottom - container.clientHeight + 4;
    }
  }, [viewMoveIndex]);

  const getDisplayBoard = useCallback((): BoardType => {
    if (!gameData) return createInitialBoard();
    if (viewMoveIndex === -1) return createInitialBoard();
    return getBoardAtMove(createInitialBoard(), gameData.moves, viewMoveIndex);
  }, [gameData, viewMoveIndex]);

  const getLastMove = useCallback((): Move | null => {
    if (!gameData || viewMoveIndex < 0) return null;
    return gameData.moves[viewMoveIndex];
  }, [gameData, viewMoveIndex]);

  const getCheckSquare = useCallback((): Position | null => {
    if (!gameData || viewMoveIndex < 0) return null;
    const board = getDisplayBoard();
    const turnAfterMove: PieceColor = viewMoveIndex % 2 === 0 ? 'black' : 'white';
    if (!isInCheck(board, turnAfterMove)) return null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.type === 'K' && piece.color === turnAfterMove) {
          return { row, col };
        }
      }
    }
    return null;
  }, [gameData, viewMoveIndex, getDisplayBoard]);

  const analysisArrows = useMemo((): Arrow[] => {
    if (!analysis || viewMoveIndex < 0 || viewMoveIndex >= analysis.moves.length) return [];
    const analyzed = analysis.moves[viewMoveIndex];
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
  }, [analysis, viewMoveIndex, showBestMove]);

  const analysisHighlights = useMemo((): SquareHighlight[] => {
    if (!analysis || viewMoveIndex < 0 || viewMoveIndex >= analysis.moves.length) return [];
    const analyzed = analysis.moves[viewMoveIndex];
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
  }, [analysis, viewMoveIndex, showBestMove]);

  const analysisAnnotations = useMemo((): SquareAnnotation[] => {
    if (!analysis || viewMoveIndex < 0 || viewMoveIndex >= analysis.moves.length) return [];
    const analyzed = analysis.moves[viewMoveIndex];
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
  }, [analysis, viewMoveIndex, showBestMove]);

  const currentAnalyzedMove = useMemo((): AnalyzedMove | null => {
    if (!analysis || viewMoveIndex < 0 || viewMoveIndex >= analysis.moves.length) return null;
    return analysis.moves[viewMoveIndex];
  }, [analysis, viewMoveIndex]);

  const currentEval = useMemo((): number => {
    if (!analysis) return 0;
    const evalIdx = viewMoveIndex + 1;
    if (evalIdx < 0 || evalIdx >= analysis.evaluations.length) return 0;
    return analysis.evaluations[evalIdx];
  }, [analysis, viewMoveIndex]);

  const handleMoveClick = useCallback((index: number) => {
    setViewMoveIndex(index);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
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
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-6 max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-danger mb-2">{t('game.error')}</h2>
            <p className="text-text-dim mb-4">{error}</p>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg font-semibold">
              {t('common.back_home')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!gameData) return null;

  const movePairs = buildMovePairs(gameData.moves, analysis);

  return (
    <div className="min-h-screen bg-surface flex flex-col" tabIndex={-1}>
      <Header subtitle={t('analysis.title')} />

      <main className="flex-1 flex items-start justify-center px-4 py-4 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 w-full max-w-[1200px]">
          {/* Board + Eval Bar (sticky on desktop) */}
          <div className="flex gap-2 w-full lg:flex-1 lg:max-w-[calc(100vh-140px)] max-w-[720px] lg:sticky lg:top-4 lg:self-start">
            {/* Eval Bar */}
            <EvalBar eval={currentEval} />

            <div className="flex flex-col items-center gap-2 flex-1">
              {/* View controls */}
              <div className="flex items-center gap-2 text-sm w-full justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-text-dim">{t('local.view_as')}</span>
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
              <Board
                board={getDisplayBoard()}
                playerColor={viewAs}
                isMyTurn={false}
                legalMoves={[]}
                selectedSquare={null}
                lastMove={null}
                isCheck={!!getCheckSquare()}
                checkSquare={getCheckSquare()}
                onSquareClick={() => {}}
                onPieceDrop={() => {}}
                disabled={true}
                arrows={[...analysisArrows, ...arrows]}
                onArrowsChange={setArrows}
                squareHighlights={analysisHighlights}
                squareAnnotations={analysisAnnotations}
              />

              {/* Nav buttons */}
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => setViewMoveIndex(-1)}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ⏮
                </button>
                <button
                  onClick={() => setViewMoveIndex(Math.max(-1, viewMoveIndex - 1))}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ◀
                </button>
                <button
                  onClick={() => setViewMoveIndex(Math.min(gameData.moves.length - 1, viewMoveIndex + 1))}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ▶
                </button>
                <button
                  onClick={() => setViewMoveIndex(gameData.moves.length - 1)}
                  className="px-3 py-1.5 text-sm rounded bg-surface-alt hover:bg-surface-hover text-text-dim hover:text-text-bright border border-surface-hover transition-colors"
                >
                  ⏭
                </button>
              </div>
            </div>
          </div>

          {/* Side Panel (scrollable on desktop) */}
          <div className="flex flex-col gap-3 lg:w-80 w-full max-w-[720px] lg:max-h-[calc(100vh-80px)] lg:overflow-y-auto lg:scrollbar-thin">
            {/* Analysis Status / Progress */}
            {analyzing && progress && (
              <div className="bg-surface-alt rounded-lg border border-surface-hover p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-text-bright">{t('analysis.analyzing')}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-text-dim mt-1">
                  {t('analysis.progress', { current: progress.current, total: progress.total })}
                </div>
              </div>
            )}

            {/* Accuracy Summary */}
            {analysis && (
              <div className="bg-surface-alt rounded-lg border border-surface-hover p-3">
                <h3 className="text-sm font-semibold text-text-bright mb-3">{t('analysis.accuracy')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <AccuracyCard color="white" accuracy={analysis.whiteAccuracy} summary={analysis.summary.white} t={t} />
                  <AccuracyCard color="black" accuracy={analysis.blackAccuracy} summary={analysis.summary.black} t={t} />
                </div>
              </div>
            )}

            {/* Eval Graph */}
            {analysis && analysis.evaluations.length > 1 && (
              <div className="bg-surface-alt rounded-lg border border-surface-hover p-3">
                <h3 className="text-sm font-semibold text-text-bright mb-2">{t('analysis.eval_graph')}</h3>
                <EvalGraph
                  evaluations={analysis.evaluations}
                  moves={analysis.moves}
                  currentIndex={viewMoveIndex}
                  onClickIndex={handleMoveClick}
                />
              </div>
            )}

            {/* Game Review Card (Chess.com-style) */}
            {currentAnalyzedMove && (
              <ReviewCard
                analyzed={currentAnalyzedMove}
                t={t}
                onNext={() => setViewMoveIndex(Math.min((gameData?.moves.length ?? 1) - 1, viewMoveIndex + 1))}
                onPrev={() => setViewMoveIndex(Math.max(-1, viewMoveIndex - 1))}
                hasNext={viewMoveIndex < (gameData?.moves.length ?? 1) - 1}
                hasPrev={viewMoveIndex > -1}
              />
            )}

            {/* Move History with classifications */}
            <div className="bg-surface-alt rounded-lg border border-surface-hover overflow-hidden">
              <div className="px-3 py-2 border-b border-surface-hover flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-bright">{t('moves.title')}</h3>
                {analysis && (
                  <label className="flex items-center gap-1.5 text-xs text-text-dim cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBestMove}
                      onChange={e => setShowBestMove(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-primary"
                    />
                    {t('analysis.show_best')}
                  </label>
                )}
              </div>
              <div ref={scrollRef} className="max-h-[300px] overflow-y-auto p-1">
                {movePairs.length === 0 ? (
                  <div className="text-text-dim text-sm text-center py-4">{t('moves.empty')}</div>
                ) : (
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 text-sm">
                    {movePairs.map(({ num, white, black, whiteIdx, blackIdx, whiteClass, blackClass }) => (
                      <div key={num} className="contents">
                        <span className="text-text-dim px-2 py-0.5 text-right">{num}.</span>
                        <span
                          ref={viewMoveIndex === whiteIdx ? activeMoveRef : undefined}
                          className={`px-2 py-0.5 font-mono rounded cursor-pointer transition-colors ${
                            viewMoveIndex === whiteIdx ? 'move-active' : 'move-clickable'
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
                          ref={viewMoveIndex === blackIdx ? activeMoveRef : undefined}
                          className={`px-2 py-0.5 font-mono rounded ${
                            black
                              ? viewMoveIndex === blackIdx ? 'move-active cursor-pointer' : 'move-clickable cursor-pointer'
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard hint */}
            <div className="text-center text-xs text-text-dim">
              {t('analysis.keyboard_hint')}
            </div>

            {/* Back buttons */}
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-light text-white text-sm rounded-lg transition-colors"
            >
              {t('common.back_home')}
            </button>
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
    <div className="eval-bar w-6 sm:w-7 rounded-lg overflow-hidden flex flex-col relative" style={{ minHeight: '100%' }}>
      <div
        className="bg-gray-800 transition-all duration-500 ease-out"
        style={{ height: `${100 - whitePercent}%` }}
      />
      <div
        className="bg-gray-100 transition-all duration-500 ease-out"
        style={{ height: `${whitePercent}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[9px] font-bold ${isWhiteAdvantage ? 'text-gray-800' : 'text-gray-200'}`}
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
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
    <div className="bg-surface rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        <PieceSVG type="K" color={color} size={18} />
        <span className="text-xs text-text-dim">{t(color === 'white' ? 'common.white' : 'common.black')}</span>
      </div>
      <div className="text-2xl font-bold text-text-bright mb-2">{accuracy}%</div>
      <div className="space-y-0.5">
        {classifications.map(cls => {
          const count = summary[cls];
          if (count === 0 && (cls === 'excellent')) return null;
          return (
            <div key={cls} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getClassificationColor(cls) }} />
                <span className="text-text-dim">{t(`analysis.${cls}`)}</span>
              </span>
              <span className="text-text font-mono">{count}</span>
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
      className="w-full cursor-pointer"
      onClick={handleClick}
    >
      {/* Background regions */}
      <rect x={padding.left} y={padding.top} width={graphW} height={graphH / 2} fill="rgba(255,255,255,0.03)" />
      <rect x={padding.left} y={zeroY} width={graphW} height={graphH / 2} fill="rgba(0,0,0,0.1)" />

      {/* Zero line */}
      <line x1={padding.left} y1={zeroY} x2={padding.left + graphW} y2={zeroY} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />

      {/* Fill */}
      <path d={fillPath} fill="rgba(255,255,255,0.08)" />

      {/* Move classification dots */}
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
            opacity={0.8}
          />
        );
      })}

      {/* Line */}
      <path d={pathData} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />

      {/* Current position indicator */}
      <line x1={currentX} y1={padding.top} x2={currentX} y2={padding.top + graphH} stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}

function ReviewCard({ analyzed, t, onNext, onPrev, hasNext, hasPrev }: {
  analyzed: AnalyzedMove;
  t: (key: string, params?: Record<string, string | number>) => string;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}) {
  const cls = analyzed.classification;
  const color = getClassificationColor(cls);
  const icon = getClassificationIcon(cls);
  const moveStr = `${posToAlgebraic(analyzed.move.from)}${analyzed.move.captured ? 'x' : '-'}${posToAlgebraic(analyzed.move.to)}`;
  const evalStr = formatEval(analyzed.evalAfter);

  const getDescription = (): string => {
    if (cls === 'best' || cls === 'excellent') return t('analysis.desc_best');
    if (cls === 'good') return t('analysis.desc_good');
    if (cls === 'inaccuracy') return t('analysis.desc_inaccuracy');
    if (cls === 'mistake') return t('analysis.desc_mistake');
    if (cls === 'blunder') return t('analysis.desc_blunder');
    return '';
  };

  const bestMoveStr = analyzed.bestMove
    ? `${posToAlgebraic(analyzed.bestMove.from)}-${posToAlgebraic(analyzed.bestMove.to)}`
    : '';

  return (
    <div className="bg-surface-alt rounded-lg border border-surface-hover overflow-hidden">
      {/* Review header with icon, move name, and eval badge */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Classification icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-md border-2 border-white/20"
            style={{ backgroundColor: color }}
          >
            {icon}
          </div>

          {/* Move info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-text-bright">{moveStr}</span>
              <span className="text-xs font-semibold" style={{ color }}>{t(`analysis.${cls}`)}</span>
              <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface text-text-dim">
                {evalStr}
              </span>
            </div>
            <p className="text-xs text-text-dim leading-relaxed">{getDescription()}</p>
            {analyzed.bestMove && (cls === 'inaccuracy' || cls === 'mistake' || cls === 'blunder') && (
              <div className="mt-1.5 text-xs px-2 py-1 rounded bg-green-900/20 border border-green-600/20 text-green-400 inline-block">
                ⭐ {t('analysis.best_was')}: <span className="font-mono font-bold">{bestMoveStr}</span> ({formatEval(analyzed.bestEval)})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex border-t border-surface-hover">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex-1 py-2.5 text-sm font-semibold text-text-dim hover:text-text-bright hover:bg-surface-hover transition-colors disabled:opacity-30 border-r border-surface-hover"
        >
          ◀ {t('analysis.prev')}
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex-1 py-2.5 text-sm font-semibold transition-colors disabled:opacity-30"
          style={{ backgroundColor: hasNext ? `${color}20` : undefined, color: hasNext ? color : undefined }}
        >
          {t('analysis.next')} ▶
        </button>
      </div>
    </div>
  );
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

    const formatMove = (move: Move) => {
      const from = posToAlgebraic(move.from);
      const dest = posToAlgebraic(move.to);
      const promo = move.promoted ? '=M' : '';
      return `${from}${move.captured ? 'x' : '-'}${dest}${promo}`;
    };

    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: formatMove(whiteMove),
      black: blackMove ? formatMove(blackMove) : undefined,
      whiteIdx: i,
      blackIdx: i + 1,
      whiteClass: analysis?.moves[i]?.classification,
      blackClass: analysis?.moves[i + 1]?.classification,
    });
  }

  return pairs;
}
