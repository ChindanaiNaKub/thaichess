import type { BotPersona } from '@shared/botPersonas';
import type { Move, PieceColor, Position, GameState } from '@shared/types';
import { createInitialBoard } from '@shared/engine';
import type { BotChatMessage } from '../lib/botDialogue';
import BotAvatar from './BotAvatar';
import GameOverPanel from './GameOverPanel';
import MoveHistory from './MoveHistory';
import PostGameReviewPanel from './PostGameReviewPanel';
import PostGameSharePanel from './PostGameSharePanel';
import {
  BOT_GAME_TIME_CONTROL,
  type BotTranslationFields,
  type TranslateFn,
} from './botGameHelpers';

export type ReviewControls = {
  mode: 'mainLine' | 'analysis';
  currentState: GameState;
  currentMoveHistory: Move[];
  currentLastMove: Move | import('@shared/types').LastMove | null;
  currentCheckSquare: Position | null;
  selectedMainLineMoveIndex: number;
  analysisRootMoveIndex: number | null;
  analysisLine: Move[];
  legalMoves: Position[];
  selectedSquare: Position | null;
  canEnterAnalysis: boolean;
  canResetAnalysis: boolean;
  canStepBackward: boolean;
  canStepForward: boolean;
  enterAnalysis: () => void;
  returnToMainLine: () => void;
  resetAnalysis: () => void;
  stepBackward: () => void;
  stepForward: () => void;
  jumpToStart: () => void;
  jumpToEnd: () => void;
  jumpToMainLine: (moveIndex: number) => void;
  handleSquareClick: (pos: Position) => void;
  handlePieceDrop: (from: Position, to: Position) => void;
};

export type ReviewEngineControls = {
  analysis: import('@shared/engineAdapter').PositionAnalysisResult | null;
  analyzing: boolean;
  error: string | null;
};

type BotGameSidePanelProps = {
  t: TranslateFn;
  selectedBot: BotPersona;
  selectedBotTranslation: BotTranslationFields;
  gameState: GameState;
  playerColor: PieceColor;
  playerDisplayName: string;
  botName: string;
  levelLabel: string;
  difficultyLabel: string;
  estimatedEloLabel: string;
  statusText: string;
  counting: {
    label: string | null;
    start: (() => void) | null;
    stop: (() => void) | null;
  };
  currentGameId: string | null;
  gameOverInfo: { reason: string; winner: PieceColor | null } | null;
  botChat: BotChatMessage | null;
  botChatFading: boolean;
  review: ReviewControls;
  reviewEngine: ReviewEngineControls;
  viewMoveIndex: number | null;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze: (() => void) | undefined;
  onMoveClick: (index: number) => void;
  onResign: () => void;
  onHome: () => void;
};

