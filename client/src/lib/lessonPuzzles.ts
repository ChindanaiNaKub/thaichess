import { PUZZLES, type Puzzle } from '@shared/puzzles';
import type { MakrukLesson } from './lessons';

const CONCEPT_TAG_MAP: Record<string, string[]> = {
  opening: ['opening'],
  fork: ['fork', 'double-attack'],
  pin: ['pin'],
  trap: ['trap', 'trapped-piece'],
  endgame: ['endgame', 'promotion'],
  promotion: ['promotion'],
  mate: ['mate', 'support-mate', 'back-rank'],
  coordination: ['support-mate', 'back-rank', 'forcing-sequence'],
  'hanging-piece': ['hanging-piece'],
};

function countConceptHits(puzzle: Puzzle, lesson: MakrukLesson): number {
  return lesson.puzzleConcepts.reduce((score, concept) => {
    const mappedTags = CONCEPT_TAG_MAP[concept] ?? [concept];
    const matchesTag = mappedTags.some(tag => puzzle.tags.includes(tag));
    const matchesTheme = mappedTags.some(tag => puzzle.theme.toLowerCase().includes(tag.replace(/-/g, ' ')));
    return score + (matchesTag || matchesTheme ? 1 : 0);
  }, 0);
}

export function getRelatedPuzzlesForLesson(lesson: MakrukLesson, limit = 3): Puzzle[] {
  return PUZZLES
    .map(puzzle => ({ puzzle, score: countConceptHits(puzzle, lesson) }))
    .filter(entry => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.puzzle.difficulty !== right.puzzle.difficulty) {
        const order = { beginner: 0, intermediate: 1, advanced: 2 };
        return order[left.puzzle.difficulty] - order[right.puzzle.difficulty];
      }
      return left.puzzle.id - right.puzzle.id;
    })
    .slice(0, limit)
    .map(entry => entry.puzzle);
}
