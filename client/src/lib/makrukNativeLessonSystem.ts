import { createInitialBoard } from '@shared/engine';
import type { Board, Piece, PieceColor, PieceType, Position } from '@shared/types';

type Placement = [square: string, type: PieceType, color: PieceColor];

export type NativeLessonTrackId =
  | 'foundations'
  | 'opening-formations'
  | 'middlegame-pressure'
  | 'endgame-chasing'
  | 'thai-terms';

export interface NativeReferenceSignal {
  id: string;
  cluster:
    | 'beginner-fundamentals'
    | 'opening-formations'
    | 'middlegame-techniques'
    | 'endgame-chasing'
    | 'thai-terminology';
  sitePattern: string;
  productUse: string;
}

export interface NativeBoardHighlight {
  square: Position;
  tone: 'focus' | 'target' | 'support' | 'warning';
}

export interface NativeBoardArrow {
  from: Position;
  to: Position;
  tone: 'plan' | 'move' | 'threat';
}

export interface NativeBoardLabel {
  square: Position;
  text: string;
}

export interface NativeBoardScene {
  id: string;
  board: Board;
  toMove: PieceColor;
  playerColor: PieceColor;
  caption: string;
  highlights?: NativeBoardHighlight[];
  arrows?: NativeBoardArrow[];
  labels?: NativeBoardLabel[];
}

export interface NativeLessonOutline {
  id: string;
  trackId: NativeLessonTrackId;
  order: number;
  title: string;
  shortTitle: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  coreIdea: string;
  coachGoal: string;
  makrukTerms: string[];
  previewScene: NativeBoardScene;
  coachQuestion: string;
  feedbackFocus: string;
}

export interface NativeLessonTrack {
  id: NativeLessonTrackId;
  order: number;
  title: string;
  promise: string;
  lessons: NativeLessonOutline[];
}

export interface NativeChoiceOption {
  id: string;
  label: string;
  correct: boolean;
  feedback: string;
}

export interface NativeCoachStep {
  id: string;
  kind: 'coach' | 'choice' | 'move' | 'wrap';
  sceneId: string;
  title: string;
  body: string;
  prompt?: string;
  options?: NativeChoiceOption[];
  expectedMove?: {
    from: Position;
    to: Position;
  };
  successFeedback?: string;
  wrongMoveFeedback?: string;
}

export interface NativeInteractiveLesson extends NativeLessonOutline {
  scenes: NativeBoardScene[];
  steps: NativeCoachStep[];
}

function piece(type: PieceType, color: PieceColor): Piece {
  return { type, color };
}

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null));
}

function square(name: string): Position {
  if (!/^[a-h][1-8]$/.test(name)) {
    throw new Error(`Invalid square: ${name}`);
  }

  return {
    col: name.charCodeAt(0) - 97,
    row: Number.parseInt(name[1], 10) - 1,
  };
}

function board(...placements: Placement[]): Board {
  const next = emptyBoard();

  for (const [name, type, color] of placements) {
    const pos = square(name);
    next[pos.row][pos.col] = piece(type, color);
  }

  return next;
}

function move(from: string, to: string): { from: Position; to: Position } {
  return { from: square(from), to: square(to) };
}

function highlight(name: string, tone: NativeBoardHighlight['tone']): NativeBoardHighlight {
  return { square: square(name), tone };
}

function arrow(from: string, to: string, tone: NativeBoardArrow['tone']): NativeBoardArrow {
  return { from: square(from), to: square(to), tone };
}

function label(name: string, text: string): NativeBoardLabel {
  return { square: square(name), text };
}

function scene(
  id: string,
  boardState: Board,
  toMove: PieceColor,
  caption: string,
  extras: Omit<NativeBoardScene, 'id' | 'board' | 'toMove' | 'playerColor' | 'caption'> & {
    playerColor?: PieceColor;
  } = {},
): NativeBoardScene {
  return {
    id,
    board: boardState,
    toMove,
    playerColor: extras.playerColor ?? toMove,
    caption,
    highlights: extras.highlights,
    arrows: extras.arrows,
    labels: extras.labels,
  };
}

const shortRangeBoard = board(
  ['d1', 'K', 'white'],
  ['e2', 'M', 'white'],
  ['c2', 'S', 'white'],
  ['f2', 'S', 'white'],
  ['d4', 'P', 'white'],
  ['e8', 'K', 'black'],
  ['d6', 'P', 'black'],
);

