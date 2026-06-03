import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Position, PieceColor, Move } from '@shared/types';
import { createInitialGameState, getLegalMoves, makeMove } from '@shared/engine';
import { serializeAnalysisPosition, moveToUci, uciToMove } from '@shared/engineAdapter';
import { findKing } from '@shared/utils/guards';
import { useTranslation } from '../lib/i18n';
import { routes, savedGameAnalysisRoute } from '../lib/routes';
import { openingStatsQueryOptions, openingGamesQueryOptions, type OpeningMoveStat } from '../queries/games';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Board from '../components/Board';

function formatResult(result: string): string {
  if (result === 'draw') return '½-½';
  if (result === 'white') return '1-0';
  return '0-1';
}

function formatRating(rating: number | null): string {
  return rating !== null ? String(rating) : '-';
}

function getWinRate(move: OpeningMoveStat, color: PieceColor): number {
  const total = move.totalGames;
  if (total === 0) return 0;
  const wins = color === 'white' ? move.whiteWins : move.blackWins;
  return Math.round((wins / total) * 100);
}

function getBarColor(winRate: number, color: PieceColor): string {
  if (color === 'white') {
    if (winRate >= 55) return 'bg-primary';
    if (winRate >= 45) return 'bg-accent';
    return 'bg-danger';
  }
  if (winRate >= 55) return 'bg-danger';
  if (winRate >= 45) return 'bg-accent';
  return 'bg-primary';
}

