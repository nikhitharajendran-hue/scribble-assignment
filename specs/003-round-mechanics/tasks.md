# Tasks: Round Mechanics — Drawing, Guessing & Scoring

## Phase 1 — Setup

- [ ] **T1.1** Check out fresh branch and verify baseline
  - Backend: `cd backend && npx vitest run` — all tests pass
  - Frontend: `cd frontend && npx vitest run` — all tests pass
  - TypeScript: no errors in either project

---

## Phase 2 — Data Model & Server Setup

- [ ] **T2.0** Increase `express.json()` body limit on the server:
  - In `backend/src/app.ts`, change to `express.json({ limit: "1mb" })` to
    accommodate canvas payloads

- [ ] **T2.1** Fix error handler to propagate Zod custom error messages:
  - In `backend/src/api/router.ts`, update `errorHandler` so that when a
    `ZodError` is caught, the first issue message is returned to the client
    instead of the generic `"Invalid request payload"`
  - This ensures FR-007 ("Guess is required") reaches the frontend
  - Example:
    ```ts
    if (error.name === "ZodError") {
      const zodError = error as import("zod").ZodError;
      const msg = zodError.errors[0]?.message ?? "Invalid request";
      response.status(400).json({ message: msg });
      return;
    }
    ```

- [ ] **T2.2** Add `Stroke` interface:
  ```ts
  export interface Stroke {
    points: { x: number; y: number }[];
  }
  ```

- [ ] **T2.3** Add `GuessEntry` interface:
  ```ts
  export interface GuessEntry {
    participantId: string;
    participantName: string;
    guess: string;
    correct: boolean;
    timestamp: string;
  }
  ```

- [ ] **T2.4** Extend `Participant`:
  - Add `score: number` (default 0)
  - Update `createParticipant()` in `roomStore.ts` to include `score: 0`

- [ ] **T2.5** Extend `Room`:
  - Add `canvasData: Stroke[]` (initially `[]`)
  - Add `guessHistory: GuessEntry[]` (initially `[]`)
  - Add `correctGuessersThisRound: string[]` (initially `[]`, IDs of
    participants who guessed correctly in the current round)
  - Update `createRoom()` to initialize all three new fields
  - Note: `correctGuessersThisRound` must be reset to `[]` at the start
    of each round. Round transitions are out of scope for this feature,
    but when implemented, the reset logic should go in the round-advance
    function (not in `startGame`, which only runs once).

- [ ] **T2.6** Extend `RoomSnapshot`:
  - Add `canvasData: Stroke[]`
  - Add `guessHistory: GuessEntry[]`
  - Ensure `participants` include the `score` field
  - Add `ZodError` import if not already present in `router.ts`

---

## Phase 3 — Canvas Backend

- [ ] **T3.1** Add `submitCanvasSchema` in `backend/src/api/schemas.ts`:
  ```ts
  const pointSchema = z.object({
    x: z.number().min(0).lt(800),
    y: z.number().min(0).lt(600)
  });

  const strokeSchema = z.object({
    points: z.array(pointSchema).max(1000, "Stroke exceeds max points")
  });

  export const submitCanvasSchema = z.object({
    participantId: z.string(),
    strokes: z.array(strokeSchema)
  });
  ```
  - Coordinates validated to [0, 800) × [0, 600) canvas bounds
  - Each stroke capped at 1000 points

- [ ] **T3.2** Add `saveCanvas` function in `backend/src/services/roomStore.ts`:
  - Accept `code`, `participantId`, `strokes`
  - Validate room exists → return `null` if not found
  - Validate participant is the current drawer → return error if not
  - Validate room is `in-progress` → return error if not
  - Validate participantId exists in room's participant list → return error if not
  - Truncate each stroke's points array at 1000 (already validated by Zod, but
    safe guard server-side too)
  - Replace `room.canvasData` with provided `strokes`
  - Cap strokes at 500 (silently drop oldest if exceeded)
  - Return `{ room: RoomSnapshot }`

- [ ] **T3.3** Add `POST /rooms/:code/canvas` route in `backend/src/api/rooms.ts`:
  - Parse body with `submitCanvasSchema`
  - Call `saveCanvas`
  - Handle errors:
    - Room not found → 404
    - Not drawer → 403 "Only the drawer can update the canvas"
    - Room not in-progress → 400 "Game is not in progress"
  - Return `{ room: toRoomSnapshot(result.room, participantId) }`

- [ ] **T3.4** Update `createRoom` in `roomStore.ts`:
  - Initialize `canvasData: []` and `guessHistory: []`

- [ ] **T3.5** Update `toRoomSnapshot` in `roomStore.ts`:
  - Include `canvasData` and `guessHistory` in the returned snapshot

- [ ] **T3.6** Add tests in `roomStore.test.ts`:
  - Test: drawer can save canvas strokes
  - Test: non-drawer cannot save canvas (returns error)
  - Test: canvas data appears in snapshot
  - Test: canvas clear (empty strokes) works
  - Test: canvas save fails for lobby rooms
  - Test: out-of-bounds coordinates are rejected by schema
  - Test: stroke with >1000 points is rejected by schema
  - Test: unknown participantId returns 400 error