const highPawnBoard = board(
  ['a1', 'R', 'white'],
  ['b1', 'N', 'white'],
  ['c1', 'S', 'white'],
  ['d1', 'K', 'white'],
  ['e1', 'M', 'white'],
  ['f1', 'S', 'white'],
  ['g1', 'N', 'white'],
  ['h1', 'R', 'white'],
  ['a3', 'P', 'white'],
  ['b3', 'P', 'white'],
  ['c3', 'P', 'white'],
  ['d3', 'P', 'white'],
  ['e4', 'P', 'white'],
  ['f3', 'P', 'white'],
  ['g3', 'P', 'white'],
  ['h3', 'P', 'white'],
  ['a8', 'R', 'black'],
  ['b8', 'N', 'black'],
  ['c8', 'S', 'black'],
  ['d8', 'M', 'black'],
  ['e8', 'K', 'black'],
  ['f8', 'S', 'black'],
  ['g8', 'N', 'black'],
  ['h8', 'R', 'black'],
  ['a6', 'P', 'black'],
  ['b6', 'P', 'black'],
  ['c6', 'P', 'black'],
  ['d6', 'P', 'black'],
  ['e6', 'P', 'black'],
  ['f6', 'P', 'black'],
  ['g6', 'P', 'black'],
  ['h6', 'P', 'black'],
);

const promotionLaneBoard = board(
  ['d2', 'K', 'white'],
  ['f4', 'R', 'white'],
  ['e5', 'P', 'white'],
  ['g7', 'K', 'black'],
  ['e8', 'R', 'black'],
);

const maYongRightBoard = board(
  ['a1', 'R', 'white'],
  ['b1', 'N', 'white'],
  ['c1', 'S', 'white'],
  ['d1', 'K', 'white'],
  ['e1', 'M', 'white'],
  ['f1', 'S', 'white'],
  ['f3', 'N', 'white'],
  ['h1', 'R', 'white'],
  ['c3', 'P', 'white'],
  ['d3', 'P', 'white'],
  ['e4', 'P', 'white'],
  ['g3', 'P', 'white'],
  ['a8', 'R', 'black'],
  ['c8', 'S', 'black'],
  ['d8', 'M', 'black'],
  ['e8', 'K', 'black'],
  ['f8', 'S', 'black'],
  ['g8', 'N', 'black'],
  ['h8', 'R', 'black'],
  ['c6', 'P', 'black'],
  ['d6', 'P', 'black'],
  ['e6', 'P', 'black'],
  ['g6', 'P', 'black'],
);

const maYongLeftBoard = board(
  ['a1', 'R', 'white'],
  ['c1', 'S', 'white'],
  ['d1', 'K', 'white'],
  ['e1', 'M', 'white'],
  ['f1', 'S', 'white'],
  ['d2', 'N', 'white'],
  ['g1', 'N', 'white'],
  ['h1', 'R', 'white'],
  ['b4', 'P', 'white'],
  ['d3', 'P', 'white'],
  ['e3', 'P', 'white'],
  ['f3', 'P', 'white'],
  ['a8', 'R', 'black'],
  ['b8', 'N', 'black'],
  ['c8', 'S', 'black'],
  ['d8', 'M', 'black'],
  ['e8', 'K', 'black'],
  ['f8', 'S', 'black'],
  ['h8', 'R', 'black'],
  ['b6', 'P', 'black'],
  ['d6', 'P', 'black'],
  ['e6', 'P', 'black'],
  ['f6', 'P', 'black'],
);

const maPhukBoard = board(
  ['d2', 'K', 'white'],
  ['d4', 'N', 'white'],
  ['f3', 'N', 'white'],
  ['e4', 'P', 'white'],
  ['e8', 'K', 'black'],
  ['d6', 'P', 'black'],
  ['e6', 'P', 'black'],
  ['f6', 'P', 'black'],
);

const pawnLanguageBoard = board(
  ['d1', 'K', 'white'],
  ['d4', 'P', 'white'],
  ['e4', 'P', 'white'],
  ['f5', 'PM', 'white'],
  ['g4', 'P', 'white'],
  ['e8', 'K', 'black'],
  ['c6', 'P', 'black'],
  ['d6', 'P', 'black'],
  ['f6', 'P', 'black'],
);

const rueaLoiBoard = board(
  ['c2', 'K', 'white'],
  ['e4', 'R', 'white'],
  ['d3', 'N', 'white'],
  ['e3', 'P', 'white'],
  ['g7', 'K', 'black'],
  ['e6', 'N', 'black'],
  ['g6', 'P', 'black'],
);

const expandEdgeBoard = board(
  ['c2', 'K', 'white'],
  ['d5', 'R', 'white'],
  ['e4', 'S', 'white'],
  ['f4', 'P', 'white'],
  ['g4', 'P', 'white'],
  ['g8', 'K', 'black'],
  ['d7', 'P', 'black'],
  ['f7', 'N', 'black'],
  ['h6', 'P', 'black'],
);

const khonMetNetBoard = board(
  ['c3', 'K', 'white'],
  ['e5', 'M', 'white'],
  ['f4', 'S', 'white'],
  ['g5', 'R', 'white'],
  ['g8', 'K', 'black'],
  ['f7', 'PM', 'black'],
  ['h6', 'P', 'black'],
);

