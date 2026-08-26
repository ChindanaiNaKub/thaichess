import { useEffect, useMemo, useRef } from 'react';
import type { ClientGameState, GameState, Move, PieceColor, PieceType, ResultReason } from '@shared/types';
import { getBoardFileLabel, getBoardRankLabel } from '../lib/boardNotation';
import { useCurrentLanguage } from '../lib/i18n';
import type { Language } from '../lib/i18nRuntime';
import type { TranslateFn } from './gamePageHelpers';

const PIECE_NAME_KEYS: Record<PieceType, string> = {
  K: 'guide.king',
  M: 'guide.queen',
  S: 'guide.bishop',
  R: 'guide.rook',
  N: 'guide.knight',
  P: 'guide.pawn',
  PM: 'guide.promoted',
};

const REASON_KEYS: Record<string, string> = {
  checkmate: 'gameover.by_checkmate',
  resignation: 'gameover.by_resign',
  timeout: 'gameover.by_timeout',
  stalemate: 'gameover.by_stalemate',
  draw_agreement: 'gameover.by_agreement',
  insufficient_material: 'gameover.by_material',
  counting_rule: 'gameover.by_counting',
};

function squareLabel(pos: { row: number; col: number }, lang: Language): string {
  return `${getBoardFileLabel(pos.col, lang)}${getBoardRankLabel(pos.row)}`;
}

function describeMove(move: Move, lang: Language, t: TranslateFn): string {
  const pieceName = (type: PieceType | undefined) => t(PIECE_NAME_KEYS[type ?? 'P']);
  let text = t('announce.move', {
    piece: pieceName(move.movedPiece?.type),
    from: squareLabel(move.from, lang),
    to: squareLabel(move.to, lang),
  });
  const captured = move.capturedPiece ?? move.captured;
  if (captured) {
    text += `, ${t('announce.capture', { piece: pieceName(captured.type) })}`;
  }
  if (move.promoted || move.promotion) {
    text += `, ${t('announce.promotion', { piece: pieceName(move.promotion ?? 'PM') })}`;
  }
  return text;
}

function describeGameOver(winner: PieceColor | null, reason: ResultReason, t: TranslateFn): string {
  const reasonText = t(REASON_KEYS[reason ?? ''] ?? 'gameover.by_unknown');
  if (!winner) {
    return t('announce.game_over_draw', { reason: reasonText });
  }
  const winnerText = t(winner === 'white' ? 'common.white' : 'common.black');
  return t('announce.game_over_winner', { color: winnerText, reason: reasonText });
}

type AnnounceableState = GameState | ClientGameState;

interface MoveAnnouncerProps {
  gameState: AnnounceableState;
  playerColor: PieceColor | null;
  t: TranslateFn;
}

export function MoveAnnouncer({ gameState, playerColor, t }: MoveAnnouncerProps) {
  const lang = useCurrentLanguage();
  const prevRef = useRef<{ moveCount: number; gameOver: boolean; announcement: string } | null>(null);

  const announcement = useMemo(() => {
    const prev = prevRef.current;
    if (!prev || gameState.moveHistory.length === 0) return prev?.announcement ?? '';
    const hasNewMove = gameState.moveHistory.length > prev.moveCount;
    const justEnded = gameState.gameOver && !prev.gameOver;
    if (!hasNewMove && !justEnded) return prev.announcement ?? '';
    const sentences: string[] = [];
    if (hasNewMove) {
      const move = gameState.moveHistory[gameState.moveHistory.length - 1];
      const moverColor: PieceColor = gameState.turn === 'white' ? 'black' : 'white';
      const isOpponentMove = playerColor === null || moverColor !== playerColor;
      if (isOpponentMove) {
        sentences.push(describeMove(move, lang, t));
        if (gameState.isCheck && !gameState.gameOver) {
          sentences.push(t('announce.check'));
        }
      }
    }
    if (justEnded) {
      sentences.push(describeGameOver(gameState.winner, gameState.resultReason, t));
    }
    if (sentences.length > 0) return sentences.join('. ');
    return prev.announcement ?? '';
  }, [gameState, playerColor, lang, t]);

  useEffect(() => {
    prevRef.current = {
      moveCount: gameState.moveHistory.length,
      gameOver: gameState.gameOver,
      announcement,
    };
  }, [gameState.moveHistory.length, gameState.gameOver, announcement]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" data-testid="move-announcer" className="sr-only">
      {announcement}
    </div>
  );
}

export default MoveAnnouncer;
