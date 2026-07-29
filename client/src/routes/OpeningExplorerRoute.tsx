import { useReducer, useState, useCallback, useMemo, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Position, PieceColor, Move, GameState } from '@shared/types';
import { createInitialGameState, getLegalMoves, makeMove } from '@shared/engine';
import { serializeAnalysisPosition, uciToMove } from '@shared/engineAdapter';
import { findKing } from '@shared/utils/guards';
import { useTranslation } from '../lib/i18n';
import { routes } from '../lib/routes';
import { openingStatsQueryOptions, openingGamesQueryOptions } from '../queries/games';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { OpeningExplorerWorkspace } from './OpeningExplorerWorkspace';

type ExplorerBoardState = {
  currentState: GameState;
  moveHistory: Move[];
  selectedSquare: Position | null;
  selectedMoveUci: string | null;
  gamesPage: number;
};

type ExplorerBoardAction =
  | { type: 'selectSquare'; square: Position | null }
  | { type: 'applyMove'; state: GameState; move: Move }
  | { type: 'reset' }
  | { type: 'undo'; state: GameState; moveHistory: Move[] }
  | { type: 'setSelectedMoveUci'; uci: string | null }
  | { type: 'setGamesPage'; page: number };

function createInitialExplorerBoardState(): ExplorerBoardState {
  return {
    currentState: createInitialGameState(0, 0),
    moveHistory: [],
    selectedSquare: null,
    selectedMoveUci: null,
    gamesPage: 0,
  };
}

function explorerBoardReducer(state: ExplorerBoardState, action: ExplorerBoardAction): ExplorerBoardState {
  switch (action.type) {
    case 'selectSquare':
      return { ...state, selectedSquare: action.square };
    case 'applyMove':
      return {
        currentState: action.state,
        moveHistory: [...state.moveHistory, action.move],
        selectedSquare: null,
        selectedMoveUci: null,
        gamesPage: 0,
      };
    case 'reset':
      return createInitialExplorerBoardState();
    case 'undo':
      return {
        currentState: action.state,
        moveHistory: action.moveHistory,
        selectedSquare: null,
        selectedMoveUci: null,
        gamesPage: 0,
      };
    case 'setSelectedMoveUci':
      return { ...state, selectedMoveUci: action.uci };
    case 'setGamesPage':
      return { ...state, gamesPage: action.page };
    default:
      return state;
  }
}

export default function OpeningExplorerRoute() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  void t; // i18n hook used for future translations

  const [board, dispatch] = useReducer(explorerBoardReducer, undefined, createInitialExplorerBoardState);
  const [viewAs, setViewAs] = useState<PieceColor>('white');

  const { currentState, moveHistory, selectedSquare, selectedMoveUci, gamesPage } = board;

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

  const setSelectedMoveUci = useCallback((value: SetStateAction<string | null>) => {
    dispatch({
      type: 'setSelectedMoveUci',
      uci: typeof value === 'function' ? value(selectedMoveUci) : value,
    });
  }, [selectedMoveUci]);

  const setGamesPage = useCallback((value: SetStateAction<number>) => {
    dispatch({
      type: 'setGamesPage',
      page: typeof value === 'function' ? value(gamesPage) : value,
    });
  }, [gamesPage]);

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
        dispatch({ type: 'applyMove', state: newState, move });
      }
      return;
    }

    // If clicking our own piece, select it
    if (piece && piece.color === currentState.turn) {
      dispatch({ type: 'selectSquare', square: pos });
      return;
    }

    // Otherwise deselect
    dispatch({ type: 'selectSquare', square: null });
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
      dispatch({ type: 'applyMove', state: newState, move });
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
      dispatch({ type: 'applyMove', state: newState, move });
    }
  }, [currentState]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0) return;
    const newHistory = moveHistory.slice(0, -1);
    let state = createInitialGameState(0, 0);
    for (const move of newHistory) {
      const next = makeMove(state, move.from, move.to);
      if (next) state = next;
    }
    dispatch({ type: 'undo', state, moveHistory: newHistory });
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
            <button type="button" onClick={() => navigate(routes.gameDatabase)} className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm">
              Game Database
            </button>
            <button type="button" onClick={() => navigate(routes.leaderboard)} className="ui-btn-secondary px-3 py-1.5 text-xs sm:text-sm">
              Leaderboard
            </button>
          </div>
        </div>

        <OpeningExplorerWorkspace
          currentState={currentState}
          viewAs={viewAs}
          legalMoves={legalMoves}
          selectedSquare={selectedSquare}
          lastMove={lastMove}
          checkSquare={checkSquare}
          moveHistory={moveHistory}
          totalGames={totalGames}
          statsLoading={statsLoading}
          stats={stats}
          selectedMoveUci={selectedMoveUci}
          setSelectedMoveUci={setSelectedMoveUci}
          setGamesPage={setGamesPage}
          gamesPage={gamesPage}
          gamesLoading={gamesLoading}
          gamesData={gamesData}
          handleSquareClick={handleSquareClick}
          handlePieceDrop={handlePieceDrop}
          handleReset={handleReset}
          handleUndo={handleUndo}
          handleFlip={handleFlip}
          handleMoveFromStats={handleMoveFromStats}
        />
      </main>

      <Footer />
    </div>
  );
}