const stackedRooksBoard = board(
  ['c2', 'K', 'white'],
  ['d1', 'R', 'white'],
  ['d3', 'R', 'white'],
  ['e4', 'P', 'white'],
  ['g8', 'K', 'black'],
  ['d6', 'P', 'black'],
  ['f7', 'S', 'black'],
);

const countingBoard = board(
  ['c3', 'K', 'white'],
  ['d6', 'R', 'white'],
  ['h8', 'K', 'black'],
);

const correctCornerBoard = board(
  ['c3', 'K', 'white'],
  ['f5', 'PM', 'white'],
  ['h8', 'K', 'black'],
);

const khonChaseBoard = board(
  ['c3', 'K', 'white'],
  ['e5', 'S', 'white'],
  ['f5', 'PM', 'white'],
  ['h8', 'K', 'black'],
);

const maEscapeBoard = board(
  ['c3', 'K', 'white'],
  ['e4', 'N', 'white'],
  ['g6', 'PM', 'white'],
  ['h8', 'K', 'black'],
);

const terminologyBoard = board(
  ['d2', 'K', 'white'],
  ['d4', 'P', 'white'],
  ['e4', 'P', 'white'],
  ['f3', 'N', 'white'],
  ['e2', 'M', 'white'],
  ['g7', 'K', 'black'],
  ['e6', 'R', 'black'],
);

const reviewBoard = board(
  ['c2', 'K', 'white'],
  ['d2', 'N', 'white'],
  ['f3', 'N', 'white'],
  ['e4', 'P', 'white'],
  ['d1', 'R', 'white'],
  ['g8', 'K', 'black'],
  ['d6', 'P', 'black'],
  ['f7', 'S', 'black'],
);

export const MAKRUK_REFERENCE_SIGNALS: NativeReferenceSignal[] = [
  {
    id: 'movement-and-piece-identity',
    cluster: 'beginner-fundamentals',
    sitePattern: 'Piece movement, role identity, and basic Makruk setup',
    productUse: 'Foundations lessons start with piece limits, short-range movement, and third-rank pawns.',
  },
  {
    id: 'ma-yong-family',
    cluster: 'opening-formations',
    sitePattern: 'Named opening families such as Ma Yong right and left',
    productUse: 'Opening lessons become shape-recognition drills instead of long theory trees.',
  },
  {
    id: 'pawn-structure-language',
    cluster: 'opening-formations',
    sitePattern: 'Thai pawn names like bia sung, bia phuk, bia thiam, and bia kao',
    productUse: 'Pawn lessons teach named Makruk landmarks rather than generic center rules.',
  },
  {
    id: 'advantage-expansion',
    cluster: 'middlegame-techniques',
    sitePattern: 'Site labels around expanding an edge, tying pieces together, and rook handling',
    productUse: 'Middlegame lessons focus on restriction and shape maintenance before direct attack.',
  },
  {
    id: 'lai-and-counting',
    cluster: 'endgame-chasing',
    sitePattern: 'Endgame chase patterns, correct-corner logic, and counting rules',
    productUse: 'Endgame lessons teach pursuit routes and practical draw-clock awareness.',
  },
  {
    id: 'thai-vocabulary',
    cluster: 'thai-terminology',
    sitePattern: 'Glossary entries such as ruea loi, bia ngai, sak kradan, and sak mak',
    productUse: 'The final track teaches players to read Thai Makruk commentary as board instructions.',
  },
];

