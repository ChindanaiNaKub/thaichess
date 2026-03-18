import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Position, PieceColor, Move, GameState } from '@shared/types';
import { getLegalMoves, makeMove, createInitialGameState, createInitialBoard } from '@shared/engine';
import { getBotMove, BotDifficulty } from '@shared/botEngine';
import { playMoveSound, playCaptureSound, playCheckSound, playGameOverSound } from '../lib/sounds';
import { useTranslation } from '../lib/i18n';
import Board from './Board';
import MoveHistory from './MoveHistory';
import GameOverModal from './GameOverModal';
import Header from './Header';
import PieceSVG from './PieceSVG';

export default function BotGame() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<PieceColor>('white');
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(0, 0));
  const [selectedSquare, setSelectedSquare] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [gameOverInfo, setGameOverInfo] = useState<{ reason: string; winner: PieceColor | null } | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const botColor: PieceColor = playerColor === 'white' ? 'black' : 'white';
  const isPlayerTurn = gameState.turn === playerColor;

  const difficultyConfig: Record<BotDifficulty, { labelKey: string; descKey: string; emoji: string }> = {
    easy: { labelKey: 'bot.easy', descKey: 'bot.easy_desc', emoji: '🟢' },
    medium: { labelKey: 'bot.medium', descKey: 'bot.medium_desc', emoji: '🟡' },
    hard: { labelKey: 'bot.hard', descKey: 'bot.hard_desc', emoji: '🔴' },
  };

  useEffect(() => {
    if (!gameStarted || gameState.gameOver || isPlayerTurn) return;

    setBotThinking(true);
    const delay = difficulty === 'easy' ? 300 : difficulty === 'medium' ? 600 : 800;

    botTimeoutRef.current = setTimeout(() => {
      const botMoveResult = getBotMove(gameState, difficulty);
      if (botMoveResult) {
        const newState = makeMove(gameState, botMoveResult.from, botMoveResult.to);
        if (newState) {
          setGameState(newState);
          const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
          if (newState.isCheck) playCheckSound();
          else if (lastMove.captured) playCaptureSound();
          else playMoveSound();

          if (newState.gameOver) {
            const reason = newState.isCheckmate ? 'checkmate' : newState.isStalemate ? 'stalemate' : 'draw';
            setGameOverInfo({ reason, winner: newState.winner });
            playGameOverSound();
          }
        }
      }
      setBotThinking(false);
    }, delay);

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [gameState, gameStarted, isPlayerTurn, difficulty]);

  const handleSquareClick = useCallback((pos: Position) => {
    if (gameState.gameOver || !isPlayerTurn || botThinking) return;
    const piece = gameState.board[pos.row][pos.col];

    if (selectedSquare) {
      const isLegal = legalMoves.some(m => m.row === pos.row && m.col === pos.col);
      if (isLegal) {
        const newState = makeMove(gameState, selectedSquare, pos);
        if (newState) {
          setGameState(newState);
          setSelectedSquare(null);
          setLegalMoves([]);
          const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
          if (newState.isCheck) playCheckSound();
          else if (lastMove.captured) playCaptureSound();
          else playMoveSound();
          if (newState.gameOver) {
            const reason = newState.isCheckmate ? 'checkmate' : newState.isStalemate ? 'stalemate' : 'draw';
            setGameOverInfo({ reason, winner: newState.winner });
            playGameOverSound();
          }
        }
        return;
      }
    }

    if (piece && piece.color === playerColor) {
      setSelectedSquare(pos);
      setLegalMoves(getLegalMoves(gameState.board, pos));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  }, [gameState, selectedSquare, legalMoves, isPlayerTurn, botThinking, playerColor]);

  const handlePieceDrop = useCallback((from: Position, to: Position) => {
    if (gameState.gameOver || !isPlayerTurn || botThinking) return;
    const piece = gameState.board[from.row][from.col];
    if (!piece || piece.color !== playerColor) return;
    const legal = getLegalMoves(gameState.board, from);
    if (legal.some(m => m.row === to.row && m.col === to.col)) {
      const newState = makeMove(gameState, from, to);
      if (newState) {
        setGameState(newState);
        setSelectedSquare(null);
        setLegalMoves([]);
        const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
        if (newState.isCheck) playCheckSound();
        else if (lastMove.captured) playCaptureSound();
        else playMoveSound();
        if (newState.gameOver) {
          const reason = newState.isCheckmate ? 'checkmate' : newState.isStalemate ? 'stalemate' : 'draw';
          setGameOverInfo({ reason, winner: newState.winner });
          playGameOverSound();
        }
      }
    }
  }, [gameState, isPlayerTurn, botThinking, playerColor]);

  const handleStartGame = () => {
    setGameState(createInitialGameState(0, 0));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setBotThinking(false);
    setGameStarted(true);
  };

  const handleReset = () => {
    if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    setGameStarted(false);
    setGameState(createInitialGameState(0, 0));
    setSelectedSquare(null);
    setLegalMoves([]);
    setGameOverInfo(null);
    setBotThinking(false);
  };

  const handleResign = () => {
    if (window.confirm(t('bot.resign_confirm'))) {
      const newState = { ...gameState };
      newState.gameOver = true;
      newState.winner = botColor;
      setGameState(newState);
      setGameOverInfo({ reason: 'resignation', winner: botColor });
      playGameOverSound();
    }
  };

  const getLastMove = (): Move | null => {
    if (gameState.moveHistory.length === 0) return null;
    return gameState.moveHistory[gameState.moveHistory.length - 1];
  };

  const getCheckSquare = (): Position | null => {
    if (!gameState.isCheck) return null;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameState.board[row][col];
        if (piece && piece.type === 'K' && piece.color === gameState.turn) {
          return { row, col };
        }
      }
    }
    return null;
  };

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Header subtitle={t('bot.title')} />

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="bg-surface-alt border border-surface-hover rounded-xl p-5 sm:p-6 w-full max-w-lg animate-slideUp">
            <h2 className="text-2xl font-bold text-text-bright mb-6 text-center">{t('bot.setup_title')}</h2>

            <div className="mb-6">
              <label className="text-sm text-text-dim mb-2 block">{t('bot.difficulty')}</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(difficultyConfig) as BotDifficulty[]).map((key) => {
                  const config = difficultyConfig[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setDifficulty(key)}
                      className={`py-3 px-3 rounded-lg text-sm font-medium transition-all ${
                        difficulty === key
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-surface hover:bg-surface-hover text-text border border-surface-hover'
                      }`}
                    >
                      <div className="text-lg mb-1">{config.emoji}</div>
                      <div className="font-bold">{t(config.labelKey)}</div>
                      <div className="text-xs opacity-70 mt-1">{t(config.descKey)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="text-sm text-text-dim mb-2 block">{t('bot.play_as')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPlayerColor('white')}
                  className={`py-3 px-3 rounded-lg font-medium transition-all flex flex-col items-center gap-1 ${
                    playerColor === 'white'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface hover:bg-surface-hover text-text border border-surface-hover'
                  }`}
                >
                  <PieceSVG type="K" color="white" size={32} />
                  <span className="text-sm">{t('common.white')}</span>
                </button>
                <button
                  onClick={() => setPlayerColor(Math.random() < 0.5 ? 'white' : 'black')}
                  className="py-3 px-3 rounded-lg font-medium transition-all flex flex-col items-center gap-1 bg-surface hover:bg-surface-hover text-text border border-surface-hover"
                >
                  <span className="text-2xl">🎲</span>
                  <span className="text-sm">{t('bot.random')}</span>
                </button>
                <button
                  onClick={() => setPlayerColor('black')}
                  className={`py-3 px-3 rounded-lg font-medium transition-all flex flex-col items-center gap-1 ${
                    playerColor === 'black'
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-surface hover:bg-surface-hover text-text border border-surface-hover'
                  }`}
                >
                  <PieceSVG type="K" color="black" size={32} />
                  <span className="text-sm">{t('common.black')}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-3 px-6 bg-primary hover:bg-primary-light text-white font-bold rounded-lg text-lg transition-colors shadow-md"
            >
              {t('bot.start')}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-3 py-2 px-6 bg-surface hover:bg-surface-hover text-text border border-surface-hover font-medium rounded-lg transition-colors"
            >
              {t('common.back_home')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header
        subtitle={`${t('bot.vs_bot')} (${t(difficultyConfig[difficulty].labelKey)})`}
        right={<span>{difficultyConfig[difficulty].emoji}</span>}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 w-full max-w-[1100px]">
          <div className="flex flex-col items-center gap-2 sm:gap-3 w-full lg:flex-1 lg:max-w-[calc(100vh-140px)] max-w-[720px]">
            <div className={`rounded-lg px-4 py-2 text-center text-sm font-medium w-full max-w-xs ${
              botThinking
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-surface-alt text-text-dim border border-surface-hover'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <PieceSVG type="K" color={botColor} size={20} />
                <span>Bot ({t(difficultyConfig[difficulty].labelKey)})</span>
                {botThinking && <span className="animate-pulse">{t('bot.thinking')}</span>}
              </div>
            </div>

            <Board
              board={gameState.board}
              playerColor={playerColor}
              isMyTurn={isPlayerTurn && !botThinking}
              legalMoves={legalMoves}
              selectedSquare={selectedSquare}
              lastMove={getLastMove()}
              isCheck={gameState.isCheck}
              checkSquare={getCheckSquare()}
              onSquareClick={handleSquareClick}
              onPieceDrop={handlePieceDrop}
              disabled={gameState.gameOver || !isPlayerTurn || botThinking}
            />

            <div className={`rounded-lg px-4 py-2 text-center text-sm font-medium w-full max-w-xs ${
              isPlayerTurn && !gameState.gameOver
                ? 'bg-primary/20 text-primary-light border border-primary/30'
                : 'bg-surface-alt text-text-dim border border-surface-hover'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <PieceSVG type="K" color={playerColor} size={20} />
                <span>{t('common.you')} ({t(playerColor === 'white' ? 'common.white' : 'common.black')})</span>
                {isPlayerTurn && !gameState.gameOver && <span>· {t('bot.your_turn')}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:w-72 w-full max-w-[720px]">
            <div className={`
              rounded-lg px-4 py-3 text-center font-semibold text-sm
              ${gameState.gameOver
                ? gameState.winner === playerColor
                  ? 'bg-primary/20 text-primary-light border border-primary/30'
                  : gameState.winner
                    ? 'bg-danger/20 text-danger border border-danger/30'
                    : 'bg-accent/20 text-accent border border-accent/30'
                : isPlayerTurn
                  ? 'bg-primary/20 text-primary-light border border-primary/30'
                  : 'bg-surface-alt text-text-dim border border-surface-hover'
              }
            `}>
              {gameState.gameOver
                ? gameState.winner === playerColor ? t('bot.you_won') : gameState.winner ? t('bot.bot_wins') : t('common.draw')
                : isPlayerTurn ? t('bot.your_turn') : t('bot.bot_thinking')
              }
            </div>

            <MoveHistory moves={gameState.moveHistory} initialBoard={createInitialBoard()} />

            {!gameState.gameOver && (
              <button
                onClick={handleResign}
                className="w-full py-2 px-4 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-lg border border-surface-hover transition-colors"
              >
                ⚐ {t('bot.resign')}
              </button>
            )}

            <button
              onClick={handleReset}
              className="w-full py-2.5 px-4 bg-surface-alt hover:bg-surface-hover text-text-bright text-sm rounded-lg border border-surface-hover transition-colors"
            >
              ↺ {t('common.new_game')}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-primary hover:bg-primary-light text-white text-sm rounded-lg transition-colors"
            >
              {t('common.back_home')}
            </button>
          </div>
        </div>
      </main>

      {gameOverInfo && (
        <GameOverModal
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={playerColor}
          onRematch={handleStartGame}
          onNewGame={handleReset}
        />
      )}
    </div>
  );
}
