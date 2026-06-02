# Reflection: Round Mechanics — Drawing, Guessing & Scoring (003)

## What Was Built

**Backend**: Canvas sync via `POST /rooms/:code/canvas` (drawer-only write guard, stroke-based serialization, 500-stroke FIFO cap, 1000-points-per-stroke max, coordinate validation `[0,800)×[0,600)`). Guess submission via `POST /rooms/:code/guess` (trimmed, case-insensitive comparison, per-player dedup, drawer cannot guess, first-correct-only scoring at 100 points, 200-entry FIFO guess history). Zod error messages propagated to client. Express JSON body limit increased to 1mb.

**Frontend**: Interactive Canvas component (800×600, black 3px strokes, read-only mode for guessers, clear button for drawer). GamePage with dynamic `currentRound`, drawer/guesser views, polling on mount/stop on unmount. GuessForm with inline feedback ("Correct!"/"Wrong"), disabled after correct guess. Scoreboard sorted by score descending. ResultPanel showing chronological guess history. LobbyPage redirects to `/game` on game start.

## Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
| tasks.md all `[ ]` unchecked | Implementation fully committed (`f45fa43`) | Documentation gap — tasks were never updated to reflect completion |

No substantive deviations between spec/plan and code were found.

## Challenges

1. **`correctGuessersThisRound` bug (HIGH severity)**: Initial scoring used `score > 0` to block double-scoring, which breaks across rounds. Fixed by tracking correct guessers per round via a `correctGuessersThisRound: string[]` array.

2. **`resolveWord` not exported**: The guess logic needed `resolveWord` for case-insensitive comparison, but it was module-private. Required adding it to the module exports.

3. **Missing GamePage polling**: Initial implementation lacked polling on the GamePage — guessers would never see canvas updates. Fixed by adding `startPolling/stopPolling` in a `useEffect`.

4. **Canvas coordinate validation**: Zod schema bounds (`[0, 800) × [0, 600)`) must match the actual canvas dimensions. Any mismatch would silently clip strokes.

## What Went Well

- Stroke-based canvas serialization keeps payloads small compared to bitmap snapshots.
- Per-player dedup for incorrect guesses prevents spam while allowing different players to make the same wrong guess.
- FIFO caps (500 strokes, 200 guess entries) bound memory usage without breaking the game.
- Review checklist caught all major issues before they reached production.

## Future Considerations

- Canvas only supports black 3px strokes — color picker, brush size, and eraser are future enhancements.
- No undo/redo for the drawer (only a full clear).
- Canvas is 800×600 fixed — responsive sizing would help on mobile.
- Timer-based round end (rather than manual host end) would complete the gameplay loop naturally.