const FOUNDATIONS_LESSONS: NativeLessonOutline[] = [
  {
    id: 'battlefield-and-piece-limits',
    trackId: 'foundations',
    order: 1,
    title: 'Battlefield And Piece Limits',
    shortTitle: 'Battlefield',
    level: 'beginner',
    coreIdea: 'Makruk starts faster because pawns begin on the third rank and most major pieces are short-range.',
    coachGoal: 'Help the learner see why shape matters earlier in Makruk than in western chess.',
    makrukTerms: ['Khun', 'Met', 'Khon', 'Ma', 'Rua', 'Bia'],
    previewScene: scene('battlefield-preview', createInitialBoard(), 'white', 'The start position already points the fight toward the center.', {
      highlights: [
        highlight('d3', 'focus'),
        highlight('e3', 'focus'),
        highlight('d6', 'target'),
        highlight('e6', 'target'),
      ],
    }),
    coachQuestion: 'Which part of the board becomes important immediately because the Bia start on rank three?',
    feedbackFocus: 'The center matters at once because one pawn step already creates contact.',
  },
  {
    id: 'met-khon-short-range-control',
    trackId: 'foundations',
    order: 2,
    title: 'Met And Khon Are Short-Range Controllers',
    shortTitle: 'Met + Khon',
    level: 'beginner',
    coreIdea: 'Met and Khon do not dominate long files, so Makruk plans rely on careful support and square control.',
    coachGoal: 'Replace western queen-and-bishop instincts with Makruk piece expectations.',
    makrukTerms: ['Met', 'Khon'],
    previewScene: scene('short-range-preview', shortRangeBoard, 'white', 'White uses nearby control, not long-range force.', {
      highlights: [
        highlight('e2', 'focus'),
        highlight('c2', 'support'),
        highlight('f2', 'support'),
      ],
    }),
    coachQuestion: 'Which white pieces are helping the center without reaching across the whole board?',
    feedbackFocus: 'Makruk rewards layered nearby control more than one-piece domination.',
  },
  {
    id: 'first-bia-sung-na-met',
    trackId: 'foundations',
    order: 3,
    title: 'First Bia Sung Na Met',
    shortTitle: 'High Pawn',
    level: 'beginner',
    coreIdea: 'A high pawn in front of the Met is a named Makruk structure, not just a random center move.',
    coachGoal: 'Teach the learner to recognize a Thai pawn landmark and support it properly.',
    makrukTerms: ['Bia sung', 'Bia sung na Met', 'Met'],
    previewScene: scene('high-pawn-preview', highPawnBoard, 'white', 'The e-pawn is already advanced and needs the right support.', {
      highlights: [
        highlight('e4', 'focus'),
        highlight('b1', 'support'),
        highlight('d2', 'target'),
      ],
      arrows: [arrow('b1', 'd2', 'plan')],
    }),
    coachQuestion: 'What supporting move keeps this named pawn shape healthy instead of loose?',
    feedbackFocus: 'A good high pawn gains value only when the rest of the shape grows around it.',
  },
  {
    id: 'promotion-lane-to-bia-ngai',
    trackId: 'foundations',
    order: 4,
    title: 'Promotion Lane To Bia Ngai',
    shortTitle: 'Bia Ngai',
    level: 'beginner',
    coreIdea: 'Promotion in Makruk creates a Bia Ngai, which behaves like a Met and changes endgame routes early.',
    coachGoal: 'Make promotion feel like a practical shape change, not a distant rule.',
    makrukTerms: ['Bia ngai', 'Met'],
    previewScene: scene('promotion-preview', promotionLaneBoard, 'white', 'One more step turns the pawn into a short-range power piece.', {
      highlights: [
        highlight('e5', 'focus'),
        highlight('e6', 'target'),
      ],
      arrows: [arrow('e5', 'e6', 'move')],
    }),
    coachQuestion: 'What new role does this pawn take on after promotion?',
    feedbackFocus: 'After promotion, you gain a Met-like piece, not a western queen.',
  },
];

const OPENING_FORMATION_LESSONS: NativeLessonOutline[] = [
  {
    id: 'ma-yong-right-entry',
    trackId: 'opening-formations',
    order: 5,
    title: 'Ma Yong Right Entry',
    shortTitle: 'Ma Yong Right',
    level: 'intermediate',
    coreIdea: 'The right-side Ma grows as part of a shape around central pawns, not as a lone attacking jump.',
    coachGoal: 'Teach recognition of the right-side Ma Yong shell as a formation family.',
    makrukTerms: ['Ma Yong', 'right side', 'Bia sung'],
    previewScene: scene('ma-yong-right-preview', maYongRightBoard, 'white', 'White has the shell; the lesson is about reading its purpose.', {
      highlights: [
        highlight('f3', 'focus'),
        highlight('e4', 'support'),
        highlight('d5', 'target'),
      ],
    }),
    coachQuestion: 'Why is the Ma on f3 useful here even before any tactic appears?',
    feedbackFocus: 'The Ma helps the shell breathe and keeps central squares under practical pressure.',
  },
  {
    id: 'ma-yong-left-entry',
    trackId: 'opening-formations',
    order: 6,
    title: 'Ma Yong Left Entry',
    shortTitle: 'Ma Yong Left',
    level: 'intermediate',
    coreIdea: 'The left-side Ma Yong branch changes which pawn breaks and support squares matter first.',
    coachGoal: 'Show that left and right Ma Yong are related families with different board geography.',
    makrukTerms: ['Ma Yong', 'left side'],
    previewScene: scene('ma-yong-left-preview', maYongLeftBoard, 'white', 'The left branch leans on different support squares than the right branch.', {
      highlights: [
        highlight('d2', 'focus'),
        highlight('b4', 'support'),
        highlight('c5', 'target'),
      ],
    }),
    coachQuestion: 'Which side of the board becomes easier to grow from this left-side setup?',
    feedbackFocus: 'Opening names matter because they change the map of useful squares.',
  },
  {
    id: 'ma-phuk-vs-ma-thiam',
    trackId: 'opening-formations',
    order: 7,
    title: 'Ma Phuk Vs Ma Thiam',
    shortTitle: 'Ma Shapes',
    level: 'intermediate',
    coreIdea: 'Makruk separates knight pairs by shape: linked knights and side-by-side knights do different jobs.',
    coachGoal: 'Teach the learner to see form names as functional labels, not vocabulary trivia.',
    makrukTerms: ['Ma phuk', 'Ma thiam'],
    previewScene: scene('ma-phuk-preview', maPhukBoard, 'white', 'This shape emphasizes linked support rather than a flat front.', {
      highlights: [
        highlight('d4', 'focus'),
        highlight('f3', 'focus'),
      ],
      labels: [
        label('d4', 'Ma'),
        label('f3', 'Ma'),
      ],
    }),
    coachQuestion: 'What does this pair do better than two Ma standing on the same rank?',
    feedbackFocus: 'Shape language tells you what the pair can protect and where it can pivot next.',
  },
  {
    id: 'pawn-structure-language',
    trackId: 'opening-formations',
    order: 8,
    title: 'Pawn Structure Language',
    shortTitle: 'Pawn Names',
    level: 'intermediate',
    coreIdea: 'Thai pawn names describe real endgame and middlegame value, so they should be learned as board patterns.',
    coachGoal: 'Turn vocabulary like Bia Phuk and Bia Kao into visual recognition skills.',
    makrukTerms: ['Bia phuk', 'Bia thiam', 'Bia kao', 'inside pawn', 'outside pawn'],
    previewScene: scene('pawn-language-preview', pawnLanguageBoard, 'white', 'This board lets the coach point at several Thai pawn labels at once.', {
      highlights: [
        highlight('d4', 'focus'),
        highlight('e4', 'focus'),
        highlight('f5', 'target'),
        highlight('g4', 'warning'),
      ],
    }),
    coachQuestion: 'Which pawns work as a Thai pair, and which pawn is the far outside runner?',
    feedbackFocus: 'The learner should start naming the shape before calculating the position.',
  },
];

