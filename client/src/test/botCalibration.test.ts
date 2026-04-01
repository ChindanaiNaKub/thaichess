import { describe, expect, it } from 'vitest';

import { createBotCalibrationReport } from '@shared/botCalibration';

describe('bot calibration harness', () => {
  const fullRun = process.env.BOT_CALIBRATION_FULL === '1';
  const personaIds = ['saman-noi', 'phra-suman', 'lady-busaba'];
  const benchmarkIds = ['human-greed-trap', 'tactic-hanging-rook', 'endgame-rook-conversion'];

  it('produces a full report with stronger top bots than entry bots', () => {
    const report = createBotCalibrationReport({
      personaIds: fullRun ? undefined : personaIds,
      benchmarkIds: fullRun ? undefined : benchmarkIds,
      gamesPerPairing: fullRun ? 1 : 0,
      maxPlies: fullRun ? 28 : 18,
      benchmarkDepth: fullRun ? 2 : 1,
      beginnerValidationGames: fullRun ? 2 : 1,
    });

    if (process.env.BOT_CALIBRATION_REPORT === '1') {
      console.table(report.rows.map((row) => ({
        bot: row.name,
        rating: row.displayedRating,
        observed: row.observedRating,
        verdict: row.verdict,
        opening: row.benchmarks.opening.averageAccuracy,
        tactical: row.benchmarks.tactical.averageAccuracy,
        endgame: row.benchmarks.endgame.averageAccuracy,
        beginnerScore: row.beginnerValidation?.botScoreRate ?? '-',
      })));
    }

    expect(report.rows).toHaveLength(fullRun ? 10 : personaIds.length);
    expect(report.rows[0].observedRating).toBeLessThan(report.rows[report.rows.length - 1].observedRating);
    expect(report.rows[0].benchmarks.tactical.averageAccuracy).toBeLessThan(
      report.rows[report.rows.length - 1].benchmarks.tactical.averageAccuracy,
    );
  }, fullRun ? 120000 : 30000);

  it('keeps the lowest bots beatable for the beginner baseline', () => {
    const report = createBotCalibrationReport({
      personaIds: ['saman-noi', 'mae-mali'],
      benchmarkIds: ['tactic-hanging-rook'],
      gamesPerPairing: 0,
      maxPlies: 20,
      benchmarkDepth: 1,
      beginnerValidationGames: 2,
    });
    const beginnerRows = report.rows.filter((row) => row.level <= 2);

    expect(beginnerRows).toHaveLength(2);
    for (const row of beginnerRows) {
      expect(row.beginnerValidation).not.toBeNull();
      expect(row.beginnerValidation!.botScoreRate).toBeLessThanOrEqual(1);
    }
  }, fullRun ? 120000 : 30000);
});
