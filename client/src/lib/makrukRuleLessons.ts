import type { Board, Piece, PieceColor, PieceType, Position } from '@shared/types';

type Placement = [square: string, type: PieceType, color: PieceColor];

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

export interface MakrukRuleLessonScene {
  id: string;
  board: Board;
  toMove: PieceColor;
  caption: string;
}

export interface MakrukRuleLessonStep {
  id: string;
  kind: 'coach' | 'choice' | 'move' | 'wrap';
  sceneId: string;
  title: string;
  body: string;
  prompt?: string;
  options?: Array<{
    id: string;
    label: string;
    correct: boolean;
    feedback: string;
  }>;
  expectedMove?: {
    from: Position;
    to: Position;
  };
  successFeedback?: string;
  wrongFeedback?: string;
}

export interface MakrukRuleLesson {
  id: string;
  title: string;
  objective: string;
  rulesCovered: string[];
  scenes: MakrukRuleLessonScene[];
  steps: MakrukRuleLessonStep[];
}

export interface MakrukRuleLessonTrack {
  id: string;
  title: string;
  lessonIds: string[];
  promise: string;
}

const sakMakIntro = board(
  ['a1', 'K', 'white'],
  ['b1', 'R', 'white'],
  ['h8', 'K', 'black'],
);

const sakMakCrowded = board(
  ['a1', 'K', 'white'],
  ['b1', 'R', 'white'],
  ['c1', 'R', 'white'],
  ['d1', 'N', 'white'],
  ['e1', 'N', 'white'],
  ['f1', 'S', 'white'],
  ['g1', 'S', 'white'],
  ['h1', 'M', 'white'],
  ['a2', 'PM', 'white'],
  ['h8', 'K', 'black'],
);

const sakKradanBoard = board(
  ['c2', 'K', 'white'],
  ['d5', 'R', 'white'],
  ['g7', 'K', 'black'],
  ['f6', 'PM', 'black'],
);

const timeoutBoard = board(
  ['c2', 'K', 'white'],
  ['d4', 'N', 'white'],
  ['e3', 'M', 'white'],
  ['g7', 'K', 'black'],
);

export const MAKRUK_RULE_LESSON_TRACKS: MakrukRuleLessonTrack[] = [
  {
    id: 'movement-and-results',
    title: 'Movement And Results',
    lessonIds: [
      'piece-movement-is-makruk-specific',
      'how-makruk-games-end',
    ],
    promise: 'Learn the movement model and why Makruk endings are ruled by counts, not western defaults.',
  },
  {
    id: 'counting-decisions',
    title: 'Counting Decisions',
    lessonIds: [
      'when-sak-mak-starts',
      'when-to-claim-sak-kradan',
      'timeout-needs-winning-material',
    ],
    promise: 'Turn Sak Mak and Sak Kradan into practical decisions you can make over the board.',
  },
];