const MIDDLEGAME_PRESSURE_LESSONS: NativeLessonOutline[] = [
  {
    id: 'avoid-ruea-loi',
    trackId: 'middlegame-pressure',
    order: 9,
    title: 'Avoid Ruea Loi',
    shortTitle: 'Ruea Loi',
    level: 'intermediate',
    coreIdea: 'A floating rook is dangerous in Makruk because support webs matter more than raw range.',
    coachGoal: 'Teach the learner to keep the rook tied into the army instead of drifting.',
    makrukTerms: ['Ruea loi'],
    previewScene: scene('ruea-loi-preview', rueaLoiBoard, 'white', 'The rook is active, but it is asking to be judged on support.', {
      highlights: [
        highlight('e4', 'warning'),
        highlight('d3', 'support'),
      ],
    }),
    coachQuestion: 'Is this rook strong because it is active, or weak because it is floating?',
    feedbackFocus: 'Makruk activity without support often becomes a liability.',
  },
  {
    id: 'expand-a-small-edge',
    trackId: 'middlegame-pressure',
    order: 10,
    title: 'Expand A Small Edge',
    shortTitle: 'Expand Edge',
    level: 'advanced',
    coreIdea: 'Makruk often rewards squeezing space and targets instead of rushing for tactics.',
    coachGoal: 'Train the learner to grow an edge through restriction.',
    makrukTerms: ['expand advantage', 'restriction'],
    previewScene: scene('expand-edge-preview', expandEdgeBoard, 'white', 'White already has a nicer shape; the lesson is how to make it matter.', {
      highlights: [
        highlight('d5', 'focus'),
        highlight('d7', 'target'),
      ],
    }),
    coachQuestion: 'What weakness should White keep pressing instead of starting a speculative attack?',
    feedbackFocus: 'The best Makruk plan often makes one weakness heavier before creating a second one.',
  },
  {
    id: 'khon-met-support-net',
    trackId: 'middlegame-pressure',
    order: 11,
    title: 'Khon Plus Met Support Net',
    shortTitle: 'Khon + Met Net',
    level: 'advanced',
    coreIdea: 'Khon and Met create dense nearby pressure that can lock escape squares better than flashy tactics.',
    coachGoal: 'Teach how short-range pieces cooperate in Makruk attacks.',
    makrukTerms: ['Khon', 'Met'],
    previewScene: scene('khon-met-preview', khonMetNetBoard, 'white', 'The attack works because each short-range piece covers a nearby gap.', {
      highlights: [
        highlight('e5', 'focus'),
        highlight('f4', 'support'),
        highlight('g8', 'target'),
      ],
    }),
    coachQuestion: 'Which escape squares disappear because the Khon and Met work together?',
    feedbackFocus: 'Short-range coordination is a first-class attacking skill in Makruk.',
  },
  {
    id: 'stacked-rooks-lane-pressure',
    trackId: 'middlegame-pressure',
    order: 12,
    title: 'Stacked Rooks And Lane Pressure',
    shortTitle: 'Rook Stack',
    level: 'advanced',
    coreIdea: 'Two Rua on one lane can convert a positional edge without forcing immediate mate.',
    coachGoal: 'Show that rook stacking is a pressure plan, not just a tactic trigger.',
    makrukTerms: ['Rua', 'lane pressure'],
    previewScene: scene('stacked-rooks-preview', stackedRooksBoard, 'white', 'The rooks are lined up to weigh on one file until the target bends.', {
      highlights: [
        highlight('d1', 'support'),
        highlight('d3', 'focus'),
        highlight('d6', 'target'),
      ],
    }),
    coachQuestion: 'What makes the d-file worth doubling on in this position?',
    feedbackFocus: 'The file matters because it leads to a real weakness, not because doubling is always good.',
  },
];

