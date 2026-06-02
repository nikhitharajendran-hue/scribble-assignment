# Tasks: Round Mechanics — Drawing, Guessing & Scoring

## Phase 1 — Setup

- [x] **T1.1** Check out fresh branch and verify baseline
  - Backend: `cd backend && npx vitest run` — all tests pass
  - Frontend: `cd frontend && npx vitest run` — all tests pass
  - TypeScript: no errors in either project

---

## Phase 2 — Data Model & Server Setup

- [x] **T2.0** Increase `express.json()` body limit on the server:
  - In `backend/src/app.ts`, change to `express.json({ limit: "1mb" })` to
    accommodate canvas payloads

- [x] **T2.1** Fix error handler to propagate Zod custom error messages:
  - In `backend/src/api/router.ts`, update `errorHandler` so that when a
    `ZodError` is caught, the first issue message is returned to the client
    instead of the generic `"Invalid request payload"`
  - This ensures FR-007 ("Guess is required") reaches the frontend

- [x] **T2.2** Add `Stroke` interface:
  ```ts
  export interface Stroke {
    points: { x: number; y: number }[];
  }
  ```

- [x] **T2.3** Add `GuessEntry` interface:
  ```ts
  export interface GuessEntry {
    participantId: string;
    participantName: string;
    guess: string;
    correct: boolean;
    timestamp: string;
  }
  ```

- [x] **T2.4** Extend `Participant`:
  - Add `score: number` (default 0)
  - Update `createParticipant()` in `roomStore.ts` to include `score: 0`

- [x] **T2.5** Extend `Room`:
  - Add `canvasData: Stroke[]` (initially `[]`)
  - Add `guessHistory: GuessEntry[]` (initially `[]`)
  - Add `correctGuessersThisRound: string[]` (initially `[]`, IDs of
    participants who guessed correctly in the current round)
  - Update `createRoom()` to initialize all three new fields

- [x] **T2.6** Extend `RoomSnapshot`:
  - Add `canvasData: Stroke[]`
  - Add `guessHistory: GuessEntry[]`
  - Ensure `participants` include the `score` field
  - Add `ZodError` import if not already present in `router.ts`

---

## Phase 3 — Canvas Backend

- [x] **T3.1** Add `submitCanvasSchema` in `backend/src/api/schemas.ts`:
  - Coordinates validated to [0, 800) × [0, 600) canvas bounds
  - Each stroke capped at 1000 points

- [x] **T3.2** Add `saveCanvas` function in `backend/src/services/roomStore.ts`:
  - Validate room exists, participant is drawer, room is in-progress
  - Cap strokes at 500 (FIFO drop oldest)
  - Return `{ room: RoomSnapshot }`

- [x] **T3.3** Add `POST /rooms/:code/canvas` route in `backend/src/api/rooms.ts`:
  - Handle errors: 404 / 403 / 400

- [x] **T3.4** Update `createRoom` in `roomStore.ts`:
  - Initialize `canvasData: []` and `guessHistory: []`

- [x] **T3.5** Update `toRoomSnapshot` in `roomStore.ts`:
  - Include `canvasData` and `guessHistory` in the returned snapshot

- [x] **T3.6** Add tests in `roomStore.test.ts`:
  - Drawer can save canvas, non-drawer rejected
  - Canvas data appears in snapshot
  - Canvas clear works
  - Canvas save fails for lobby rooms
  - Coordinate bounds and stroke length validated by schema
  - Unknown participantId returns error

---

## Phase 4 — Guess Backend

- [x] **T4.1** Add `submitGuessSchema` in `backend/src/api/schemas.ts`:
  ```ts
  guess: z.string().trim().min(1, "Guess is required")
  ```

- [x] **T4.2** Add `submitGuess` function in `backend/src/services/roomStore.ts`:
  - Case-insensitive comparison, per-player dedup
  - First correct guess = 100 points, tracked via `correctGuessersThisRound`
  - FIFO cap at 200 entries
  - Already-correct and duplicate-incorrect silently return snapshot
  - Auto-end: when all non-drawer participants have correctly guessed,
    set `room.status = "finished"` — snapshot returned with response
    already reflects finished state

- [x] **T4.3** Add `POST /rooms/:code/guess` route in `backend/src/api/rooms.ts`:
  - Handle errors: 404 / 400 (not in-progress, drawer cannot guess)

- [x] **T4.4** Add tests in `roomStore.test.ts`:
  - Correct/incorrect guess, case-insensitive, whitespace trimming
  - Drawer cannot guess, duplicate prevention
  - Already-correct and per-player dedup
  - Lobby rejection, guess history inclusion
  - Unknown participantId, correctGuessersThisRound tracking
  - Multi-round scenario
  - Auto-end: last correct guess transitions to `finished`
  - Auto-end: finished snapshot reveals word to all viewers

---

## Phase 5 — Frontend: Types & API

- [x] **T5.1** Update `frontend/src/services/api.ts`:
  - Add `Stroke`, `GuessEntry`, `score`, `canvasData`, `guessHistory`
  - Add `submitGuess` and `submitCanvas` methods

- [x] **T5.2** Update `roomStore.ts`:
  - Add `submitGuess` and `submitCanvas` methods

- [x] **T5.3** Add frontend tests:
  - Test: `submitGuess` sends POST to `/rooms/:code/guess`
  - Test: `submitCanvas` sends POST to `/rooms/:code/canvas`

---

## Phase 6 — Frontend: Canvas Component

- [x] **T6.1** Create `frontend/src/components/Canvas.tsx`:
  - 800×600 fixed canvas, black 3px strokes
  - Mouse/touch drawing, read-only mode, clear callback

- [x] **T6.2** Update `frontend/src/pages/GamePage.tsx`:
  - Replace placeholders with Canvas component
  - Drawer view: editable canvas + secret word
  - Guesser view: read-only canvas + GuessForm

- [x] **T6.3** Add canvas sync logic:
  - Send on stroke end, render existing canvasData
  - Guessers see updates on each poll

- [x] **T6.4** Update LobbyPage to redirect to /game on game start

- [x] **T6.5** Add polling to GamePage (start on mount, stop on unmount)

---

## Phase 7 — Frontend: Guess Form

- [x] **T7.1** Update `frontend/src/components/GuessForm.tsx`:
  - Inline feedback, disable after correct, disable for drawer

- [x] **T7.2** Wire `GuessForm` in `GamePage.tsx`

---

## Phase 8 — Frontend: Scoreboard

- [x] **T8.1** Update `frontend/src/components/Scoreboard.tsx`:
  - Sort by score descending, highlight current drawer

- [x] **T8.2** Wire `Scoreboard` in `GamePage.tsx`

---

## Phase 9 — Frontend: Activity / Guess History

- [x] **T9.1** Update `frontend/src/components/ResultPanel.tsx`:
  - Chronological guess entries, correct guesses with green checkmark

- [x] **T9.2** Wire `ResultPanel` in `GamePage.tsx`

---

## Phase 10 — Polish

- [x] **T10.1** Run full backend test suite
  - `cd backend && npx vitest run` — all tests pass
- [x] **T10.2** Run full frontend test suite
  - `cd frontend && npx vitest run` — all tests pass
- [x] **T10.3** Run TypeScript checks
  - `cd backend && npx tsc --noEmit`
  - `cd frontend && npx tsc --noEmit`
- [x] **T10.4** Verify no lint errors
- [ ] **T10.5** (Optional) Manual smoke test: start game, draw, submit guesses,
  verify scores, verify poll sync