---

## Phase 4 — Guess Backend

- [ ] **T4.1** Add `submitGuessSchema` in `backend/src/api/schemas.ts`:
  ```ts
  export const submitGuessSchema = z.object({
    participantId: z.string(),
    guess: z.string().trim().min(1, "Guess is required")
  });
  ```

- [ ] **T4.2** Add `submitGuess` function in `backend/src/services/roomStore.ts`:
  - Export `resolveWord` from `roomStore.ts` (currently module-private) so
    the guess logic can access it
  - Accept `code`, `participantId`, `guess`
  - Validate room exists → return error if not
  - Validate room is `in-progress` → return error if not
  - Validate participant is not the current drawer → return error if drawer
  - Validate participantId exists in room's participant list → return error
    if not
  - **Already-correct check**: If `participantId` is in
    `room.correctGuessersThisRound`, silently return
    `{ correct: true, room: <current snapshot> }` without recording
    (response indicates they are already correct)
  - **Dedup check (case-insensitive)**: Compare
    `guess.trim().toLowerCase()` against all existing entries in
    `room.guessHistory` where `participantId` matches. If any entry has
    the same lowercased text, silently return
    `{ correct: false, room: <current snapshot> }` without recording
  - Trim `guess` (already trimmed by Zod, but safe to re‑trim)
  - Compare `guess.toLowerCase()` against
    `resolveWord(code, currentRound).toLowerCase()`
  - Create `GuessEntry` with `guess`, `correct`, `participantName`, `timestamp`
  - Append to `room.guessHistory` (cap at 200 entries; FIFO drop oldest if exceeded)
  - If `correct` is `true`:
    - Set the guesser's `score` to 100
    - Add `participantId` to `room.correctGuessersThisRound`
  - Return `{ correct: boolean, room: RoomSnapshot }`

- [ ] **T4.3** Add `POST /rooms/:code/guess` route in `backend/src/api/rooms.ts`:
  - Parse body with `submitGuessSchema`
  - Call `submitGuess`
  - Handle errors:
    - Room not found → 404
    - Not in-progress → 400 "Game is not in progress"
    - Drawer tries to guess → 400 "Drawer cannot guess"
  - Return `{ correct: boolean, room: toRoomSnapshot(result.room, participantId) }`

- [ ] **T4.4** Add tests in `roomStore.test.ts`:
  - Test: correct guess returns `correct: true` and score becomes 100
  - Test: incorrect guess returns `correct: false` and score stays 0
  - Test: guess is case-insensitive (e.g., "ROCKET" matches "rocket")
  - Test: guess with surrounding whitespace is trimmed
  - Test: empty guess is rejected at schema level
  - Test: drawer cannot submit a guess
  - Test: guess after correct is silently ignored (no extra points, no second entry, `correct: true` in response)
  - Test: duplicate incorrect guess text from same player (case-insensitive) — silently ignored, `correct: false`
  - Test: same "ROCKET" then "rocket" from same player → only first recorded (case-insensitive dedup)
  - Test: same incorrect guess from different players — both recorded (dedup is per-player)
  - Test: guess for lobby room is rejected
  - Test: guess appears in `guessHistory` in the snapshot
  - Test: unknown participantId → 400 error
  - Test: correctGuessersThisRound includes participantId after correct guess
  - Test: correctGuessersThisRound is empty for incorrect guesses
  - Test: multi-round scenario — score persists but correctGuessersThisRound does not block

---

## Phase 5 — Frontend: Types & API

- [ ] **T5.1** Update `frontend/src/services/api.ts`:
  - Add `Stroke` and `GuessEntry` interfaces (mirror backend)
  - Add `score: number` to `Participant`
  - Add `canvasData: Stroke[]` and `guessHistory: GuessEntry[]` to `RoomSnapshot`
  - Add `submitGuess` method to `api` object:
    ```ts
    submitGuess(code: string, participantId: string, guess: string) {
      return request<{ correct: boolean; room: RoomSnapshot }>(
        `/rooms/${encodeURIComponent(code)}/guess`,
        { method: "POST", body: JSON.stringify({ participantId, guess }) }
      );
    }
    ```
  - Add `submitCanvas` method to `api` object:
    ```ts
    submitCanvas(code: string, participantId: string, strokes: Stroke[]) {
      return request<{ room: RoomSnapshot }>(
        `/rooms/${encodeURIComponent(code)}/canvas`,
        { method: "POST", body: JSON.stringify({ participantId, strokes }) }
      );
    }
    ```

- [ ] **T5.2** Update `roomStore.ts`:
  - Add `submitGuess` and `submitCanvas` methods to the `RoomStore` class
  - Both call the API, then call `setRoomSnapshot` to update state

