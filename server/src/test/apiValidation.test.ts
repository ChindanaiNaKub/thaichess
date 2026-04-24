import { describe, expect, it } from 'vitest';
import {
  AnalyzeGameSchema,
  AnalyzePositionSchema,
  ReportFairPlaySchema,
  SaveBotGameSchema,
  SaveLocalGameSchema,
} from '../../../shared/validation/api';

const uuidGameId = '54718574-8df5-48cc-97f4-16349bf43402';

describe('API validation schemas', () => {
  it('accepts UUID-format game ids for bot saves, local saves, and fair-play reports', () => {
    expect(SaveBotGameSchema.safeParse({
      id: uuidGameId,
      result: 'black',
      resultReason: 'resignation',
      playerColor: 'white',
      level: 4,
      botId: 'phra-suman',
      moves: [{}],
      finalBoard: [[null]],
      moveCount: 1,
      timeControl: {
        initial: 600,
        increment: 0,
      },
      playerName: 'Anonymous',
    }).success).toBe(true);

    expect(SaveLocalGameSchema.safeParse({
      id: uuidGameId,
      result: 'draw',
      resultReason: 'agreement',
      whiteName: 'White',
      blackName: 'Black',
      moves: [{}],
      finalBoard: [[null]],
      moveCount: 1,
      timeControl: {
        initial: 600,
        increment: 0,
      },
    }).success).toBe(true);

    expect(ReportFairPlaySchema.safeParse({
      gameId: uuidGameId,
      message: 'test',
    }).success).toBe(true);
  });

  it('accepts bot saves for immediate resignations with zero moves played', () => {
    expect(SaveBotGameSchema.safeParse({
      id: uuidGameId,
      result: 'black',
      resultReason: 'resignation',
      playerColor: 'white',
      level: 4,
      botId: 'phra-suman',
      moves: [],
      finalBoard: [[null]],
      moveCount: 0,
      timeControl: {
        initial: 600,
        increment: 0,
      },
      playerName: 'Anonymous',
    }).success).toBe(true);
  });

  it('caps analysis requests to protect engine resources', () => {
    expect(AnalyzeGameSchema.safeParse({
      moves: Array.from({ length: 241 }, () => ({})),
    }).success).toBe(false);

    expect(AnalyzeGameSchema.safeParse({
      moves: [{}],
      movetimeMs: 30_000,
    }).success).toBe(false);

    expect(AnalyzePositionSchema.safeParse({
      position: '8/8/8/8/8/8/8/8 w - - 0 1',
      movetimeMs: 30_000,
    }).success).toBe(false);

    expect(AnalyzePositionSchema.safeParse({
      position: '8/8/8/8/8/8/8/8 w - - 0 1',
      multipv: 5,
    }).success).toBe(false);
  });
});