export default function OpeningExplorerRoute() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  void t; // i18n hook used for future translations

  // Track the current game state and move history
  const [currentState, setCurrentState] = useState(() => createInitialGameState(0, 0));
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [viewAs, setViewAs] = useState<PieceColor>('white');
  const [selectedMoveUci, setSelectedMoveUci] = useState<string | null>(null);
  const [gamesPage, setGamesPage] = useState(0);

  // Compute position hash for API queries
  const positionHash = useMemo(() => {
    return serializeAnalysisPosition({
      board: currentState.board,
      turn: currentState.turn,
      counting: currentState.counting,
    }).position;
  }, [currentState]);

  // Fetch opening stats
  const {
    data: statsData,
    isLoading: statsLoading,
  } = useQuery(openingStatsQueryOptions(positionHash));

  // Fetch games for selected move
  const {
    data: gamesData,
    isLoading: gamesLoading,
  } = useQuery(openingGamesQueryOptions(positionHash, selectedMoveUci ?? undefined, gamesPage, 10));

  const stats = statsData ?? { positionHash, totalGames: 0, moves: [] };
  const totalGames = stats.totalGames;

  // Compute legal moves for selected piece
  const legalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return getLegalMoves(currentState.board, selectedSquare);
  }, [currentState.board, selectedSquare]);

  // Compute check square
  const checkSquare = useMemo(() => {
    if (!currentState.isCheck) return null;
    return findKing(currentState.board, currentState.turn);
  }, [currentState]);

  // Last move for highlighting
  const lastMove = useMemo(() => {
    if (moveHistory.length === 0) return null;
    const last = moveHistory[moveHistory.length - 1];
    return {
      from: last.from,
      to: last.to,
      movedPiece: last.movedPiece!,
      capturedPiece: last.capturedPiece ?? null,
      promotion: last.promotion ?? null,
    };
  }, [moveHistory]);

  const handleSquareClick = useCallback((pos: Position) => {
    const piece = currentState.board[pos.row][pos.col];

    // If a piece is already selected and we click a legal move target
    if (selectedSquare && legalMoves.some(m => m.row === pos.row && m.col === pos.col)) {
      const newState = makeMove(currentState, selectedSquare, pos);
      if (newState) {
        const move: Move = {
          from: selectedSquare,
          to: pos,
          movedPiece: currentState.board[selectedSquare.row][selectedSquare.col]!,
          capturedPiece: currentState.board[pos.row][pos.col] ?? null,
          promoted: newState.moveHistory[newState.moveHistory.length - 1]?.promoted ?? false,
          promotion: newState.moveHistory[newState.moveHistory.length - 1]?.promotion ?? null,
        };
        setCurrentState(newState);
        setMoveHistory(prev => [...prev, move]);
        setSelectedSquare(null);
        setSelectedMoveUci(null);
        setGamesPage(0);
      }
      return;
    }

    // If clicking our own piece, select it
    if (piece && piece.color === currentState.turn) {
      setSelectedSquare(pos);
      return;
    }

    // Otherwise deselect
    setSelectedSquare(null);
  }, [currentState, selectedSquare, legalMoves]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    const newState = makeMove(currentState, from, to);
    if (newState) {
      const move: Move = {
        from,
        to,
        movedPiece: currentState.board[from.row][from.col]!,
        capturedPiece: currentState.board[to.row][to.col] ?? null,
        promoted: newState.moveHistory[newState.moveHistory.length - 1]?.promoted ?? false,
        promotion: newState.moveHistory[newState.moveHistory.length - 1]?.promotion ?? null,
      };
      setCurrentState(newState);
      setMoveHistory(prev => [...prev, move]);
      setSelectedSquare(null);
      setSelectedMoveUci(null);
      setGamesPage(0);
    }
  }, [currentState]);

  const handleMoveFromStats = useCallback((moveUci: string) => {
    const parsed = uciToMove(moveUci);
    if (!parsed) return;

    const newState = makeMove(currentState, parsed.from, parsed.to);
    if (newState) {
      const move: Move = {
        from: parsed.from,
        to: parsed.to,
        movedPiece: currentState.board[parsed.from.row][parsed.from.col]!,
        capturedPiece: currentState.board[parsed.to.row][parsed.to.col] ?? null,
        promoted: newState.moveHistory[newState.moveHistory.length - 1]?.promoted ?? false,
        promotion: newState.moveHistory[newState.moveHistory.length - 1]?.promotion ?? null,
      };
      setCurrentState(newState);
      setMoveHistory(prev => [...prev, move]);
      setSelectedSquare(null);
      setSelectedMoveUci(null);
      setGamesPage(0);
    }
  }, [currentState]);

  const handleReset = useCallback(() => {
    setCurrentState(createInitialGameState(0, 0));
    setMoveHistory([]);
    setSelectedSquare(null);
    setSelectedMoveUci(null);
    setGamesPage(0);
  }, []);

  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0) return;
    const newHistory = moveHistory.slice(0, -1);
    let state = createInitialGameState(0, 0);
    for (const move of newHistory) {
      const next = makeMove(state, move.from, move.to);
      if (next) state = next;
    }
    setCurrentState(state);
    setMoveHistory(newHistory);
    setSelectedSquare(null);
    setSelectedMoveUci(null);
    setGamesPage(0);
  }, [moveHistory]);

  const handleFlip = useCallback(() => {
    setViewAs(prev => prev === 'white' ? 'black' : 'white');
  }, []);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header active="games" />

      <main id="main-content" className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="ui-title text-xl sm:text-2xl">Opening Explorer</h2>
          <div className="flex gap-2">
            <button onClick={() => navigate(routes.gameDatabase)} className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm">
              Game Database
            </button>
            <button onClick={() => navigate(routes.leaderboard)} className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm">
              Leaderboard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Board */}
          <div className="lg:col-span-2">
            <div className="ui-card p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={handleReset} className="ui-btn-secondary px-2 py-1 text-xs">Reset</button>
                  <button onClick={handleUndo} disabled={moveHistory.length === 0} className="ui-btn-secondary px-2 py-1 text-xs disabled:opacity-40">Undo</button>
                  <button onClick={handleFlip} className="ui-btn-secondary px-2 py-1 text-xs">Flip</button>
                </div>
                <span className="text-text-dim text-xs">
                  {totalGames.toLocaleString()} games in database
                </span>
              </div>

              {/* Move path */}
              {moveHistory.length > 0 && (
                <div className="mb-3 p-2 bg-surface-hover/30 rounded-lg overflow-x-auto">
                  <div className="flex items-center gap-1 text-xs text-text-dim whitespace-nowrap">
                    <span className="font-semibold text-text-bright">Moves:</span>
                    {moveHistory.map((move, i) => {
                      const moveNum = Math.floor(i / 2) + 1;
                      const isWhite = i % 2 === 0;
                      return (
                        <span key={i}>
                          {isWhite && <span className="text-text-dim ml-1">{moveNum}.</span>}
                          <span className="text-text-bright font-mono">{moveToUci(move)}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="max-w-[600px] mx-auto">
                <Board
                  board={currentState.board}
                  playerColor={viewAs}
                  draggableColor={currentState.turn}
                  isMyTurn={true}
                  legalMoves={legalMoves}
                  selectedSquare={selectedSquare}
                  lastMove={lastMove}
                  isCheck={currentState.isCheck}
                  checkSquare={checkSquare}
                  onSquareClick={handleSquareClick}
                  onPieceDrop={handlePieceDrop}
                  disabled={false}
                />
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <div className="ui-card p-3 sm:p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-dim mb-3">
                Move Statistics
              </h3>

              {statsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stats.moves.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-dim text-sm">No games with this position</p>
                  <p className="text-text-dim text-xs mt-1">Make a move on the board to explore</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.moves.map((move) => {
                    const winRate = getWinRate(move, currentState.turn);
                    const barColor = getBarColor(winRate, currentState.turn);
                    const isSelected = selectedMoveUci === move.moveUci;

                    return (
                      <button
                        key={move.moveUci}
                        onClick={() => {
                          setSelectedMoveUci(move.moveUci);
                          setGamesPage(0);
                          handleMoveFromStats(move.moveUci);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-primary/15 border border-primary/30' : 'hover:bg-surface-hover/30 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-sm font-semibold text-text-bright">
                            {move.moveUci}
                          </span>
                          <span className="text-xs text-text-dim">
                            {move.totalGames.toLocaleString()} games
                          </span>
                        </div>

                        {/* Win rate bar */}
                        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full ${barColor} transition-all`}
                            style={{ width: `${winRate}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-text-dim">
                          <span className="text-text-bright">{winRate}% wins for {currentState.turn}</span>
                          <span>W:{move.whiteWins} D:{move.draws} B:{move.blackWins}</span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-text-dim mt-0.5">
                          <span>⚪ {formatRating(move.avgWhiteRating)}</span>
                          <span>⚫ {formatRating(move.avgBlackRating)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Games for selected move */}
            {selectedMoveUci && (
              <div className="ui-card p-3 sm:p-4 mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-text-dim mb-3">
                  Games with {selectedMoveUci}
                </h3>

                {gamesLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : gamesData && gamesData.games.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {gamesData.games.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => navigate(savedGameAnalysisRoute(game.id))}
                          className="w-full text-left p-2 rounded-lg hover:bg-surface-hover/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-text-bright truncate">
                              {game.white_name} vs {game.black_name}
                            </span>
                            <span className="text-xs font-mono text-text-dim ml-2">
                              {formatResult(game.result)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-text-dim mt-0.5">
                            <span>{game.move_count} moves</span>
                            <span>•</span>
                            <span>{new Date(game.finished_at * 1000).toLocaleDateString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {gamesData.total > 10 && (
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-hover/30">
                        <button
                          onClick={() => setGamesPage(p => Math.max(0, p - 1))}
                          disabled={gamesPage === 0}
                          className="ui-btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <span className="text-text-dim text-xs">
                          {gamesPage + 1} / {Math.ceil(gamesData.total / 10)}
                        </span>
                        <button
                          onClick={() => setGamesPage(p => p + 1)}
                          disabled={(gamesPage + 1) * 10 >= gamesData.total}
                          className="ui-btn-secondary px-2 py-1 text-xs disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-text-dim text-xs text-center py-4">No games found</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