const ENDGAME_CHASING_LESSONS: NativeLessonOutline[] = [
  {
    id: 'counting-rule-awareness',
    trackId: 'endgame-chasing',
    order: 13,
    title: 'Counting Rule Awareness',
    shortTitle: 'Counting',
    level: 'advanced',
    coreIdea: 'Endgame technique in Makruk is incomplete without knowing when the draw clock starts to matter.',
    coachGoal: 'Make the learner feel the practical pressure of sak kradan and sak mak.',
    makrukTerms: ['Sak kradan', 'Sak mak'],
    previewScene: scene('counting-preview', countingBoard, 'white', 'White is better, but the count decides whether technique is enough.', {
      highlights: [
        highlight('d6', 'focus'),
        highlight('h8', 'target'),
      ],
    }),
    coachQuestion: 'What extra question must White ask here besides "How do I win?"',
    feedbackFocus: 'In Makruk, winning plans must also fit the count.',
  },
  {
    id: 'correct-corner-with-bia-ngai',
    trackId: 'endgame-chasing',
    order: 14,
    title: 'Correct Corner With Bia Ngai',
    shortTitle: 'Correct Corner',
    level: 'advanced',
    coreIdea: 'Bia Ngai endgames depend on steering the enemy king toward the correct corner.',
    coachGoal: 'Introduce the correct-corner idea as a real routing problem.',
    makrukTerms: ['Bia ngai', 'correct corner', 'wrong corner'],
    previewScene: scene('correct-corner-preview', correctCornerBoard, 'white', 'The promoted pawn matters, but so does the corner you drive the king toward.', {
      highlights: [
        highlight('f5', 'focus'),
        highlight('h8', 'target'),
      ],
    }),
    coachQuestion: 'Why is the destination corner part of the technique, not an afterthought?',
    feedbackFocus: 'Some Makruk chases only work if the corner matches the promoted pawn route.',
  },
  {
    id: 'khon-and-bia-ngai-chasing-skeleton',
    trackId: 'endgame-chasing',
    order: 15,
    title: 'Khon And Bia Ngai Chasing Skeleton',
    shortTitle: 'Khon Chase',
    level: 'advanced',
    coreIdea: 'A Khon and Bia Ngai can herd the king by closing nearby squares in sequence.',
    coachGoal: 'Teach the skeleton of a chase before move memorization.',
    makrukTerms: ['Khon', 'Bia ngai', 'lai'],
    previewScene: scene('khon-chase-preview', khonChaseBoard, 'white', 'The chase is about closing squares in layers.', {
      highlights: [
        highlight('e5', 'support'),
        highlight('f5', 'focus'),
        highlight('h8', 'target'),
      ],
    }),
    coachQuestion: 'Which piece takes away the next safe square first: the Khon or the Bia Ngai?',
    feedbackFocus: 'The learner should see the chase as a route-closing pattern.',
  },
  {
    id: 'ma-vs-bia-ngai-escape-control',
    trackId: 'endgame-chasing',
    order: 16,
    title: 'Ma Versus Bia Ngai Escape Control',
    shortTitle: 'Ma Control',
    level: 'advanced',
    coreIdea: 'A Ma can shape the enemy king route differently from a Khon, so the chase plan changes too.',
    coachGoal: 'Help the learner compare chase tools rather than memorizing one template.',
    makrukTerms: ['Ma', 'Bia ngai', 'escape squares'],
    previewScene: scene('ma-escape-preview', maEscapeBoard, 'white', 'The Ma changes the geometry of the chase.', {
      highlights: [
        highlight('e4', 'focus'),
        highlight('g6', 'support'),
      ],
    }),
    coachQuestion: 'Which escape squares vanish because the Ma jumps rather than slides?',
    feedbackFocus: 'Different Makruk pieces chase with different geometry and timing.',
  },
];

