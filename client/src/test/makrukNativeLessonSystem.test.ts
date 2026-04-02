import { describe, expect, it } from 'vitest';
import { getLegalMoves } from '@shared/engine';
import {
  FIRST_HIGH_PAWN_INTERACTIVE_LESSON,
  MAKRUK_NATIVE_LESSON_OUTLINES,
  MAKRUK_NATIVE_LESSON_TRACKS,
  MAKRUK_REFERENCE_SIGNALS,
} from '../lib/makrukNativeLessonSystem';

function sameSquare(left: { row: number; col: number }, right: { row: number; col: number }): boolean {
  return left.row === right.row && left.col === right.col;
}

describe('Makruk native lesson system', () => {
  it('covers the requested Makruk curriculum clusters', () => {
    expect(MAKRUK_REFERENCE_SIGNALS.map(signal => signal.cluster)).toEqual([
      'beginner-fundamentals',
      'opening-formations',
      'opening-formations',
      'middlegame-techniques',
      'endgame-chasing',
      'thai-terminology',
    ]);
  });

  it('ships a five-track course with ordered lesson outlines', () => {
    expect(MAKRUK_NATIVE_LESSON_TRACKS.map(track => track.id)).toEqual([
      'foundations',
      'opening-formations',
      'middlegame-pressure',
      'endgame-chasing',
      'thai-terms',
    ]);
    expect(MAKRUK_NATIVE_LESSON_OUTLINES).toHaveLength(18);
    expect(MAKRUK_NATIVE_LESSON_OUTLINES.map(lesson => lesson.order)).toEqual(
      Array.from({ length: 18 }, (_, index) => index + 1),
    );
  });

  it('gives every outline one idea, one board, one question, and one feedback focus', () => {
    for (const lesson of MAKRUK_NATIVE_LESSON_OUTLINES) {
      expect(lesson.coreIdea.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.coachGoal.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.previewScene.caption.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.coachQuestion.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.feedbackFocus.trim().length, lesson.id).toBeGreaterThan(0);
      expect(lesson.makrukTerms.length, lesson.id).toBeGreaterThan(0);
    }
  });

  it('keeps preview boards anchored with exactly one king per side', () => {
    for (const lesson of MAKRUK_NATIVE_LESSON_OUTLINES) {
      let whiteKings = 0;
      let blackKings = 0;

      for (const row of lesson.previewScene.board) {
        for (const cell of row) {
          if (cell?.type !== 'K') continue;
          if (cell.color === 'white') whiteKings += 1;
          if (cell.color === 'black') blackKings += 1;
        }
      }

      expect(whiteKings, `${lesson.id} should have one white king`).toBe(1);
      expect(blackKings, `${lesson.id} should have one black king`).toBe(1);
    }
  });

  it('includes a coach-led interactive sample with both questions and a legal move task', () => {
    const stepKinds = FIRST_HIGH_PAWN_INTERACTIVE_LESSON.steps.map(step => step.kind);
    expect(stepKinds).toContain('coach');
    expect(stepKinds).toContain('choice');
    expect(stepKinds).toContain('move');
    expect(stepKinds.at(-1)).toBe('wrap');

    const moveStep = FIRST_HIGH_PAWN_INTERACTIVE_LESSON.steps.find(step => step.kind === 'move');
    expect(moveStep?.expectedMove).toBeDefined();

    const moveScene = FIRST_HIGH_PAWN_INTERACTIVE_LESSON.scenes.find(scene => scene.id === moveStep?.sceneId);
    expect(moveScene).toBeDefined();

    const legalMoves = getLegalMoves(moveScene!.board, moveStep!.expectedMove!.from);
    expect(
      legalMoves.some(candidate => sameSquare(candidate, moveStep!.expectedMove!.to)),
      'the example lesson move task should use a legal move',
    ).toBe(true);
  });

  it('gives feedback for every choice option in the interactive lesson', () => {
    const choiceSteps = FIRST_HIGH_PAWN_INTERACTIVE_LESSON.steps.filter(step => step.kind === 'choice');
    expect(choiceSteps.length).toBeGreaterThan(0);

    for (const step of choiceSteps) {
      expect(step.options?.length ?? 0, step.id).toBeGreaterThanOrEqual(3);
      expect(step.options?.some(option => option.correct), `${step.id} needs one correct answer`).toBe(true);
      for (const option of step.options ?? []) {
        expect(option.feedback.trim().length, `${step.id}/${option.id}`).toBeGreaterThan(0);
      }
    }
  });
});