export const MAKRUK_RULE_LESSONS: MakrukRuleLesson[] = [
  {
    id: 'piece-movement-is-makruk-specific',
    title: 'Piece Movement Is Makruk-Specific',
    objective: 'Teach the player to stop assuming western queen-and-bishop movement.',
    rulesCovered: ['Met moves one diagonal square', 'Khon moves diagonally or forward one square', 'Bia promotes to Bia Ngai on the sixth rank'],
    scenes: [
      {
        id: 'movement-1',
        board: board(
          ['d2', 'K', 'white'],
          ['e3', 'M', 'white'],
          ['c3', 'S', 'white'],
          ['g7', 'K', 'black'],
        ),
        toMove: 'white',
        caption: 'Met and Khon are short-range pieces, so Makruk plans grow by support.',
      },
    ],
    steps: [
      {
        id: 'movement-coach',
        kind: 'coach',
        sceneId: 'movement-1',
        title: 'Reset the instinct',
        body: 'In Makruk, the Met does not rule the board like a western queen. The Khon is also short-range. That changes both tactics and lessons.',
      },
      {
        id: 'movement-choice',
        kind: 'choice',
        sceneId: 'movement-1',
        title: 'Read the rule',
        body: 'Pick the true statement.',
        prompt: 'Which statement is correct?',
        options: [
          {
            id: 'met-short',
            label: 'The Met moves one square diagonally.',
            correct: true,
            feedback: 'Correct. Makruk piece logic starts by shrinking the Met to one diagonal step.',
          },
          {
            id: 'met-queen',
            label: 'The Met moves like a western queen.',
            correct: false,
            feedback: 'That is the exact assumption this lesson wants to remove.',
          },
          {
            id: 'khon-bishop',
            label: 'The Khon slides along diagonals without limit.',
            correct: false,
            feedback: 'No. The Khon is short-range too: one diagonal square or one square forward.',
          },
        ],
      },
      {
        id: 'movement-wrap',
        kind: 'wrap',
        sceneId: 'movement-1',
        title: 'Rule locked in',
        body: 'Makruk movement must be learned on its own terms. That is what keeps the rest of the rule engine honest.',
      },
    ],
  },
  {
    id: 'how-makruk-games-end',
    title: 'How Makruk Games End',
    objective: 'Show the player that Makruk endings rely on checkmate, timeout material, stalemate, agreement, and counting.',
    rulesCovered: ['Checkmate', 'Timeout with sufficient mating material', 'Stalemate', 'Agreement', 'Counting'],
    scenes: [
      {
        id: 'results-1',
        board: timeoutBoard,
        toMove: 'white',
        caption: 'The result is not only about the board. It also depends on the rule state.',
      },
    ],
    steps: [
      {
        id: 'results-coach',
        kind: 'coach',
        sceneId: 'results-1',
        title: 'Result logic',
        body: 'Makruk still ends by checkmate, but the official draw and timeout rules matter much earlier than many players expect.',
      },
      {
        id: 'results-choice',
        kind: 'choice',
        sceneId: 'results-1',
        title: 'Spot the Makruk rule',
        body: 'Choose the ending rule that replaces western shortcuts.',
        prompt: 'Which rule should your system rely on instead of a 50-move rule?',
        options: [
          {
            id: 'counting',
            label: 'Counting rules such as Sak Kradan and Sak Mak',
            correct: true,
            feedback: 'Exactly. Makruk-native result logic centers on counting, not western 50-move assumptions.',
          },
          {
            id: 'fifty-move',
            label: 'The 50-move rule',
            correct: false,
            feedback: 'That is a western assumption, not the primary Makruk mechanism.',
          },
          {
            id: 'generic-repetition',
            label: 'Generic chess repetition logic',
            correct: false,
            feedback: 'The rule engine should stay Makruk-native and reason from Makruk draw rules first.',
          },
        ],
      },
      {
        id: 'results-wrap',
        kind: 'wrap',
        sceneId: 'results-1',
        title: 'Result map',
        body: 'A Makruk result engine needs piece movement, mate detection, timeout-material checks, stalemate, and counting support together.',
      },
    ],
  },
  {
    id: 'when-sak-mak-starts',
    title: 'When Sak Mak Starts Automatically',
    objective: 'Teach that Sak Mak begins on its own when there are no unpromoted pawns and one side is bare king.',
    rulesCovered: ['No unpromoted pawns', 'One side bare king', 'Automatic Sak Mak start', 'Immediate draw if start count is already too high'],
    scenes: [
      {
        id: 'sak-mak-1',
        board: sakMakIntro,
        toMove: 'black',
        caption: 'No unpromoted pawns remain, and Black has only the Khun left.',
      },
      {
        id: 'sak-mak-2',
        board: sakMakCrowded,
        toMove: 'black',
        caption: 'Too many pieces can turn Sak Mak into an immediate draw.',
      },
    ],
    steps: [
      {
        id: 'sak-mak-coach',
        kind: 'coach',
        sceneId: 'sak-mak-1',
        title: 'It starts on its own',
        body: 'Sak Mak does not need to be declared. Once there are no unpromoted pawns and one side has only the Khun left, the count begins automatically.',
      },
      {
        id: 'sak-mak-choice',
        kind: 'choice',
        sceneId: 'sak-mak-1',
        title: 'Decide the trigger',
        body: 'Choose the correct trigger.',
        prompt: 'What starts Sak Mak here?',
        options: [
          {
            id: 'automatic',
            label: 'The rule starts automatically because Black is bare king and no Bia remain unpromoted.',
            correct: true,
            feedback: 'Correct. Sak Mak is automatic once those two conditions are true.',
          },
          {
            id: 'manual-request',
            label: 'Black must request the count first.',
            correct: false,
            feedback: 'That is Sak Kradan logic, not Sak Mak.',
          },
          {
            id: 'no-count',
            label: 'No count starts until only two kings remain.',
            correct: false,
            feedback: 'The count starts much earlier than that in Makruk.',
          },
        ],
      },
      {
        id: 'sak-mak-crowded',
        kind: 'choice',
        sceneId: 'sak-mak-2',
        title: 'Read the crowded case',
        body: 'Now the count is smaller because White has two Rua.',
        prompt: 'What is the correct evaluation of this crowded two-Rua position?',
        options: [
          {
            id: 'immediate-draw',
            label: 'Immediate draw, because the Sak Mak start count already exceeds the two-Rua limit.',
            correct: true,
            feedback: 'Exactly. Makruk counting can erase a huge material edge immediately if the entry count is already too high.',
          },
          {
            id: 'white-winning',
            label: 'White is simply winning because White has more material.',
            correct: false,
            feedback: 'Material alone is not enough in Makruk. You must respect the count.',
          },
          {
            id: 'black-must-request',
            label: 'Black must request the draw first.',
            correct: false,
            feedback: 'Not for Sak Mak. It starts automatically.',
          },
        ],
      },
      {
        id: 'sak-mak-wrap',
        kind: 'wrap',
        sceneId: 'sak-mak-2',
        title: 'Sak Mak principle',
        body: 'The system lesson is simple: Sak Mak is automatic, its limit depends on the chasing material, and sometimes the draw is immediate.',
      },
    ],
  },
  {
    id: 'when-to-claim-sak-kradan',
    title: 'When To Claim Sak Kradan',
    objective: 'Teach that Sak Kradan is a player decision for the weaker side once no unpromoted pawns remain.',
    rulesCovered: ['No unpromoted pawns', 'Materially weaker side claims the count', 'Count only the escaping side moves'],
    scenes: [
      {
        id: 'sak-kradan-1',
        board: sakKradanBoard,
        toMove: 'black',
        caption: 'Black is the weaker side and can choose the counting resource.',
      },
    ],
    steps: [
      {
        id: 'sak-kradan-coach',
        kind: 'coach',
        sceneId: 'sak-kradan-1',
        title: 'This one is declared',
        body: 'Unlike Sak Mak, Sak Kradan belongs to the weaker side as a conscious draw resource when agreement fails.',
      },
      {
        id: 'sak-kradan-choice',
        kind: 'choice',
        sceneId: 'sak-kradan-1',
        title: 'Choose the action',
        body: 'Pick the correct Makruk decision.',
        prompt: 'What should Black do here under the official rules?',
        options: [
          {
            id: 'claim',
            label: 'Declare Sak Kradan',
            correct: true,
            feedback: 'Correct. This is the Makruk-native draw resource for the weaker side.',
          },
          {
            id: 'wait',
            label: 'Play a waiting move and hope for a repetition draw',
            correct: false,
            feedback: 'The system should teach the official counting action here, not a generic repetition shortcut.',
          },
          {
            id: 'sak-mak',
            label: 'Wait for Sak Mak to start automatically',
            correct: false,
            feedback: 'Sak Mak needs a bare king. Black still has more than just the Khun.',
          },
        ],
      },
      {
        id: 'sak-kradan-wrap',
        kind: 'wrap',
        sceneId: 'sak-kradan-1',
        title: 'Sak Kradan principle',
        body: 'If no unpromoted pawns remain and you are the weaker side, Sak Kradan is a decision tool you should recognize instantly.',
      },
    ],
  },
  {
    id: 'timeout-needs-winning-material',
    title: 'Timeout Needs Winning Material',
    objective: 'Teach that flagging the opponent only wins if the side with time left still has an officially winning material set.',
    rulesCovered: ['Timeout win with sufficient material', 'Timeout draw with insufficient material'],
    scenes: [
      {
        id: 'timeout-1',
        board: timeoutBoard,
        toMove: 'white',
        caption: 'White has Khun, Ma, and Met. That matters if Black flags.',
      },
    ],
    steps: [
      {
        id: 'timeout-coach',
        kind: 'coach',
        sceneId: 'timeout-1',
        title: 'Clock logic is still Makruk logic',
        body: 'A timeout is not automatically a win. The side with time left must still own one of the official winning material groups.',
      },
      {
        id: 'timeout-choice',
        kind: 'choice',
        sceneId: 'timeout-1',
        title: 'Judge the timeout',
        body: 'Black’s clock hits zero in this position.',
        prompt: 'What result should the engine return?',
        options: [
          {
            id: 'white-wins',
            label: 'White wins on time because Khun + Ma + Met is an official winning set.',
            correct: true,
            feedback: 'Correct. The timeout rule checks the surviving material set, not only the clock.',
          },
          {
            id: 'automatic-draw',
            label: 'Automatic draw because checkmate is not on the board yet.',
            correct: false,
            feedback: 'Timeout resolution in Makruk still depends on material potential, not immediate mate on the current move.',
          },
          {
            id: 'western-timeout',
            label: 'Automatic win because any timeout is always a win.',
            correct: false,
            feedback: 'That would be too generic. Makruk uses a stricter timeout-material test.',
          },
        ],
      },
      {
        id: 'timeout-wrap',
        kind: 'wrap',
        sceneId: 'timeout-1',
        title: 'Timeout principle',
        body: 'The engine should resolve time forfeits through official Makruk material groups, not through chess defaults.',
      },
    ],
  },
];

export const EXAMPLE_MAKRUK_RULE_LESSON = MAKRUK_RULE_LESSONS.find(
  lesson => lesson.id === 'when-sak-mak-starts',
)!;