const THAI_TERM_LESSONS: NativeLessonOutline[] = [
  {
    id: 'read-thai-pattern-language',
    trackId: 'thai-terms',
    order: 17,
    title: 'Read Thai Pattern Language',
    shortTitle: 'Pattern Language',
    level: 'advanced',
    coreIdea: 'Thai Makruk terms are compressed board instructions, so reading them speeds up planning.',
    coachGoal: 'Teach vocabulary as pattern recognition, not memorization.',
    makrukTerms: ['Ruea loi', 'Bia phuk', 'Bia sung', 'Bia ngai'],
    previewScene: scene('terminology-preview', terminologyBoard, 'white', 'One position can carry several Thai labels at once.', {
      highlights: [
        highlight('d4', 'focus'),
        highlight('e4', 'focus'),
        highlight('e6', 'warning'),
      ],
    }),
    coachQuestion: 'Which Thai terms would help you describe this board in one sentence?',
    feedbackFocus: 'Naming the shape correctly makes the plan easier to find.',
  },
  {
    id: 'choose-plan-from-thai-terms',
    trackId: 'thai-terms',
    order: 18,
    title: 'Choose A Plan From Thai Terms',
    shortTitle: 'Plan From Terms',
    level: 'advanced',
    coreIdea: 'Once the learner can name Makruk shapes, they can choose plans from them more quickly.',
    coachGoal: 'Turn vocabulary into decision-making speed.',
    makrukTerms: ['Ma phuk', 'Bia sung', 'Rua', 'target lane'],
    previewScene: scene('review-preview', reviewBoard, 'white', 'The review lesson asks the player to plan from named shapes.', {
      highlights: [
        highlight('d2', 'focus'),
        highlight('f3', 'focus'),
        highlight('e4', 'support'),
        highlight('d6', 'target'),
      ],
    }),
    coachQuestion: 'Which named pattern on this board tells you the most about White’s next plan?',
    feedbackFocus: 'Makruk vocabulary should become a shortcut to practical plans.',
  },
];

export const MAKRUK_NATIVE_LESSON_TRACKS: NativeLessonTrack[] = [
  {
    id: 'foundations',
    order: 1,
    title: 'Foundations Of Makruk Shape',
    promise: 'Learn why Makruk pieces, promotion, and pawn starts create a different early game.',
    lessons: FOUNDATIONS_LESSONS,
  },
  {
    id: 'opening-formations',
    order: 2,
    title: 'Opening Formations',
    promise: 'Study named Makruk opening families as shapes you can recognize on sight.',
    lessons: OPENING_FORMATION_LESSONS,
  },
  {
    id: 'middlegame-pressure',
    order: 3,
    title: 'Middlegame Pressure',
    promise: 'Practice the slower, positional pressure that defines many Makruk middlegames.',
    lessons: MIDDLEGAME_PRESSURE_LESSONS,
  },
  {
    id: 'endgame-chasing',
    order: 4,
    title: 'Endgame Chasing',
    promise: 'Learn to chase with route control, correct corners, and count awareness.',
    lessons: ENDGAME_CHASING_LESSONS,
  },
  {
    id: 'thai-terms',
    order: 5,
    title: 'Thai Terms In Action',
    promise: 'Turn Thai Makruk vocabulary into fast board understanding.',
    lessons: THAI_TERM_LESSONS,
  },
];

export const MAKRUK_NATIVE_LESSON_OUTLINES = MAKRUK_NATIVE_LESSON_TRACKS
  .flatMap(track => track.lessons)
  .sort((left, right) => left.order - right.order);

const firstHighPawnIntro = scene(
  'first-high-pawn-intro',
  createInitialBoard(),
  'white',
  'The e-pawn is one step away from becoming a named Makruk landmark.',
  {
    highlights: [
      highlight('e3', 'focus'),
      highlight('e4', 'target'),
      highlight('e1', 'support'),
    ],
    arrows: [arrow('e3', 'e4', 'move')],
    labels: [label('e1', 'Met')],
  },
);

const firstHighPawnAfterPush = scene(
  'first-high-pawn-after-push',
  highPawnBoard,
  'white',
  'The high pawn is on the board. The next question is support.',
  {
    highlights: [
      highlight('e4', 'focus'),
      highlight('b1', 'support'),
      highlight('d2', 'target'),
    ],
    arrows: [arrow('b1', 'd2', 'plan')],
  },
);

