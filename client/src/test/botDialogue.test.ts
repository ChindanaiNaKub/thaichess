import { describe, expect, it, vi } from 'vitest';

import { createInitialGameState } from '@shared/engine';
import { getBotPersonaById } from '@shared/botPersonas';
import {
  createBotIntroDecision,
  maybeCreateMoveDialogue,
  type BotChatHistory,
} from '../lib/botDialogue';

function createHistory(overrides?: Partial<BotChatHistory>): BotChatHistory {
  return {
    lastChatMoveCount: -99,
    lastChatAt: -100000,
    recentLineKeys: [],
    hasActiveMessage: false,
    hasPendingMessage: false,
    ...overrides,
  };
}

describe('botDialogue', () => {
  it('avoids recently used lines when selecting a new intro', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const persona = getBotPersonaById('phra-suman');
    const decision = createBotIntroDecision(persona, 'en', createHistory({
      recentLineKeys: ['intro:0'],
    }));

    expect(decision).not.toBeNull();
    expect(decision?.message.lineKey).toBe('intro:1');
    expect(decision?.message.text).toBe(persona.dialogue.intro[1]);
  });

  it('uses Thai dialogue when Thai is the active locale', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const persona = getBotPersonaById('phra-suman');
    const decision = createBotIntroDecision(persona, 'th', createHistory());

    expect(decision).not.toBeNull();
    expect(decision?.message.text).toBe('ค่อย ๆ เล่น กระดานจะบอกเอง');
  });

  it('stays silent on an ordinary non-tactical move', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const persona = getBotPersonaById('phra-suman');
    const previousState = createInitialGameState(0, 0);
    const nextState = {
      ...previousState,
      turn: 'black' as const,
      moveHistory: [
        {
          from: { row: 2, col: 3 },
          to: { row: 3, col: 3 },
        },
      ],
    };

    const decision = maybeCreateMoveDialogue({
      persona,
      locale: 'en',
      previousState,
      nextState,
      botColor: 'black',
      history: createHistory(),
      trigger: 'after_player_move',
    });

    expect(decision).toBeNull();
  });

  it('respects cooldown and recent silence rules for eligible tactical moments', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const persona = getBotPersonaById('khun-intharat');
    const previousState = createInitialGameState(0, 0);
    const nextState = {
      ...previousState,
      turn: 'white' as const,
      isCheck: true,
      moveHistory: [
        {
          from: { row: 5, col: 3 },
          to: { row: 4, col: 3 },
          captured: { type: 'N' as const, color: 'white' as const },
        },
      ],
    };

    const decision = maybeCreateMoveDialogue({
      persona,
      locale: 'en',
      previousState,
      nextState,
      botColor: 'black',
      history: createHistory({
        lastChatMoveCount: 0,
        lastChatAt: Date.now(),
      }),
      trigger: 'after_bot_move',
    });

    expect(decision).toBeNull();
  });
});
