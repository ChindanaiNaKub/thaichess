# ThaiChess

Free, open-source online platform for playing Makruk (Thai chess) with live multiplayer, puzzles, lessons, and ratings.

## Language

**Product** (ThaiChess):
The website and service players use — accounts, matchmaking, puzzles, leaderboards, and the web app.
_Avoid_: Markrukthai, MarkrukThai (reserve those for the repo, package, or engine implementation names)

**Makruk**:
The traditional Thai board game (หมากรุก) — rules, pieces, and positions — independent of any website.
_Avoid_: ThaiChess (when you mean the game, not the platform), "Thai chess" as a synonym in glossary entries

**User**:
A signed-in account (Better Auth) with persistent profile, ratings, and game history.
_Avoid_: Player (when you only mean authenticated accounts), account (unless discussing billing or email)

**Guest**:
A player without a signed-in account, identified by a persistent `guest_*` ID in the browser.
_Avoid_: Anonymous user, visitor

**Player**:
Anyone occupying a seat in a live or finished game — User or Guest.
_Avoid_: User (when the person may be a Guest), socket (transport only, not identity)

**Game**:
A single played Makruk contest between two Players, whether live over Socket.IO or saved after completion.
_Avoid_: Match (except informal UI copy), round, session

**Rated game**:
A Game with `rated: true` whose completion updates player Elo and is persisted atomically.
_Avoid_: Ranked (unless quoting UI), ranked match
