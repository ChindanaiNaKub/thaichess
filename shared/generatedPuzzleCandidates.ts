import type { PuzzleCandidateDraft } from './puzzleImportQueue';

export const GENERATED_PUZZLE_CANDIDATE_DRAFTS: PuzzleCandidateDraft[] = [
  {
    "id": 9000,
    "title": "Real-Game Discovery (selfplay-0001 @ ply 14)",
    "description": "Win material in 2. Find the discovered attack that reveals the winning line.",
    "explanation": "A quiet move opens a hidden line of attack, forcing the defense to react while the knight remains loose.",
    "source": "Offline self-play medium vs medium (ply 14)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0001",
    "sourcePly": 14,
    "theme": "Discovery",
    "motif": "Real-game discovery candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "discovery",
      "real-game",
      "middlegame",
      "forcing-sequence"
    ],
    "difficultyScore": 1830,
    "difficulty": "advanced",
    "toMove": "black",
    "board": [
      [
        null,
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "N",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        {
          "type": "K",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 0
        },
        "to": {
          "row": 1,
          "col": 0
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 7,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      }
    ]
  },
  {
    "id": 9001,
    "title": "Real-Game Promotion (selfplay-0001 @ ply 20)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 20)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0001",
    "sourcePly": 20,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame"
    ],
    "difficultyScore": 1300,
    "difficulty": "beginner",
    "toMove": "black",
    "board": [
      [
        null,
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "black"
        },
        null
      ],
      [
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        null,
        {
          "type": "M",
          "color": "black"
        },
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        {
          "type": "K",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 0
        },
        "to": {
          "row": 1,
          "col": 0
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 7,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 4
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 3,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 6
        }
      }
    ]
  },
  {
    "id": 9002,
    "title": "Real-Game Fork (selfplay-0001 @ ply 56)",
    "description": "Win material in 1. Start with the fork that attacks the king and the khon.",
    "explanation": "The first move creates a double attack, and the follow-up wins the khon cleanly.",
    "source": "Offline self-play medium vs medium (ply 56)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0001",
    "sourcePly": 56,
    "theme": "Fork",
    "motif": "Real-game fork candidate: wins khon",
    "tags": [
      "tactic",
      "material-gain",
      "fork",
      "real-game"
    ],
    "difficultyScore": 1110,
    "difficulty": "intermediate",
    "toMove": "black",
    "board": [
      [
        null,
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        {
          "type": "N",
          "color": "white"
        },
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        null,
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 0
        },
        "to": {
          "row": 1,
          "col": 0
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 7,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 6
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 6,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 7,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      }
    ]
  },
  {
    "id": 9003,
    "title": "Real-Game Fork (selfplay-0001 @ ply 62)",
    "description": "Win material in 2. Start with the fork that attacks the king and the khon.",
    "explanation": "The first move creates a double attack, and the follow-up wins the khon cleanly.",
    "source": "Offline self-play medium vs medium (ply 62)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0001",
    "sourcePly": 62,
    "theme": "Fork",
    "motif": "Real-game fork candidate: wins khon",
    "tags": [
      "quiet-first-move",
      "tactic",
      "material-gain",
      "fork",
      "real-game",
      "forcing-sequence"
    ],
    "difficultyScore": 1538,
    "difficulty": "advanced",
    "toMove": "black",
    "board": [
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "N",
          "color": "black"
        },
        null,
        {
          "type": "K",
          "color": "white"
        },
        null,
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "N",
          "color": "white"
        },
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        null,
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 0
        },
        "to": {
          "row": 1,
          "col": 0
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 7,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 6
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 6,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 7,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 5
        },
        "to": {
          "row": 1,
          "col": 4
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 4
        }
      }
    ]
  },
  {
    "id": 9004,
    "title": "Real-Game Fork (selfplay-0002 @ ply 28)",
    "description": "Win material in 1. Start with the fork that attacks the king and the khon.",
    "explanation": "The first move creates a double attack, and the follow-up wins the khon cleanly.",
    "source": "Offline self-play medium vs medium (ply 28)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 28,
    "theme": "Fork",
    "motif": "Real-game fork candidate: wins khon",
    "tags": [
      "tactic",
      "material-gain",
      "fork",
      "real-game",
      "middlegame"
    ],
    "difficultyScore": 1288,
    "difficulty": "intermediate",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      }
    ]
  },
  {
    "id": 9005,
    "title": "Real-Game Trapped Piece (selfplay-0002 @ ply 29)",
    "description": "Win material in 2. Start with the move that traps the piece before collecting it.",
    "explanation": "The first move cuts off the escape squares. Black can shuffle, but the trapped piece still falls on the next move.",
    "source": "Offline self-play medium vs medium (ply 29)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 29,
    "theme": "TrappedPiece",
    "motif": "Real-game trapped piece candidate",
    "tags": [
      "tactic",
      "material-gain",
      "trap",
      "real-game",
      "middlegame",
      "forcing-sequence"
    ],
    "difficultyScore": 1782,
    "difficulty": "advanced",
    "toMove": "white",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "N",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        null,
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      }
    ]
  },
  {
    "id": 9006,
    "title": "Real-Game Pin (selfplay-0002 @ ply 44)",
    "description": "Win material in 1. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 44)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 44,
    "theme": "Pin",
    "motif": "Real-game pin candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "pin",
      "real-game"
    ],
    "difficultyScore": 1030,
    "difficulty": "intermediate",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "N",
          "color": "white"
        },
        null,
        null,
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "N",
          "color": "white"
        }
      ],
      [
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        {
          "type": "S",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 7
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 7,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      }
    ]
  },
  {
    "id": 9007,
    "title": "Real-Game Pin (selfplay-0002 @ ply 44)",
    "description": "Win material in 2. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 44)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 44,
    "theme": "Pin",
    "motif": "Real-game pin candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "pin",
      "real-game",
      "forcing-sequence"
    ],
    "difficultyScore": 1410,
    "difficulty": "advanced",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "N",
          "color": "white"
        },
        null,
        null,
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "N",
          "color": "white"
        }
      ],
      [
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        {
          "type": "S",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 7
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 7,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 7
        }
      }
    ]
  },
  {
    "id": 9008,
    "title": "Real-Game Double Attack (selfplay-0002 @ ply 50)",
    "description": "Win material in 1. Start with the double attack that overloads the defense.",
    "explanation": "The first move creates two threats at once, so the defender cannot save everything and the knight falls.",
    "source": "Offline self-play medium vs medium (ply 50)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 50,
    "theme": "DoubleAttack",
    "motif": "Real-game double attack candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "double-attack",
      "real-game"
    ],
    "difficultyScore": 1080,
    "difficulty": "intermediate",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        {
          "type": "S",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        null,
        {
          "type": "N",
          "color": "white"
        },
        null,
        {
          "type": "R",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "R",
          "color": "white"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        {
          "type": "S",
          "color": "black"
        },
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        null,
        null
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 7,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 7
        }
      },
      {
        "from": {
          "row": 1,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 5
        }
      }
    ]
  },
  {
    "id": 9009,
    "title": "Real-Game Double Attack (selfplay-0002 @ ply 52)",
    "description": "Win material in 1. Start with the double attack that overloads the defense.",
    "explanation": "The first move creates two threats at once, so the defender cannot save everything and the met falls.",
    "source": "Offline self-play medium vs medium (ply 52)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 52,
    "theme": "DoubleAttack",
    "motif": "Real-game double attack candidate: wins met",
    "tags": [
      "tactic",
      "material-gain",
      "double-attack",
      "real-game"
    ],
    "difficultyScore": 1074,
    "difficulty": "intermediate",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        {
          "type": "S",
          "color": "white"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        null,
        {
          "type": "R",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "R",
          "color": "white"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        {
          "type": "S",
          "color": "black"
        },
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        null,
        null
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 7,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 7
        }
      },
      {
        "from": {
          "row": 1,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 5
        },
        "to": {
          "row": 1,
          "col": 4
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 2
        }
      }
    ]
  },
  {
    "id": 9010,
    "title": "Real-Game Promotion (selfplay-0002 @ ply 71)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 71)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 71,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game"
    ],
    "difficultyScore": 906,
    "difficulty": "beginner",
    "toMove": "white",
    "board": [
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        {
          "type": "K",
          "color": "white"
        },
        null,
        null,
        null,
        null
      ],
      [
        null,
        {
          "type": "S",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 7
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 0,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 7,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 7
        }
      },
      {
        "from": {
          "row": 1,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 5
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 1,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 6,
          "col": 5
        },
        "to": {
          "row": 5,
          "col": 6
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 7,
          "col": 0
        },
        "to": {
          "row": 2,
          "col": 0
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 6,
          "col": 6
        }
      },
      {
        "from": {
          "row": 0,
          "col": 0
        },
        "to": {
          "row": 2,
          "col": 0
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 7,
          "col": 5
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 5
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 3
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 3
        }
      }
    ]
  },
  {
    "id": 9011,
    "title": "Real-Game Trapped Piece (selfplay-0003 @ ply 24)",
    "description": "Win material in 2. Start with the move that traps the piece before collecting it.",
    "explanation": "The first move cuts off the escape squares. Black can shuffle, but the trapped piece still falls on the next move.",
    "source": "Offline self-play medium vs medium (ply 24)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0003",
    "sourcePly": 24,
    "theme": "TrappedPiece",
    "motif": "Real-game trapped piece candidate",
    "tags": [
      "tactic",
      "material-gain",
      "trap",
      "real-game",
      "middlegame",
      "forcing-sequence"
    ],
    "difficultyScore": 1802,
    "difficulty": "advanced",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        {
          "type": "N",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        null
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 7,
          "col": 7
        },
        "to": {
          "row": 6,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 5
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 7
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 6
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      }
    ]
  },
  {
    "id": 9012,
    "title": "Real-Game Promotion (selfplay-0003 @ ply 30)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 30)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0003",
    "sourcePly": 30,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame"
    ],
    "difficultyScore": 1240,
    "difficulty": "beginner",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        {
          "type": "N",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "N",
          "color": "black"
        },
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        null
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 7,
          "col": 7
        },
        "to": {
          "row": 6,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 5
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 7
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 4
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 2
        }
      }
    ]
  },
  {
    "id": 9013,
    "title": "Real-Game Double Attack (selfplay-0003 @ ply 32)",
    "description": "Win material in 1. Start with the double attack that overloads the defense.",
    "explanation": "The first move creates two threats at once, so the defender cannot save everything and the knight falls.",
    "source": "Offline self-play medium vs medium (ply 32)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0003",
    "sourcePly": 32,
    "theme": "DoubleAttack",
    "motif": "Real-game double attack candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "double-attack",
      "real-game",
      "middlegame"
    ],
    "difficultyScore": 1242,
    "difficulty": "intermediate",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        null,
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        {
          "type": "N",
          "color": "white"
        },
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        {
          "type": "PM",
          "color": "black"
        },
        null,
        null,
        {
          "type": "N",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "N",
          "color": "black"
        },
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        null,
        null
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 7,
          "col": 7
        },
        "to": {
          "row": 6,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 5
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 7
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 1,
          "col": 3
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      }
    ]
  },
  {
    "id": 9014,
    "title": "Real-Game Pin (selfplay-0004 @ ply 18)",
    "description": "Win material in 1. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 18)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 18,
    "theme": "Pin",
    "motif": "Real-game pin candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "pin",
      "real-game",
      "middlegame"
    ],
    "difficultyScore": 1240,
    "difficulty": "intermediate",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 0,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 0
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 7,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      }
    ]
  },
  {
    "id": 9015,
    "title": "Real-Game Pin (selfplay-0004 @ ply 18)",
    "description": "Win material in 2. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 18)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 18,
    "theme": "Pin",
    "motif": "Real-game pin candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "pin",
      "real-game",
      "middlegame",
      "forcing-sequence"
    ],
    "difficultyScore": 1740,
    "difficulty": "advanced",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 0,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 0
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 7,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      }
    ]
  },
  {
    "id": 9016,
    "title": "Real-Game Promotion (selfplay-0004 @ ply 22)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 22)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 22,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame"
    ],
    "difficultyScore": 1240,
    "difficulty": "beginner",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null
      ],
      [
        null,
        {
          "type": "PM",
          "color": "white"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 0,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 7,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 6
        }
      }
    ]
  },
  {
    "id": 9017,
    "title": "Real-Game Discovery (selfplay-0004 @ ply 22)",
    "description": "Win material in 2. Find the discovered attack that reveals the winning line.",
    "explanation": "A quiet move opens a hidden line of attack, forcing the defense to react while the pawn remains loose.",
    "source": "Offline self-play medium vs medium (ply 22)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 22,
    "theme": "Discovery",
    "motif": "Real-game discovery candidate: wins pawn",
    "tags": [
      "tactic",
      "material-gain",
      "discovery",
      "real-game",
      "middlegame",
      "forcing-sequence"
    ],
    "difficultyScore": 1830,
    "difficulty": "advanced",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null
      ],
      [
        null,
        {
          "type": "PM",
          "color": "white"
        },
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 0,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 7,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 6
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      }
    ]
  },
  {
    "id": 9018,
    "title": "Real-Game Trapped Piece (selfplay-0004 @ ply 37)",
    "description": "Win material in 2. Start with the move that traps the piece before collecting it.",
    "explanation": "The first move cuts off the escape squares. Black can shuffle, but the trapped piece still falls on the next move.",
    "source": "Offline self-play medium vs medium (ply 37)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 37,
    "theme": "TrappedPiece",
    "motif": "Real-game trapped piece candidate",
    "tags": [
      "tactic",
      "material-gain",
      "trap",
      "real-game",
      "middlegame",
      "forcing-sequence"
    ],
    "difficultyScore": 1780,
    "difficulty": "advanced",
    "toMove": "white",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "PM",
          "color": "black"
        },
        {
          "type": "N",
          "color": "white"
        },
        null,
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "white"
        },
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "PM",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null,
        null
      ],
      [
        null,
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 0,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 7,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 6
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      }
    ]
  },
  {
    "id": 9019,
    "title": "Real-Game Promotion (selfplay-0004 @ ply 45)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 45)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 45,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame"
    ],
    "difficultyScore": 1232,
    "difficulty": "beginner",
    "toMove": "white",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "PM",
          "color": "black"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null
      ],
      [
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        {
          "type": "PM",
          "color": "white"
        },
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null
      ],
      [
        null,
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 0,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 7,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 6
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 5
        },
        "to": {
          "row": 6,
          "col": 6
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 1
        }
      }
    ]
  },
  {
    "id": 9020,
    "title": "Real-Game Pin (selfplay-0004 @ ply 54)",
    "description": "Win material in 1. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 54)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 54,
    "theme": "Pin",
    "motif": "Real-game pin candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "pin",
      "real-game"
    ],
    "difficultyScore": 1034,
    "difficulty": "intermediate",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        {
          "type": "N",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "P",
          "color": "white"
        },
        null
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "PM",
          "color": "white"
        },
        null,
        null,
        null
      ],
      [
        null,
        {
          "type": "PM",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        {
          "type": "K",
          "color": "black"
        },
        null
      ],
      [
        null,
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 0,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 7,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 6
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 5
        },
        "to": {
          "row": 6,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 3
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 3,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 3
        }
      }
    ]
  },
  {
    "id": 9021,
    "title": "Real-Game Promotion (selfplay-0004 @ ply 65)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 65)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 65,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game"
    ],
    "difficultyScore": 1068,
    "difficulty": "beginner",
    "toMove": "white",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        {
          "type": "K",
          "color": "white"
        },
        null,
        {
          "type": "M",
          "color": "white"
        },
        {
          "type": "S",
          "color": "white"
        },
        null,
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        {
          "type": "PM",
          "color": "white"
        },
        null,
        null,
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        null
      ],
      [
        null,
        {
          "type": "PM",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "K",
          "color": "black"
        },
        null
      ],
      [
        null,
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "M",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 0,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 3
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 6,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 7,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 7
        },
        "to": {
          "row": 3,
          "col": 7
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 7
        },
        "to": {
          "row": 2,
          "col": 6
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 5,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 5
        },
        "to": {
          "row": 6,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 5,
          "col": 6
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 1
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 0,
          "col": 2
        }
      },
      {
        "from": {
          "row": 1,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 2
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 4,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 6
        }
      }
    ]
  },
  {
    "id": 9022,
    "title": "Real-Game Promotion (selfplay-0005 @ ply 46)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 46)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0005",
    "sourcePly": 46,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame"
    ],
    "difficultyScore": 1230,
    "difficulty": "beginner",
    "toMove": "black",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        {
          "type": "S",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "S",
          "color": "black"
        },
        null
      ],
      [
        {
          "type": "R",
          "color": "black"
        },
        null,
        null,
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        null,
        {
          "type": "N",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 7
        }
      },
      {
        "from": {
          "row": 7,
          "col": 5
        },
        "to": {
          "row": 6,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 5
        },
        "to": {
          "row": 1,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 1,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 3
        }
      }
    ]
  },
  {
    "id": 9023,
    "title": "Real-Game Hanging Piece (selfplay-0005 @ ply 55)",
    "description": "Win material in 2. Start by taking the loose knight.",
    "explanation": "The target is insufficiently defended, so the forcing line wins the knight cleanly.",
    "source": "Offline self-play medium vs medium (ply 55)",
    "origin": "seed-game",
    "sourceGameId": "selfplay-0005",
    "sourcePly": 55,
    "theme": "HangingPiece",
    "motif": "Real-game hanging piece candidate: wins knight",
    "tags": [
      "quiet-first-move",
      "tactic",
      "material-gain",
      "real-game",
      "middlegame",
      "forcing-sequence"
    ],
    "difficultyScore": 1640,
    "difficulty": "advanced",
    "toMove": "white",
    "board": [
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "S",
          "color": "white"
        },
        {
          "type": "R",
          "color": "white"
        }
      ],
      [
        {
          "type": "P",
          "color": "white"
        },
        null,
        {
          "type": "S",
          "color": "black"
        },
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        },
        {
          "type": "P",
          "color": "white"
        }
      ],
      [
        {
          "type": "P",
          "color": "black"
        },
        null,
        null,
        null,
        null,
        {
          "type": "P",
          "color": "white"
        },
        null,
        null
      ],
      [
        null,
        null,
        null,
        {
          "type": "N",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        },
        null,
        {
          "type": "P",
          "color": "black"
        }
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      [
        null,
        null,
        null,
        null,
        null,
        null,
        {
          "type": "S",
          "color": "black"
        },
        null
      ],
      [
        {
          "type": "S",
          "color": "white"
        },
        null,
        null,
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "K",
          "color": "black"
        },
        null,
        null,
        {
          "type": "R",
          "color": "black"
        }
      ]
    ],
    "setupMoves": [
      {
        "from": {
          "row": 0,
          "col": 7
        },
        "to": {
          "row": 1,
          "col": 7
        }
      },
      {
        "from": {
          "row": 7,
          "col": 5
        },
        "to": {
          "row": 6,
          "col": 6
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 4
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 1
        },
        "to": {
          "row": 1,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 7
        },
        "to": {
          "row": 4,
          "col": 7
        }
      },
      {
        "from": {
          "row": 0,
          "col": 4
        },
        "to": {
          "row": 1,
          "col": 5
        }
      },
      {
        "from": {
          "row": 7,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 0,
          "col": 2
        },
        "to": {
          "row": 1,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 0
        },
        "to": {
          "row": 4,
          "col": 0
        }
      },
      {
        "from": {
          "row": 0,
          "col": 5
        },
        "to": {
          "row": 1,
          "col": 6
        }
      },
      {
        "from": {
          "row": 4,
          "col": 0
        },
        "to": {
          "row": 3,
          "col": 0
        }
      },
      {
        "from": {
          "row": 1,
          "col": 5
        },
        "to": {
          "row": 2,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 4
        }
      },
      {
        "from": {
          "row": 1,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 2
        }
      },
      {
        "from": {
          "row": 7,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 6,
          "col": 1
        },
        "to": {
          "row": 5,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 0,
          "col": 6
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 1
        },
        "to": {
          "row": 4,
          "col": 1
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 2
        },
        "to": {
          "row": 3,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 4
        }
      },
      {
        "from": {
          "row": 6,
          "col": 4
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 5,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 4,
          "col": 1
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 4,
          "col": 3
        },
        "to": {
          "row": 5,
          "col": 2
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 3
        }
      },
      {
        "from": {
          "row": 3,
          "col": 4
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 5,
          "col": 6
        },
        "to": {
          "row": 4,
          "col": 5
        }
      },
      {
        "from": {
          "row": 1,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 3,
          "col": 2
        }
      },
      {
        "from": {
          "row": 2,
          "col": 5
        },
        "to": {
          "row": 3,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 3
        },
        "to": {
          "row": 2,
          "col": 3
        }
      },
      {
        "from": {
          "row": 5,
          "col": 2
        },
        "to": {
          "row": 6,
          "col": 1
        }
      },
      {
        "from": {
          "row": 2,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 1,
          "col": 4
        }
      },
      {
        "from": {
          "row": 7,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 6,
          "col": 1
        },
        "to": {
          "row": 7,
          "col": 0
        }
      },
      {
        "from": {
          "row": 5,
          "col": 5
        },
        "to": {
          "row": 4,
          "col": 3
        }
      },
      {
        "from": {
          "row": 1,
          "col": 4
        },
        "to": {
          "row": 2,
          "col": 5
        }
      },
      {
        "from": {
          "row": 3,
          "col": 2
        },
        "to": {
          "row": 2,
          "col": 2
        }
      }
    ],
    "solution": [
      {
        "from": {
          "row": 0,
          "col": 0
        },
        "to": {
          "row": 0,
          "col": 3
        }
      },
      {
        "from": {
          "row": 6,
          "col": 6
        },
        "to": {
          "row": 5,
          "col": 5
        }
      },
      {
        "from": {
          "row": 0,
          "col": 3
        },
        "to": {
          "row": 4,
          "col": 3
        }
      }
    ]
  }
];