export function BotGameSidePanel({
  t,
  selectedBot,
  selectedBotTranslation,
  gameState,
  playerColor,
  playerDisplayName,
  botName,
  levelLabel,
  difficultyLabel,
  estimatedEloLabel,
  statusText,
  counting,
  currentGameId,
  gameOverInfo,
  botChat,
  botChatFading,
  review,
  reviewEngine,
  viewMoveIndex,
  onRematch,
  onNewGame,
  onAnalyze,
  onMoveClick,
  onResign,
  onHome,
}: BotGameSidePanelProps) {
  const reviewActive = gameState.gameOver;

  return (
    <>
      <div className="rounded-[1.35rem] border border-surface-hover bg-[radial-gradient(circle_at_top,rgba(173,130,53,0.16),transparent_38%),linear-gradient(180deg,rgba(47,36,28,0.96),rgba(28,22,18,0.98))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.2)]">
        <div className="flex items-start gap-3">
          <BotAvatar avatar={selectedBot.avatar} size={72} className="shrink-0" />
          <div className="min-w-0">
            <div className="text-lg font-semibold text-text-bright">{selectedBot.name}</div>
            <div className="text-sm text-text-dim">{selectedBot.title}</div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-text-dim">
              <span className="rounded-full border border-surface-hover bg-surface px-2 py-1">{levelLabel}</span>
              <span className="rounded-full border border-surface-hover bg-surface px-2 py-1">{difficultyLabel}</span>
            </div>
            <div className="mt-2 text-xs text-text-dim">{estimatedEloLabel}</div>
          </div>
        </div>

        <div className="mt-3 text-sm font-medium text-text">{selectedBotTranslation.hook || selectedBot.personalityHook}</div>
        <div className="mt-2 text-xs leading-6 text-text-dim">{selectedBotTranslation.backstory || selectedBot.shortBackstory}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {selectedBot.personalityTraits.map((trait) => (
            <span key={trait} className="rounded-full border border-surface-hover bg-surface px-2 py-1 text-[11px] text-text-dim">
              {t(`bot.trait.${trait}`) || trait}
            </span>
          ))}
        </div>

        {botChat && (
          <div className="mt-3 flex items-start gap-2.5">
            <BotAvatar avatar={selectedBot.avatar} size={40} className="shrink-0" />
            <div className={`min-w-0 flex-1 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-3 py-2.5 text-[13px] leading-5 text-text shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-opacity duration-300 ${botChatFading ? 'opacity-0' : 'opacity-100'}`}>
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-text-dim">
                {botChat.category === 'thinking' ? t('bot.chat_thinking') : selectedBot.name}
              </div>
              <div>{botChat.text}</div>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-surface-hover bg-surface-alt/90 px-3 py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="font-semibold text-text-bright">{statusText}</div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-dim">
            <span>{t('bot.vs_bot')}</span>
            <span className="rounded-full px-2 py-1 bg-surface text-text-dim border border-surface-hover">{levelLabel}</span>
            <span className="rounded-full px-2 py-1 bg-surface text-text-dim border border-surface-hover">{difficultyLabel}</span>
          </div>
        </div>
      </div>

      {!gameState.gameOver && counting.label && (
        <div className="rounded-xl px-4 py-3 bg-accent/10 text-accent border border-accent/30">
          <div className="text-xs uppercase tracking-wide font-semibold mb-1">{t('game.counting_title')}</div>
          <div className="text-sm">{counting.label}</div>
          {counting.start && (
            <button type="button" onClick={counting.start} className="mt-3 w-full py-2 px-3 bg-accent/20 hover:bg-accent/30 text-accent text-sm rounded-lg border border-accent/30 transition-colors">
              {t('game.counting_start')}
            </button>
          )}
          {counting.stop && (
            <button type="button" onClick={counting.stop} className="mt-3 w-full py-2 px-3 bg-surface-alt hover:bg-surface-hover text-text text-sm rounded-lg border border-surface-hover transition-colors">
              {t('game.counting_stop')}
            </button>
          )}
        </div>
      )}

      {gameOverInfo && (
        <GameOverPanel
          winner={gameOverInfo.winner}
          reason={gameOverInfo.reason}
          playerColor={playerColor}
          onRematch={onRematch}
          onNewGame={onNewGame}
          onAnalyze={onAnalyze}
        />
      )}

      {gameOverInfo && (
        <PostGameSharePanel
          analysisId={currentGameId}
          board={gameState.board}
          lastMove={gameState.moveHistory[gameState.moveHistory.length - 1] ?? null}
          moves={gameState.moveHistory}
          moveCount={gameState.moveCount}
          playerColor={playerColor}
          whitePlayerName={playerColor === 'white' ? playerDisplayName : botName}
          blackPlayerName={playerColor === 'black' ? playerDisplayName : botName}
          winner={gameOverInfo.winner}
          resultReason={gameOverInfo.reason}
          gameMode="bot"
          timeControl={BOT_GAME_TIME_CONTROL}
        />
      )}

      {reviewActive && (
        <PostGameReviewPanel
          mode={review.mode}
          selectedMainLineMoveIndex={review.selectedMainLineMoveIndex}
          analysisRootMoveIndex={review.analysisRootMoveIndex}
          analysisLine={review.analysisLine}
          controls={{
            enterAnalysis: review.canEnterAnalysis,
            resetAnalysis: review.canResetAnalysis,
            stepBackward: review.canStepBackward,
            stepForward: review.canStepForward,
          }}
          onEnterAnalysis={review.enterAnalysis}
          onReturnToMainLine={review.returnToMainLine}
          onResetAnalysis={review.resetAnalysis}
          onStepBackward={review.stepBackward}
          onStepForward={review.stepForward}
          onJumpToStart={review.jumpToStart}
          onJumpToEnd={review.jumpToEnd}
          engineAnalysis={reviewEngine.analysis}
          engineAnalyzing={reviewEngine.analyzing}
          engineError={reviewEngine.error}
        />
      )}

      <MoveHistory
        moves={gameState.moveHistory}
        initialBoard={createInitialBoard()}
        currentMoveIndex={reviewActive ? review.selectedMainLineMoveIndex : viewMoveIndex ?? undefined}
        onMoveClick={reviewActive ? review.jumpToMainLine : onMoveClick}
      />

      {gameState.moveHistory.length > 0 && (
        <div className="text-center text-[11px] text-text-dim">{t('game.nav_hint')}</div>
      )}

      {!gameState.gameOver && (
        <button type="button" onClick={onResign} className="w-full py-2.5 px-3 bg-surface-alt hover:bg-danger/20 text-text hover:text-danger text-sm rounded-xl border border-surface-hover transition-colors">
          ⚐ {t('bot.resign')}
        </button>
      )}

      <button type="button" onClick={onHome} className="w-full py-2.5 px-4 bg-primary hover:bg-primary-light text-white text-sm rounded-xl transition-colors">
        {t('common.back_home')}
      </button>
    </>
  );
}
