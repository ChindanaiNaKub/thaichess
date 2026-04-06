export type { Puzzle, PuzzlePoolDiagnostics } from './puzzles';
import type { Puzzle, PuzzlePoolDiagnostics } from './puzzles';

export const PUZZLES: Puzzle[] = [
  {
    "id": 7001,
    "title": "Ma Fork Through the Shell",
    "description": "White to move. Find the only Ma fork that checks the Khun and wins the trapped Ruea next.",
    "explanation": "Nf6+ is forcing, and after the only king move the Ma lands on h7 to collect the Ruea.",
    "source": "Makruk-native sample pack: tactical fork",
    "theme": "Fork",
    "motif": "Ma fork",
    "difficulty": "beginner",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Unique forcing Ma fork with one defender reply and a clean Ruea win."
    },
    "objective": "Win the black Ruea with the only forcing Ma fork.",
    "whyPositionMatters": "The extra pawns and short-range pieces make this a practical Makruk middlegame shell, not an empty fork diagram. White must use a forcing jump before Black untangles the clustered defense.",
    "dependsOnCounting": false,
    "ruleImpact": "No counting issue: unpromoted Bia remain on c4, d4, c5, f6, g6, and h6, so neither Sak Mak nor Sak Kradan is active. This puzzle is judged purely by Makruk movement and tactical force.",
    "goal": {
      "kind": "material-win",
      "result": "white-win",
      "reason": "material_win",
      "minMaterialSwing": 500
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "col": 4,
            "row": 3
          },
          "to": {
            "col": 5,
            "row": 5
          }
        },
        "lineId": "main",
        "explanation": "The Ma jump to f6 is the only move that checks the Khun and attacks the Ruea on h7 at the same time."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Forced fork",
        "moves": [
          {
            "from": {
              "col": 4,
              "row": 3
            },
            "to": {
              "col": 5,
              "row": 5
            }
          },
          {
            "from": {
              "col": 4,
              "row": 7
            },
            "to": {
              "col": 5,
              "row": 7
            }
          },
          {
            "from": {
              "col": 5,
              "row": 5
            },
            "to": {
              "col": 7,
              "row": 6
            }
          }
        ],
        "outcome": {
          "result": "white-win",
          "reason": "material_win",
          "explanation": "White wins the full Rua after a single forced king move."
        }
      }
    ],
    "hint1": "Look for the Ma jump that gives check and creates a second threat at the same time.",
    "hint2": "Do not settle for a quiet knight move. The right move must force the black Khun to answer while leaving the Rua hanging.",
    "keyIdea": "The fork works because check removes Black’s choice. A forcing Ma jump is stronger than a loose attack on the rook.",
    "commonWrongMove": {
      "from": {
        "col": 4,
        "row": 3
      },
      "to": {
        "col": 6,
        "row": 4
      }
    },
    "wrongMoveExplanation": "Ng5 looks active, but it does not check the Khun and it does not attack the Ruea. Black keeps both the king and the rook coordinated, so the teaching idea never appears.",
    "takeaway": "A Makruk Ma is strongest when one jump does two jobs at once. Here the right fork is forcing because the Khun is one of the targets.",
    "sideToMove": "white",
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
        {
          "type": "K",
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
          "type": "P",
          "color": "white"
        },
        null
      ],
      [
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
        {
          "type": "P",
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
        null,
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
          "type": "N",
          "color": "black"
        },
        null,
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
        null
      ]
    ],
    "tags": [
      "fork",
      "ma-fork",
      "forcing-check",
      "middlegame",
      "makruk-native",
      "tactic",
      "material-gain",
      "curated",
      "forcing-sequence"
    ],
    "origin": "curated-manual",
    "sourceGameId": null,
    "sourcePly": null,
    "difficultyScore": 1510,
    "difficultyProfile": {
      "candidateMoveCount": 22,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "early",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "explicit_piece_list",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "e7",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h7",
        "type": "R",
        "color": "black"
      },
      {
        "square": "f6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "g6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "N",
        "color": "white"
      },
      {
        "square": "f4",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c2",
        "type": "K",
        "color": "white"
      }
    ],
    "boardPosition": {
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
          {
            "type": "K",
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
            "type": "P",
            "color": "white"
          },
          null
        ],
        [
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
          {
            "type": "P",
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
          null,
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
            "type": "N",
            "color": "black"
          },
          null,
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
          null
        ]
      ],
      "counting": null
    },
    "counting": null,
    "solution": [
      {
        "from": {
          "col": 4,
          "row": 3
        },
        "to": {
          "col": 5,
          "row": 5
        }
      },
      {
        "from": {
          "col": 4,
          "row": 7
        },
        "to": {
          "col": 5,
          "row": 7
        }
      },
      {
        "from": {
          "col": 5,
          "row": 5
        },
        "to": {
          "col": 7,
          "row": 6
        }
      }
    ]
  },
  {
    "id": 7003,
    "title": "Mate Before Sak Mak Closes",
    "description": "White to move. Sak Mak is already on 15 out of 16 counted moves. Find the only mate before the draw arrives.",
    "explanation": "Rh8# ends the game immediately. Any quiet move lets Black spend the last counted move, after which White gets only one final attack before the engine declares a Sak Mak draw.",
    "source": "Makruk-native sample pack: counting race",
    "theme": "WinBeforeCountExpires",
    "motif": "final attack before Sak Mak draw",
    "difficulty": "intermediate",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Rule-native counted ending where only immediate mate beats the Sak Mak draw."
    },
    "objective": "Checkmate now before Black reaches the last counted Sak Mak move.",
    "whyPositionMatters": "A lone Rua against a bare Khun looks winning to chess players, but Makruk counting changes that judgment. The position teaches that material advantage is meaningless if the count is about to close.",
    "dependsOnCounting": true,
    "ruleImpact": "Counting matters here. Sak Mak is active with Black as the counting side at 15 of the 16 allowed counted moves for a one-Rua chase. If White does not mate immediately, Black reaches count 16 and White gets only one final attack before the game is drawn by the counting rule.",
    "goal": {
      "kind": "checkmate",
      "result": "white-win",
      "reason": "win_before_count"
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "col": 7,
            "row": 6
          },
          "to": {
            "col": 7,
            "row": 7
          }
        },
        "lineId": "main",
        "explanation": "The rook lift to h8 is immediate mate, so Sak Mak never gets the chance to rescue Black."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Mate before the count",
        "moves": [
          {
            "from": {
              "col": 7,
              "row": 6
            },
            "to": {
              "col": 7,
              "row": 7
            }
          }
        ],
        "outcome": {
          "result": "white-win",
          "reason": "win_before_count",
          "explanation": "White mates before Black can spend the last counted Sak Mak move."
        }
      }
    ],
    "hint1": "Count first. White does not have time for a waiting move.",
    "hint2": "Any move that is not mate lets Black consume the last Sak Mak count and reach the final-attack phase.",
    "keyIdea": "In Makruk, a winning ending can still be drawn by counting. The right move must finish the game before the count closes.",
    "commonWrongMove": {
      "from": {
        "col": 5,
        "row": 5
      },
      "to": {
        "col": 4,
        "row": 5
      }
    },
    "wrongMoveExplanation": "Ke6? wastes the only free moment. Black replies Kg8 or Ke8, reaches the last Sak Mak count, and White then gets just one final attack. Any non-mating final attack is scored as a draw by the engine.",
    "takeaway": "In Makruk, a winning ending can turn into a draw if you spend the count carelessly. Always ask whether the count leaves time for the finish.",
    "sideToMove": "white",
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
        {
          "type": "K",
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
      ]
    ],
    "counting": {
      "active": true,
      "type": "pieces_honor",
      "countingColor": "black",
      "strongerColor": "white",
      "currentCount": 15,
      "startCount": 3,
      "limit": 16,
      "finalAttackPending": false
    },
    "tags": [
      "counting",
      "sak-mak",
      "mate",
      "win-before-count",
      "makruk-native",
      "curated",
      "endgame"
    ],
    "origin": "curated-manual",
    "sourceGameId": null,
    "sourcePly": null,
    "difficultyScore": 1438,
    "difficultyProfile": {
      "candidateMoveCount": 19,
      "tacticalVisibility": "moderate",
      "countingAwareness": true,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "mid",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "explicit_piece_list",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "f8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "h7",
        "type": "R",
        "color": "white"
      },
      {
        "square": "f6",
        "type": "K",
        "color": "white"
      }
    ],
    "boardPosition": {
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
          {
            "type": "K",
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
        ]
      ],
      "counting": {
        "active": true,
        "type": "pieces_honor",
        "countingColor": "black",
        "strongerColor": "white",
        "currentCount": 15,
        "startCount": 3,
        "limit": 16,
        "finalAttackPending": false
      }
    },
    "solution": [
      {
        "from": {
          "col": 7,
          "row": 6
        },
        "to": {
          "col": 7,
          "row": 7
        }
      }
    ]
  },
  {
    "id": 7004,
    "title": "Capstone Mate Through d6",
    "description": "White to move. Force mate in 3 with the exact d6 interference line.",
    "explanation": "Ne4-d6+ is the key interference jump. Black has only Sxd6, which removes the e7 defender from the rook line. Only then does Rf3xf8+ become a one-reply forcing check, and Ne6-g7# finishes the mating net.",
    "source": "Manual source-of-truth Makruk capstone: authoritative mate-in-3 line",
    "theme": "MateIn3",
    "motif": "forced mate",
    "difficulty": "advanced",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Explicit piece-list capstone puzzle with an authoritative mate-in-3 line and forced defender replies."
    },
    "progressionStage": "late",
    "pool": "advanced_only",
    "minimumStreakRequired": 8,
    "positionAuthority": "explicit_piece_list",
    "solutionAuthority": "authoritative_line",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a7",
        "type": "R",
        "color": "white"
      },
      {
        "square": "c6",
        "type": "PM",
        "color": "white"
      },
      {
        "square": "e6",
        "type": "N",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "N",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "K",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "R",
        "color": "white"
      },
      {
        "square": "b8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "e7",
        "type": "S",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "R",
        "color": "black"
      }
    ],
    "objective": "Checkmate Black in three moves with the only forcing first move.",
    "whyPositionMatters": "This is a capstone Makruk attack. White must refuse small material and instead use a Ma interference check that drags the e7 Khon away from the king shell. Only after that deflection does the rook capture on f8 become a true forcing continuation.",
    "dependsOnCounting": false,
    "ruleImpact": "No counting issue applies. The puzzle is decided entirely by legal Makruk movement, king safety, and a forced mating net.",
    "goal": {
      "kind": "checkmate",
      "result": "white-win",
      "reason": "checkmate"
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "col": 4,
            "row": 3
          },
          "to": {
            "col": 3,
            "row": 5
          }
        },
        "lineId": "main",
        "explanation": "Ne4-d6+ is the only accepted move because it forces Sxd6 and strips Black of the extra defense against the rook invasion on f8."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Authoritative mate in 3",
        "moves": [
          {
            "from": {
              "col": 4,
              "row": 3
            },
            "to": {
              "col": 3,
              "row": 5
            }
          },
          {
            "from": {
              "col": 4,
              "row": 6
            },
            "to": {
              "col": 3,
              "row": 5
            }
          },
          {
            "from": {
              "col": 5,
              "row": 2
            },
            "to": {
              "col": 5,
              "row": 7
            }
          },
          {
            "from": {
              "col": 6,
              "row": 7
            },
            "to": {
              "col": 5,
              "row": 7
            }
          },
          {
            "from": {
              "col": 4,
              "row": 5
            },
            "to": {
              "col": 6,
              "row": 6
            }
          }
        ],
        "outcome": {
          "result": "white-win",
          "reason": "checkmate",
          "explanation": "Black is dragged into the only recapture on d6, then White forces Rf8+ and finishes with Ng7#."
        }
      }
    ],
    "hint1": "Start with the forcing check that interferes with the e7 Khon.",
    "hint2": "Do not cash out for small material. White must drag the e7 defender to d6 before the rook capture on f8 becomes forcing.",
    "keyIdea": "Ne4-d6+ is a Makruk interference check. It fixes the short-range defender on d6, so Rf3xf8+ becomes a one-reply check and Ne6-g7# ends the attack.",
    "commonWrongMove": {
      "from": {
        "col": 4,
        "row": 5
      },
      "to": {
        "col": 3,
        "row": 7
      }
    },
    "wrongMoveExplanation": "Ne6xd8 wins a Khon, but it is the wrong cash-out. White gives up the d6 interference, Black keeps the e7 Khon in place, and the rook capture on f8 no longer arrives with the same forcing power.",
    "takeaway": "In Makruk capstone attacks, the correct move is often the one that removes a defender’s choice first. Here White mates only by forcing the e7 Khon onto d6 before invading on f8.",
    "sideToMove": "white",
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
        null,
        null,
        {
          "type": "K",
          "color": "white"
        },
        null,
        null,
        {
          "type": "R",
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
        {
          "type": "N",
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
        {
          "type": "N",
          "color": "white"
        },
        null,
        null,
        null
      ],
      [
        {
          "type": "R",
          "color": "white"
        },
        null,
        null,
        null,
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
        {
          "type": "M",
          "color": "black"
        },
        {
          "type": "R",
          "color": "black"
        },
        null
      ]
    ],
    "tags": [
      "mate",
      "mate-in-3",
      "forced-mate",
      "authoritative-line",
      "late-streak",
      "makruk-native",
      "curated",
      "forcing-sequence"
    ],
    "origin": "curated-manual",
    "sourceGameId": null,
    "sourcePly": null,
    "difficultyScore": 1730,
    "difficultyProfile": {
      "candidateMoveCount": 46,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "boardPosition": {
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
          null,
          null,
          {
            "type": "K",
            "color": "white"
          },
          null,
          null,
          {
            "type": "R",
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
          {
            "type": "N",
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
          {
            "type": "N",
            "color": "white"
          },
          null,
          null,
          null
        ],
        [
          {
            "type": "R",
            "color": "white"
          },
          null,
          null,
          null,
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
          {
            "type": "M",
            "color": "black"
          },
          {
            "type": "R",
            "color": "black"
          },
          null
        ]
      ],
      "counting": null
    },
    "counting": null,
    "solution": [
      {
        "from": {
          "col": 4,
          "row": 3
        },
        "to": {
          "col": 3,
          "row": 5
        }
      },
      {
        "from": {
          "col": 4,
          "row": 6
        },
        "to": {
          "col": 3,
          "row": 5
        }
      },
      {
        "from": {
          "col": 5,
          "row": 2
        },
        "to": {
          "col": 5,
          "row": 7
        }
      },
      {
        "from": {
          "col": 6,
          "row": 7
        },
        "to": {
          "col": 5,
          "row": 7
        }
      },
      {
        "from": {
          "col": 4,
          "row": 5
        },
        "to": {
          "col": 6,
          "row": 6
        }
      }
    ]
  },
  {
    "id": 9000,
    "title": "Real-Game Discovery (selfplay-0001 @ ply 14)",
    "description": "Win material in 2. Find the discovered attack that reveals the winning line.",
    "explanation": "A quiet move opens a hidden line of attack, forcing the defense to react while the knight remains loose.",
    "source": "Offline self-play medium vs medium (ply 14)",
    "origin": "engine-generated",
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
      "forcing-sequence",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game discovery candidate: wins knight appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game discovery candidate: wins knight only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 30,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "late",
    "pool": "standard",
    "minimumStreakRequired": 6,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b6",
        "type": "M",
        "color": "black"
      },
      {
        "square": "d6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "e6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "f6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "g6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "b5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "d4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "g4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "N",
        "color": "white"
      },
      {
        "square": "a2",
        "type": "R",
        "color": "white"
      },
      {
        "square": "b1",
        "type": "N",
        "color": "white"
      },
      {
        "square": "c1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 4,
            "col": 7
          },
          "to": {
            "row": 3,
            "col": 6
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 4,
        "col": 2
      },
      "to": {
        "row": 3,
        "col": 3
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9001,
    "title": "Real-Game Promotion (selfplay-0001 @ ply 20)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 20)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0001",
    "sourcePly": 20,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that forces promotion or preserves the promotion plan.",
    "whyPositionMatters": "Real-game promotion candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the move that keeps the promotion route alive.",
    "hint2": "Material grabs that delay promotion are usually wrong if they let the defender regroup.",
    "keyIdea": "Promotion puzzles are about preserving the conversion route, not collecting side material.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game promotion candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 31,
      "tacticalVisibility": "hidden",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "quiet"
    },
    "progressionStage": "early",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b6",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "g6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "b5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "d5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "e5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "g4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a2",
        "type": "R",
        "color": "white"
      },
      {
        "square": "b1",
        "type": "N",
        "color": "white"
      },
      {
        "square": "c1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "promotion",
      "result": "black-win",
      "reason": "promotion"
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 3,
            "col": 6
          },
          "to": {
            "row": 2,
            "col": 6
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "promotion",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 4,
        "col": 3
      },
      "to": {
        "row": 3,
        "col": 4
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9003,
    "title": "Real-Game Fork (selfplay-0001 @ ply 62)",
    "description": "Win material in 2. Start with the fork that attacks the king and the khon.",
    "explanation": "The first move creates a double attack, and the follow-up wins the khon cleanly.",
    "source": "Offline self-play medium vs medium (ply 62)",
    "origin": "engine-generated",
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
      "forcing-sequence",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game fork candidate: wins khon appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game fork candidate: wins khon only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 27,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "late",
    "pool": "standard",
    "minimumStreakRequired": 6,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "d6",
        "type": "N",
        "color": "white"
      },
      {
        "square": "a5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a2",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c2",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e2",
        "type": "S",
        "color": "white"
      },
      {
        "square": "f2",
        "type": "M",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 5,
            "col": 2
          },
          "to": {
            "row": 3,
            "col": 3
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 1,
        "col": 0
      },
      "to": {
        "row": 3,
        "col": 1
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9005,
    "title": "Real-Game Trapped Piece (selfplay-0002 @ ply 29)",
    "description": "Win material in 2. Start with the move that traps the piece before collecting it.",
    "explanation": "The first move cuts off the escape squares. Black can shuffle, but the trapped piece still falls on the next move.",
    "source": "Offline self-play medium vs medium (ply 29)",
    "origin": "engine-generated",
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
      "forcing-sequence",
      "generated"
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
    ],
    "sideToMove": "white",
    "objective": "White to move. Find the only move that preserves the tactical win and does not let Black reorganize.",
    "whyPositionMatters": "Real-game trapped piece candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game trapped piece candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 31,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "late",
    "pool": "standard",
    "minimumStreakRequired": 6,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "e6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "b5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "N",
        "color": "white"
      },
      {
        "square": "g3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h2",
        "type": "R",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "b1",
        "type": "N",
        "color": "white"
      },
      {
        "square": "c1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "N",
        "color": "black"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "white-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 0,
            "col": 4
          },
          "to": {
            "row": 0,
            "col": 5
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "white-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 0,
        "col": 0
      },
      "to": {
        "row": 1,
        "col": 0
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9006,
    "title": "Real-Game Pin (selfplay-0002 @ ply 44)",
    "description": "Win material in 1. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 44)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 44,
    "theme": "Pin",
    "motif": "Real-game pin candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "pin",
      "real-game",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game pin candidate: wins knight appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game pin candidate: wins knight only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 31,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "mid",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b7",
        "type": "S",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h4",
        "type": "N",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "M",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b2",
        "type": "S",
        "color": "white"
      },
      {
        "square": "d2",
        "type": "N",
        "color": "white"
      },
      {
        "square": "h2",
        "type": "R",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "K",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 7,
            "col": 7
          },
          "to": {
            "row": 3,
            "col": 7
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 7,
        "col": 0
      },
      "to": {
        "row": 2,
        "col": 0
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9007,
    "title": "Real-Game Pin (selfplay-0002 @ ply 44)",
    "description": "Win material in 2. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 44)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 44,
    "theme": "Pin",
    "motif": "Real-game pin candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "pin",
      "real-game",
      "forcing-sequence",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game pin candidate: wins knight appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game pin candidate: wins knight only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 31,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "late",
    "pool": "standard",
    "minimumStreakRequired": 6,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b7",
        "type": "S",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h4",
        "type": "N",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "M",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b2",
        "type": "S",
        "color": "white"
      },
      {
        "square": "d2",
        "type": "N",
        "color": "white"
      },
      {
        "square": "h2",
        "type": "R",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "K",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 7,
            "col": 7
          },
          "to": {
            "row": 3,
            "col": 7
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 7,
        "col": 0
      },
      "to": {
        "row": 2,
        "col": 0
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9008,
    "title": "Real-Game Double Attack (selfplay-0002 @ ply 50)",
    "description": "Win material in 1. Start with the double attack that overloads the defense.",
    "explanation": "The first move creates two threats at once, so the defender cannot save everything and the knight falls.",
    "source": "Offline self-play medium vs medium (ply 50)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 50,
    "theme": "DoubleAttack",
    "motif": "Real-game double attack candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "double-attack",
      "real-game",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game double attack candidate: wins knight appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game double attack candidate: wins knight only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 34,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "mid",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "b7",
        "type": "S",
        "color": "black"
      },
      {
        "square": "f7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "R",
        "color": "white"
      },
      {
        "square": "f4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "N",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b2",
        "type": "S",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "K",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 2,
            "col": 7
          },
          "to": {
            "row": 2,
            "col": 5
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 7,
        "col": 0
      },
      "to": {
        "row": 2,
        "col": 0
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9009,
    "title": "Real-Game Double Attack (selfplay-0002 @ ply 52)",
    "description": "Win material in 1. Start with the double attack that overloads the defense.",
    "explanation": "The first move creates two threats at once, so the defender cannot save everything and the met falls.",
    "source": "Offline self-play medium vs medium (ply 52)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 52,
    "theme": "DoubleAttack",
    "motif": "Real-game double attack candidate: wins met",
    "tags": [
      "tactic",
      "material-gain",
      "double-attack",
      "real-game",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game double attack candidate: wins met appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game double attack candidate: wins met only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 32,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "mid",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "b7",
        "type": "S",
        "color": "black"
      },
      {
        "square": "f7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "R",
        "color": "white"
      },
      {
        "square": "f4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b2",
        "type": "S",
        "color": "white"
      },
      {
        "square": "e2",
        "type": "K",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 2,
            "col": 5
          },
          "to": {
            "row": 2,
            "col": 2
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 7,
        "col": 0
      },
      "to": {
        "row": 2,
        "col": 0
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9010,
    "title": "Real-Game Promotion (selfplay-0002 @ ply 71)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 71)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0002",
    "sourcePly": 71,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "generated"
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
    ],
    "sideToMove": "white",
    "objective": "White to move. Find the only move that forces promotion or preserves the promotion plan.",
    "whyPositionMatters": "Real-game promotion candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the move that keeps the promotion route alive.",
    "hint2": "Material grabs that delay promotion are usually wrong if they let the defender regroup.",
    "keyIdea": "Promotion puzzles are about preserving the conversion route, not collecting side material.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game promotion candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 19,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "early",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "g7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d6",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e6",
        "type": "S",
        "color": "black"
      },
      {
        "square": "c5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b4",
        "type": "S",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "R",
        "color": "white"
      },
      {
        "square": "b3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d3",
        "type": "K",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "promotion",
      "result": "white-win",
      "reason": "promotion"
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 4,
            "col": 2
          },
          "to": {
            "row": 5,
            "col": 3
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "white-win",
          "reason": "promotion",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 2,
        "col": 0
      },
      "to": {
        "row": 6,
        "col": 0
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9011,
    "title": "Real-Game Trapped Piece (selfplay-0003 @ ply 24)",
    "description": "Win material in 2. Start with the move that traps the piece before collecting it.",
    "explanation": "The first move cuts off the escape squares. Black can shuffle, but the trapped piece still falls on the next move.",
    "source": "Offline self-play medium vs medium (ply 24)",
    "origin": "engine-generated",
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
      "forcing-sequence",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game trapped piece candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game trapped piece candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 33,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "late",
    "pool": "standard",
    "minimumStreakRequired": 6,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "e7",
        "type": "R",
        "color": "black"
      },
      {
        "square": "a6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "e6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "f6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "b5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "d5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "b4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f4",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "N",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "b1",
        "type": "N",
        "color": "white"
      },
      {
        "square": "c1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 5,
            "col": 5
          },
          "to": {
            "row": 3,
            "col": 6
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 5,
        "col": 2
      },
      "to": {
        "row": 3,
        "col": 1
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9012,
    "title": "Real-Game Promotion (selfplay-0003 @ ply 30)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 30)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0003",
    "sourcePly": 30,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that forces promotion or preserves the promotion plan.",
    "whyPositionMatters": "Real-game promotion candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the move that keeps the promotion route alive.",
    "hint2": "Material grabs that delay promotion are usually wrong if they let the defender regroup.",
    "keyIdea": "Promotion puzzles are about preserving the conversion route, not collecting side material.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game promotion candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 33,
      "tacticalVisibility": "hidden",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "quiet"
    },
    "progressionStage": "early",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "e7",
        "type": "R",
        "color": "black"
      },
      {
        "square": "a6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "b5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "e5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "f4",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g4",
        "type": "N",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "N",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "b1",
        "type": "N",
        "color": "white"
      },
      {
        "square": "c1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "promotion",
      "result": "black-win",
      "reason": "promotion"
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 3,
            "col": 2
          },
          "to": {
            "row": 2,
            "col": 2
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        "outcome": {
          "result": "black-win",
          "reason": "promotion",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 3,
        "col": 6
      },
      "to": {
        "row": 4,
        "col": 4
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9013,
    "title": "Real-Game Double Attack (selfplay-0003 @ ply 32)",
    "description": "Win material in 1. Start with the double attack that overloads the defense.",
    "explanation": "The first move creates two threats at once, so the defender cannot save everything and the knight falls.",
    "source": "Offline self-play medium vs medium (ply 32)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0003",
    "sourcePly": 32,
    "theme": "DoubleAttack",
    "motif": "Real-game double attack candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "double-attack",
      "real-game",
      "middlegame",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game double attack candidate: wins knight appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game double attack candidate: wins knight only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 36,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "mid",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "e7",
        "type": "R",
        "color": "black"
      },
      {
        "square": "a6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "b5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "e5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "b4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "f4",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g4",
        "type": "N",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "PM",
        "color": "black"
      },
      {
        "square": "f3",
        "type": "N",
        "color": "white"
      },
      {
        "square": "d2",
        "type": "N",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "c1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 2,
            "col": 2
          },
          "to": {
            "row": 1,
            "col": 3
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 2,
        "col": 2
      },
      "to": {
        "row": 3,
        "col": 1
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9014,
    "title": "Real-Game Pin (selfplay-0004 @ ply 18)",
    "description": "Win material in 1. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 18)",
    "origin": "engine-generated",
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
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game pin candidate: wins knight appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game pin candidate: wins knight only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 28,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "mid",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "f7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "b6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "d6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "f6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "e5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "g5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a4",
        "type": "N",
        "color": "white"
      },
      {
        "square": "b4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e3",
        "type": "S",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "g3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g1",
        "type": "N",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 7,
            "col": 0
          },
          "to": {
            "row": 3,
            "col": 0
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 4,
        "col": 6
      },
      "to": {
        "row": 3,
        "col": 6
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9015,
    "title": "Real-Game Pin (selfplay-0004 @ ply 18)",
    "description": "Win material in 2. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 18)",
    "origin": "engine-generated",
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
      "forcing-sequence",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game pin candidate: wins knight appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game pin candidate: wins knight only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 28,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "late",
    "pool": "standard",
    "minimumStreakRequired": 6,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "f7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "b6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "d6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "f6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "e5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "g5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a4",
        "type": "N",
        "color": "white"
      },
      {
        "square": "b4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e3",
        "type": "S",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "g3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g1",
        "type": "N",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 7,
            "col": 0
          },
          "to": {
            "row": 3,
            "col": 0
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 4,
        "col": 6
      },
      "to": {
        "row": 3,
        "col": 6
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9016,
    "title": "Real-Game Promotion (selfplay-0004 @ ply 22)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 22)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 22,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that forces promotion or preserves the promotion plan.",
    "whyPositionMatters": "Real-game promotion candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the move that keeps the promotion route alive.",
    "hint2": "Material grabs that delay promotion are usually wrong if they let the defender regroup.",
    "keyIdea": "Promotion puzzles are about preserving the conversion route, not collecting side material.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game promotion candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 30,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "early",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "b8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "f7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "b6",
        "type": "PM",
        "color": "white"
      },
      {
        "square": "c6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "d6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "f6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "e5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "g5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a4",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e3",
        "type": "S",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "g3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g1",
        "type": "N",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "promotion",
      "result": "black-win",
      "reason": "promotion"
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 3,
            "col": 7
          },
          "to": {
            "row": 2,
            "col": 6
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "promotion",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 3,
        "col": 0
      },
      "to": {
        "row": 2,
        "col": 0
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9017,
    "title": "Real-Game Discovery (selfplay-0004 @ ply 22)",
    "description": "Win material in 2. Find the discovered attack that reveals the winning line.",
    "explanation": "A quiet move opens a hidden line of attack, forcing the defense to react while the pawn remains loose.",
    "source": "Offline self-play medium vs medium (ply 22)",
    "origin": "engine-generated",
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
      "forcing-sequence",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game discovery candidate: wins pawn appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game discovery candidate: wins pawn only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 30,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "late",
    "pool": "standard",
    "minimumStreakRequired": 6,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "b8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "f7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "b6",
        "type": "PM",
        "color": "white"
      },
      {
        "square": "c6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "d6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "f6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "e5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "g5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a4",
        "type": "R",
        "color": "black"
      },
      {
        "square": "b4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e3",
        "type": "S",
        "color": "white"
      },
      {
        "square": "f3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "g3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g1",
        "type": "N",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 3,
            "col": 7
          },
          "to": {
            "row": 2,
            "col": 6
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 3,
        "col": 0
      },
      "to": {
        "row": 2,
        "col": 0
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9018,
    "title": "Real-Game Trapped Piece (selfplay-0004 @ ply 37)",
    "description": "Win material in 2. Start with the move that traps the piece before collecting it.",
    "explanation": "The first move cuts off the escape squares. Black can shuffle, but the trapped piece still falls on the next move.",
    "source": "Offline self-play medium vs medium (ply 37)",
    "origin": "engine-generated",
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
      "forcing-sequence",
      "generated"
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
    ],
    "sideToMove": "white",
    "objective": "White to move. Find the only move that preserves the tactical win and does not let Black reorganize.",
    "whyPositionMatters": "Real-game trapped piece candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game trapped piece candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 33,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "late",
    "pool": "standard",
    "minimumStreakRequired": 6,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "b8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "f7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "f6",
        "type": "P",
        "color": "black"
      },
      {
        "square": "b5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c5",
        "type": "PM",
        "color": "white"
      },
      {
        "square": "d5",
        "type": "S",
        "color": "white"
      },
      {
        "square": "a4",
        "type": "R",
        "color": "black"
      },
      {
        "square": "d4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "e4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "g4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e3",
        "type": "PM",
        "color": "black"
      },
      {
        "square": "f3",
        "type": "N",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "white-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 4,
            "col": 3
          },
          "to": {
            "row": 3,
            "col": 4
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "white-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 2,
        "col": 3
      },
      "to": {
        "row": 3,
        "col": 4
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9019,
    "title": "Real-Game Promotion (selfplay-0004 @ ply 45)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 45)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 45,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame",
      "generated"
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
    ],
    "sideToMove": "white",
    "objective": "White to move. Find the only move that forces promotion or preserves the promotion plan.",
    "whyPositionMatters": "Real-game promotion candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the move that keeps the promotion route alive.",
    "hint2": "Material grabs that delay promotion are usually wrong if they let the defender regroup.",
    "keyIdea": "Promotion puzzles are about preserving the conversion route, not collecting side material.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game promotion candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 29,
      "tacticalVisibility": "hidden",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "quiet"
    },
    "progressionStage": "early",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "b8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "g7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "d6",
        "type": "PM",
        "color": "white"
      },
      {
        "square": "b5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e5",
        "type": "N",
        "color": "white"
      },
      {
        "square": "f5",
        "type": "S",
        "color": "white"
      },
      {
        "square": "a4",
        "type": "R",
        "color": "black"
      },
      {
        "square": "d4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "g4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "e3",
        "type": "PM",
        "color": "black"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "promotion",
      "result": "white-win",
      "reason": "promotion"
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 4,
            "col": 1
          },
          "to": {
            "row": 5,
            "col": 1
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "white-win",
          "reason": "promotion",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 4,
        "col": 5
      },
      "to": {
        "row": 5,
        "col": 6
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9020,
    "title": "Real-Game Pin (selfplay-0004 @ ply 54)",
    "description": "Win material in 1. Start with the pin that leaves the knight stuck.",
    "explanation": "The first move pins the defender in place, and the follow-up wins the knight.",
    "source": "Offline self-play medium vs medium (ply 54)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 54,
    "theme": "Pin",
    "motif": "Real-game pin candidate: wins knight",
    "tags": [
      "tactic",
      "material-gain",
      "pin",
      "real-game",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that preserves the tactical win and does not let White reorganize.",
    "whyPositionMatters": "Real-game pin candidate: wins knight appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game pin candidate: wins knight only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 28,
      "tacticalVisibility": "moderate",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "forcing"
    },
    "progressionStage": "mid",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "e7",
        "type": "N",
        "color": "black"
      },
      {
        "square": "g7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "b6",
        "type": "PM",
        "color": "white"
      },
      {
        "square": "e5",
        "type": "PM",
        "color": "white"
      },
      {
        "square": "a4",
        "type": "R",
        "color": "black"
      },
      {
        "square": "d4",
        "type": "N",
        "color": "white"
      },
      {
        "square": "e4",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "d3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "black-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 3,
            "col": 0
          },
          "to": {
            "row": 3,
            "col": 3
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 3,
        "col": 0
      },
      "to": {
        "row": 2,
        "col": 0
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9021,
    "title": "Real-Game Promotion (selfplay-0004 @ ply 65)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 65)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0004",
    "sourcePly": 65,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "generated"
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
    ],
    "sideToMove": "white",
    "objective": "White to move. Find the only move that forces promotion or preserves the promotion plan.",
    "whyPositionMatters": "Real-game promotion candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the move that keeps the promotion route alive.",
    "hint2": "Material grabs that delay promotion are usually wrong if they let the defender regroup.",
    "keyIdea": "Promotion puzzles are about preserving the conversion route, not collecting side material.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game promotion candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 26,
      "tacticalVisibility": "hidden",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "quiet"
    },
    "progressionStage": "early",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "c8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "f8",
        "type": "S",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "g7",
        "type": "K",
        "color": "black"
      },
      {
        "square": "b6",
        "type": "PM",
        "color": "white"
      },
      {
        "square": "c5",
        "type": "PM",
        "color": "white"
      },
      {
        "square": "f5",
        "type": "S",
        "color": "white"
      },
      {
        "square": "g5",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c4",
        "type": "N",
        "color": "black"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "c1",
        "type": "K",
        "color": "white"
      },
      {
        "square": "e1",
        "type": "M",
        "color": "white"
      },
      {
        "square": "f1",
        "type": "S",
        "color": "white"
      },
      {
        "square": "h1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "promotion",
      "result": "white-win",
      "reason": "promotion"
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 4,
            "col": 6
          },
          "to": {
            "row": 5,
            "col": 6
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "white-win",
          "reason": "promotion",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 4,
        "col": 5
      },
      "to": {
        "row": 5,
        "col": 6
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9022,
    "title": "Real-Game Promotion (selfplay-0005 @ ply 46)",
    "description": "Promote in 2. Start with the forcing move that escorts the bia to promotion.",
    "explanation": "The first move forces the reply, and the final move promotes the bia into a met.",
    "source": "Offline self-play medium vs medium (ply 46)",
    "origin": "engine-generated",
    "sourceGameId": "selfplay-0005",
    "sourcePly": 46,
    "theme": "Promotion",
    "motif": "Real-game promotion candidate",
    "tags": [
      "promotion",
      "real-game",
      "middlegame",
      "generated"
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
    ],
    "sideToMove": "black",
    "objective": "Black to move. Find the only move that forces promotion or preserves the promotion plan.",
    "whyPositionMatters": "Real-game promotion candidate appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the move that keeps the promotion route alive.",
    "hint2": "Material grabs that delay promotion are usually wrong if they let the defender regroup.",
    "keyIdea": "Promotion puzzles are about preserving the conversion route, not collecting side material.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game promotion candidate only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 26,
      "tacticalVisibility": "hidden",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "quiet"
    },
    "progressionStage": "early",
    "pool": "standard",
    "minimumStreakRequired": 0,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "g8",
        "type": "N",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "g7",
        "type": "S",
        "color": "black"
      },
      {
        "square": "c6",
        "type": "S",
        "color": "white"
      },
      {
        "square": "f5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "c4",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "f4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "g3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "g2",
        "type": "S",
        "color": "white"
      },
      {
        "square": "h2",
        "type": "R",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      },
      {
        "square": "d1",
        "type": "K",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "promotion",
      "result": "black-win",
      "reason": "promotion"
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 3,
            "col": 3
          },
          "to": {
            "row": 2,
            "col": 3
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "black-win",
          "reason": "promotion",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 3,
        "col": 2
      },
      "to": {
        "row": 2,
        "col": 1
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  },
  {
    "id": 9023,
    "title": "Real-Game Hanging Piece (selfplay-0005 @ ply 55)",
    "description": "Win material in 2. Start by taking the loose knight.",
    "explanation": "The target is insufficiently defended, so the forcing line wins the knight cleanly.",
    "source": "Offline self-play medium vs medium (ply 55)",
    "origin": "engine-generated",
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
      "forcing-sequence",
      "generated"
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
    ],
    "sideToMove": "white",
    "objective": "White to move. Find the only move that preserves the tactical win and does not let Black reorganize.",
    "whyPositionMatters": "Real-game hanging piece candidate: wins knight appears here in a real Makruk game structure, so the puzzle should teach an exact decision rather than a loose material grab.",
    "ruleImpact": "No counting issue changes the result here; the puzzle is decided by legal Makruk movement, king safety, and exact tactical force.",
    "hint1": "Look for the forcing move before you count material.",
    "hint2": "Reject tempting captures that release pressure or give the defender time to untangle.",
    "keyIdea": "The best move is the one that preserves the tactic and the initiative at the same time.",
    "wrongMoveExplanation": "That move may look active or win small material, but it does not preserve the published objective and gives the defender time to reorganize.",
    "takeaway": "The real-game hanging piece candidate: wins knight only works if you keep the initiative and preserve the exact Makruk objective.",
    "reviewStatus": "ship",
    "reviewChecklist": {
      "themeClarity": "pass",
      "teachingValue": "pass",
      "duplicateRisk": "clear",
      "reviewNotes": "Auto-promoted generated candidate: explicit source, replay-backed position, and publish-gate validation required."
    },
    "difficultyProfile": {
      "candidateMoveCount": 16,
      "tacticalVisibility": "hidden",
      "countingAwareness": false,
      "deceptive": true,
      "moveNature": "quiet"
    },
    "progressionStage": "late",
    "pool": "standard",
    "minimumStreakRequired": 6,
    "positionAuthority": "replay_validated",
    "solutionAuthority": "engine_confirmed",
    "boardOrientation": "white",
    "pieceList": [
      {
        "square": "a8",
        "type": "S",
        "color": "white"
      },
      {
        "square": "d8",
        "type": "M",
        "color": "black"
      },
      {
        "square": "e8",
        "type": "K",
        "color": "black"
      },
      {
        "square": "h8",
        "type": "R",
        "color": "black"
      },
      {
        "square": "g7",
        "type": "S",
        "color": "black"
      },
      {
        "square": "d5",
        "type": "N",
        "color": "black"
      },
      {
        "square": "f5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "h5",
        "type": "P",
        "color": "black"
      },
      {
        "square": "a4",
        "type": "P",
        "color": "black"
      },
      {
        "square": "f4",
        "type": "P",
        "color": "white"
      },
      {
        "square": "a3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "c3",
        "type": "S",
        "color": "black"
      },
      {
        "square": "f3",
        "type": "K",
        "color": "white"
      },
      {
        "square": "g3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "h3",
        "type": "P",
        "color": "white"
      },
      {
        "square": "g2",
        "type": "S",
        "color": "white"
      },
      {
        "square": "h2",
        "type": "R",
        "color": "white"
      },
      {
        "square": "a1",
        "type": "R",
        "color": "white"
      }
    ],
    "dependsOnCounting": false,
    "goal": {
      "kind": "material-win",
      "result": "white-win",
      "reason": "material_win",
      "minMaterialSwing": 200
    },
    "acceptedMoves": [
      {
        "move": {
          "from": {
            "row": 0,
            "col": 0
          },
          "to": {
            "row": 0,
            "col": 3
          }
        },
        "lineId": "main",
        "explanation": "Derived from the canonical solution line."
      }
    ],
    "solutionLines": [
      {
        "id": "main",
        "label": "Main line",
        "moves": [
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
        ],
        "outcome": {
          "result": "white-win",
          "reason": "material_win",
          "explanation": "Derived from the canonical solution line."
        }
      }
    ],
    "commonWrongMove": {
      "from": {
        "row": 0,
        "col": 0
      },
      "to": {
        "row": 0,
        "col": 4
      }
    },
    "boardPosition": {
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
      "counting": null
    },
    "counting": null
  }
] as Puzzle[];

export const PUZZLE_POOL_DIAGNOSTICS: PuzzlePoolDiagnostics = {
  "totalCandidates": 28,
  "validCandidates": 25,
  "shippedCandidates": 25,
  "rejectedCandidates": 3,
  "rejectionReasons": [
    {
      "reason": "Black bia cannot be behind its starting rank.",
      "count": 1
    },
    {
      "reason": "Fork puzzle accepted move d5-c3 must lead to a line where the forking piece collects a target.",
      "count": 1
    },
    {
      "reason": "Fork puzzle accepted move e3-f1 must lead to a line where the forking piece collects a target.",
      "count": 1
    }
  ],
  "publishableByDifficulty": {
    "beginner": 8,
    "intermediate": 7,
    "advanced": 10
  },
  "publishableBySource": {
    "curated": 3,
    "generated": 22
  }
} as PuzzlePoolDiagnostics;

export function getPuzzleById(id: number): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

export function getPuzzlesByDifficulty(difficulty: Puzzle['difficulty']): Puzzle[] {
  return PUZZLES.filter((p) => p.difficulty === difficulty);
}