- [ ] **T5.3** Add frontend tests:
  - Test: `submitGuess` sends POST to `/rooms/:code/guess` with body
    `{ participantId, guess }`
  - Test: `submitCanvas` sends POST to `/rooms/:code/canvas` with body
    `{ participantId, strokes }`
  - Test: `submitGuess` returns `{ correct, room }` shape
  - Test: `submitCanvas` returns `{ room }` shape

---

## Phase 6 — Frontend: Canvas Component

- [ ] **T6.1** Create `frontend/src/components/Canvas.tsx`:
  - Canvas fixed at 800×600 CSS pixels (`width={800} height={600}`)
  - Use a `<canvas>` HTML element
  - All strokes rendered in black, 3px width, solid line
  - Track mouse/touch events for drawing
  - On `mousedown`/`touchstart`: start a new stroke
  - On `mousemove`/`touchmove`: add points to current stroke, draw line
  - On `mouseup`/`touchend`: finalise stroke, emit to parent
  - Accept props:
    - `strokes: Stroke[]` — existing strokes to render
    - `onStrokesChange: (strokes: Stroke[]) => void` — emitted on stroke end
    - `readOnly?: boolean` — if true, disable drawing (for guessers)
    - `onClear?: () => void` — clear callback
  - Render existing strokes for read-only viewers

- [ ] **T6.2** Update `frontend/src/pages/GamePage.tsx`:
  - Replace hardcoded `<span className="section-kicker">Round 1</span>`
    with `room.currentRound` (dynamic)
  - Replace the canvas placeholder with `<Canvas>` component
  - If viewer is drawer:
    - Show editable canvas
    - Add "Clear Canvas" button
    - On stroke end, call `roomStore.submitCanvas()`
    - Right panel: replace "Your Guess" + GuessForm with a "Drawer Info"
      card showing "You are the drawer" and the secret word prominently
  - If viewer is guesser:
    - Show read-only canvas (canvas is disabled for drawing)
    - Right panel: keep "Your Guess" + GuessForm

- [ ] **T6.3** Add canvas sync logic:
  - Debounce or batch canvas updates (send on stroke end only)
  - On initial render, render any existing `canvasData` from snapshot
  - Guessers see canvas update on each poll cycle

- [ ] **T6.4** Update LobbyPage to redirect to /game on game start:
  - In `frontend/src/pages/LobbyPage.tsx`, add a `useEffect` that watches
    `room.status`. When it becomes `in-progress`, navigate to `/game`
  - Import `useNavigate` from `react-router-dom`

- [ ] **T6.5** Add polling to GamePage:
  - In `frontend/src/pages/GamePage.tsx`, add `useEffect` that calls
    `roomStore.startPolling()` on mount and `roomStore.stopPolling()` on
    unmount (same pattern as LobbyPage)
  - Import `useRoomStore` in addition to `useRoomState`
  - Use `useRoomStore` only for the `startPolling`/`stopPolling` calls;
    data access still uses `useRoomState`

---

## Phase 7 — Frontend: Guess Form

- [ ] **T7.1** Update `frontend/src/components/GuessForm.tsx`:
  - Accept `onSubmit` callback prop
  - On submit, call `onSubmit` with the guess text
  - Show inline feedback: "Correct!" or "Wrong" on result
  - Disable input after correct guess
  - Disable for drawer (show "You are the drawer — wait for guesses" message)

- [ ] **T7.2** Wire `GuessForm` in `GamePage.tsx`:
  - Pass `roomStore.submitGuess` as `onSubmit`
  - Handle the `correct` response: show feedback, disable form if correct
  - Disable form when viewer is drawer

---

## Phase 8 — Frontend: Scoreboard

- [ ] **T8.1** Update `frontend/src/components/Scoreboard.tsx`:
  - Accept `participants` with scores prop
  - Render each participant's name and score
  - Highlight the current drawer
  - Sort by score descending, then alphabetically

- [ ] **T8.2** Wire `Scoreboard` in `GamePage.tsx`:
  - Pass `room.participants` from snapshot

---

## Phase 9 — Frontend: Activity / Guess History

- [ ] **T9.1** Update `frontend/src/components/ResultPanel.tsx`:
  - Accept `guessHistory: GuessEntry[]` prop
  - Render each guess entry in chronological order
  - Show: "Alice: rocket" or "Bob: pizza ✅"
  - Correct guesses styled with green checkmark
  - Scrollable container for long histories

- [ ] **T9.2** Wire `ResultPanel` in `GamePage.tsx`:
  - Pass `room.guessHistory` from snapshot

---

## Phase 10 — Polish

- [ ] **T10.1** Run full backend test suite
  - `cd backend && npx vitest run` — all tests pass
- [ ] **T10.2** Run full frontend test suite
  - `cd frontend && npx vitest run` — all tests pass
- [ ] **T10.3** Run TypeScript checks
  - `cd backend && npx tsc --noEmit`
  - `cd frontend && npx tsc --noEmit`
- [ ] **T10.4** Verify no lint errors
- [ ] **T10.5** (Optional) Manual smoke test: start game, draw, submit guesses,
  verify scores, verify poll sync