const firstHighPawnAfterSupport = scene(
  'first-high-pawn-after-support',
  board(
    ['a1', 'R', 'white'],
    ['d2', 'N', 'white'],
    ['c1', 'S', 'white'],
    ['d1', 'K', 'white'],
    ['e1', 'M', 'white'],
    ['f1', 'S', 'white'],
    ['g1', 'N', 'white'],
    ['h1', 'R', 'white'],
    ['a3', 'P', 'white'],
    ['b3', 'P', 'white'],
    ['c3', 'P', 'white'],
    ['d3', 'P', 'white'],
    ['e4', 'P', 'white'],
    ['f3', 'P', 'white'],
    ['g3', 'P', 'white'],
    ['h3', 'P', 'white'],
    ['a8', 'R', 'black'],
    ['b8', 'N', 'black'],
    ['c8', 'S', 'black'],
    ['d8', 'M', 'black'],
    ['e8', 'K', 'black'],
    ['f8', 'S', 'black'],
    ['g8', 'N', 'black'],
    ['h8', 'R', 'black'],
    ['a6', 'P', 'black'],
    ['b6', 'P', 'black'],
    ['c6', 'P', 'black'],
    ['d6', 'P', 'black'],
    ['e6', 'P', 'black'],
    ['f6', 'P', 'black'],
    ['g6', 'P', 'black'],
    ['h6', 'P', 'black'],
  ),
  'white',
  'Now the high pawn is supported and the shape is ready to grow.',
  {
    highlights: [
      highlight('d2', 'focus'),
      highlight('e4', 'support'),
      highlight('f3', 'target'),
    ],
    labels: [
      label('d2', 'Ma support'),
      label('e4', 'Bia sung na Met'),
    ],
  },
);

export const FIRST_HIGH_PAWN_INTERACTIVE_LESSON: NativeInteractiveLesson = {
  ...FOUNDATIONS_LESSONS.find(lesson => lesson.id === 'first-bia-sung-na-met')!,
  scenes: [
    firstHighPawnIntro,
    firstHighPawnAfterPush,
    firstHighPawnAfterSupport,
  ],
  steps: [
    {
      id: 'coach-1',
      kind: 'coach',
      sceneId: 'first-high-pawn-intro',
      title: 'Meet the shape',
      body: 'In Makruk, one pawn step in front of the Met creates a named structure. We do not treat it as a generic opening principle. We learn it as a board landmark: Bia Sung Na Met.',
    },
    {
      id: 'choice-1',
      kind: 'choice',
      sceneId: 'first-high-pawn-intro',
      title: 'Name the structure',
      body: 'Pick the move that creates the Thai structure this lesson is about.',
      prompt: 'Which move creates the first Bia Sung Na Met?',
      options: [
        {
          id: 'e3-e4',
          label: 'e3-e4',
          correct: true,
          feedback: 'Correct. e3-e4 creates the high pawn in front of the Met and gives the shape its Makruk identity.',
        },
        {
          id: 'd3-d4',
          label: 'd3-d4',
          correct: false,
          feedback: 'd3-d4 is a sensible center move, but it does not create the named structure in front of the Met.',
        },
        {
          id: 'g1-f3',
          label: 'g1-f3',
          correct: false,
          feedback: 'Developing the Ma is useful later, but the lesson is asking for the Thai pawn landmark first.',
        },
      ],
    },
    {
      id: 'coach-2',
      kind: 'coach',
      sceneId: 'first-high-pawn-after-push',
      title: 'Do not leave it loose',
      body: 'A high pawn is good only when the rest of the shape grows around it. In Makruk, structure and support matter more than a quick claim with no backup.',
    },
    {
      id: 'move-1',
      kind: 'move',
      sceneId: 'first-high-pawn-after-push',
      title: 'Support the high pawn',
      body: 'Play the support move that keeps the high pawn healthy and grows the shell.',
      prompt: 'Which move should White play now?',
      expectedMove: move('b1', 'd2'),
      successFeedback: 'Exactly. Nd2 supports e4 and keeps the shape coherent instead of leaving the high pawn to fend for itself.',
      wrongMoveFeedback: 'Look for the move that directly supports e4. The point is not speed, it is shape health.',
    },
    {
      id: 'choice-2',
      kind: 'choice',
      sceneId: 'first-high-pawn-after-support',
      title: 'Read the result',
      body: 'Now choose the best description of what improved.',
      prompt: 'What changed after Nd2?',
      options: [
        {
          id: 'supported-shape',
          label: 'The high pawn is supported and White can build around it.',
          correct: true,
          feedback: 'Yes. The real gain is a supported Makruk shell, not a random extra move.',
        },
        {
          id: 'instant-attack',
          label: 'White has a forced attack on the black king.',
          correct: false,
          feedback: 'Not yet. Makruk often grows by pressure and shape before a direct attack appears.',
        },
        {
          id: 'rook-activity',
          label: 'The rook became the main active piece.',
          correct: false,
          feedback: 'The lesson is about the Ma and the high pawn structure, not immediate rook play.',
        },
      ],
    },
    {
      id: 'wrap-1',
      kind: 'wrap',
      sceneId: 'first-high-pawn-after-support',
      title: 'Pattern locked in',
      body: 'You have built a Makruk-native opening lesson: create the Bia Sung Na Met, then support it before chasing more space. That is the pattern to remember.',
    },
  ],
};
