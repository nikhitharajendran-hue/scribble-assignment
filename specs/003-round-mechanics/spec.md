# Feature Specification: Round Mechanics — Drawing, Guessing & Scoring

**Feature Branch**: `003-round-mechanics`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "Given a round is active with a drawer and guessers (all scores start at 0), When the drawer draws/clears the canvas and guessers submit their guesses, Then the drawing is visible on the drawer's screen; guesses are trimmed, case-insensitively compared, and empty ones rejected; the guess history is synced to all players via polling; correct guesses score 100 (incorrect add 0)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Canvas (Priority: P1)

The drawer sees a blank interactive canvas at the start of their turn.
They can draw freeform lines and clear the canvas to start over.

**Why this priority**: The drawing canvas is the primary interaction surface
for the drawer. Without it, the game cannot proceed.

**Independent Test**: Start a game as host (drawer), verify the canvas is a
visible interactive element. Draw on it and verify strokes appear locally.
Clear and verify the canvas is blank again.

**Acceptance Scenarios**:

1. **Given** the current user is the drawer, **When** the game page loads,
   **Then** a drawing canvas is visible and interactive, and the secret
   word is displayed prominently in the side panel.
2. **Given** the drawer is drawing on the canvas, **When** they move the
   mouse/finger, **Then** freeform lines appear on the canvas in real-time.
3. **Given** the drawer has drawn on the canvas, **When** they click
   "Clear Canvas", **Then** all strokes are removed and the canvas is blank.

---

### User Story 2 — Canvas State Synced to All Players (Priority: P1)

The drawer's drawing is persisted to the server and polled by all
participants so guessers see the evolving drawing.

**Why this priority**: Guessers need to see the drawing to make informed
guesses. Canvas sync is a prerequisite for meaningful gameplay.

**Independent Test**: Start a game as host (drawer), draw a visible shape,
poll the room snapshot as a guesser, verify the snapshot includes drawing
data matching the drawer's strokes.

**Acceptance Scenarios**:

1. **Given** the drawer has drawn strokes, **When** the room snapshot is
   fetched, **Then** `canvasData` contains stroke arrays representing the
   drawing.
2. **Given** the drawer clears the canvas, **When** the room snapshot is
   fetched, **Then** `canvasData` is an empty array.
3. **Given** a guesser polls the room snapshot, **When** the drawer adds
   new strokes, **Then** the snapshot's `canvasData` reflects the new
   strokes within the next poll cycle.

---

### User Story 3 — Guess Submission & Validation (Priority: P1)

Guessers can submit guesses. Empty or whitespace-only guesses are rejected.
Guesses are trimmed and compared case-insensitively against the secret word.

**Why this priority**: The guessing mechanic is the core game loop. Without
it, there is no win condition.

**Independent Test**: Start a game, submit a guess matching the secret word
(case-insensitively), verify it is marked correct. Submit an empty guess,
verify rejection. Submit an incorrect guess, verify wrong result.

**Acceptance Scenarios**:

1. **Given** the viewer is a guesser, **When** they submit a guess,
   **Then** the guess is recorded and compared against the secret word.
2. **Given** a guesser submits the secret word in a different case,
   **When** the guess is compared, **Then** it is counted as correct.
3. **Given** a guesser submits the secret word with leading/trailing spaces,
   **When** the guess is trimmed and compared, **Then** it is counted as
   correct.
4. **Given** a guesser submits an empty string, **When** the guess is
   processed, **Then** the response is a 400 error.
5. **Given** a guesser submits a whitespace-only string, **When** the guess
   is processed, **Then** the response is a 400 error.
6. **Given** a guesser submits a guess that does not match the secret word,
   **When** compared, **Then** the response indicates the guess is incorrect.
7. **Given** the drawer submits a guess, **When** the guess endpoint is
   called, **Then** the response is a 400 error (drawers cannot guess their
   own word).

---

### User Story 4 — Guess History Synced via Polling (Priority: P1)

All players see the guess history — who guessed what and whether it was
correct — updated via the existing polling mechanism.

**Why this priority**: The drawer needs to see guesses to know progress;
guessers benefit from seeing what has already been tried.

**Independent Test**: Submit a guess as a guesser, poll the room snapshot
as a different player, verify the guess appears in `guessHistory`.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** any player polls the room
   snapshot, **Then** the guess appears in the `guessHistory` array.
2. **Given** multiple guesses have been submitted, **When** the snapshot is
   fetched, **Then** `guessHistory` contains all guesses in submission order.
3. **Given** a guess history entry, **When** viewed by any participant,
   **Then** it shows the guesser's name, the guess text, and whether it was
   correct.

---

### User Story 5 — Scoring (Priority: P1)

Correct guesses earn 100 points. Incorrect guesses earn 0. All players
start at 0. Scores are included in the snapshot and updated via polling.

**Why this priority**: Scoring is a fundamental game mechanic. Without it,
there is no competitive element.

**Independent Test**: Start a game, submit a correct guess, verify the
guesser's score becomes 100. Submit an incorrect guess, verify score stays
at 0.

**Acceptance Scenarios**:

1. **Given** a guesser submits a correct guess, **When** the snapshot is
   polled, **Then** the guesser's `score` is 100.
2. **Given** a guesser submits an incorrect guess, **When** the snapshot is
   polled, **Then** the guesser's `score` remains 0.
3. **Given** a guesser already scored 100, **When** they submit another
   correct guess in the same round, **Then** their `score` remains 100
   (only the first correct guess per round counts).
4. **Given** the round is active, **When** any participant polls the
   snapshot, **Then** all participants' `score` values are visible.

---

### Edge Cases

- **Drawer cannot guess**: Submitting a guess as the drawer returns a 400
  error.
- **Duplicate correct guess (same round)**: Tracked by a
  `correctGuessersThisRound` array on the room (list of participant IDs who
  have guessed correctly in the current round). Subsequent guesses from
  those participants are silently ignored — no recording, no re-check.
- **Unknown participantId**: Submitting a guess or canvas update with a
  `participantId` not in the room's participant list returns a 400 error.
- **Large canvas data**: Stroke arrays are capped at 500 strokes per round;
  older strokes are silently dropped FIFO to prevent oversized payloads.
- **Points-per-stroke cap**: Each stroke is capped at 1000 points. Extra
  points beyond the cap are silently dropped to prevent a single stroke
  from bloating the payload.
- **Canvas coordinate bounds**: All `x`/`y` coordinates are validated to be
  within [0, 800) × [0, 600). Out-of-bounds values are clamped or rejected.
- **Canvas serialization**: Canvas data is stored as an array of stroke
  objects (each stroke = `{x, y}[]`) — not as a bitmap — to keep payloads
  small.
- **Canvas line style**: All strokes are black, 3px width, solid. No
  colour picker or brush size options for V1.
- **Canvas on mobile**: The canvas renders at exactly 800×600 CSS pixels.
  On small screens the canvas may overflow; no CSS scaling is applied in V1.
- **Drawer's side panel**: The drawer sees their role + secret word in
  the right panel instead of a guess form.
- **Canvas size**: All canvases render at a fixed 800×600 CSS pixels,
  using absolute pixel coordinates. No coordinate normalisation needed.
- **Guess after correct**: Once a guesser has correctly guessed, subsequent
  guesses by that guesser are silently ignored (not recorded, not checked).
- **Incorrect guess deduplication**: Deduplication is case-insensitive,
  matching the comparison logic. If a guesser submits `"ROCKET"` and later
  `"rocket"`, only the first is recorded. Submitting `"Rocket"` after
  `"rocket"` is also treated as a duplicate.
- **Guess history cap**: At 200 entries, the oldest entry is removed (FIFO)
  before appending a new one.
- **Guess response for silently-ignored submissions**: For an already-
  correct guesser, the response is `{ correct: true, room: RoomSnapshot }`.
  For a duplicate incorrect guess, the response is
  `{ correct: false, room: RoomSnapshot }`. In both cases, the room
  snapshot is unchanged from its current state.
- **Drawer sees all guesses**: The drawer sees the full guess history
  including partial progress. This is by design — it mirrors classic
  Pictionary where the drawer sees guesses coming in. No privacy
  restrictions on guess history visibility.
- **LobbyPage → GamePage transition**: When `room.status` becomes
  `in-progress`, the LobbyPage navigates to `/game`. The GamePage starts
  its own polling on mount (mirroring the LobbyPage's `startPolling`
  pattern).
- **Auto-end on all correct guesses**: When ALL guessers (participants who
  are not the drawer) have submitted a correct guess, the round
  automatically transitions to `finished` status. This happens within the
  `submitGuess` function — no manual `endRound` call is needed.
- **Round transition**: Manual `endRound` by the host is also supported
  (via `POST /rooms/:code/end-round`) for early termination.
- **Polling during drawing**: The drawer's canvas sends updates on stroke
  end (mouse up / touch end), not continuously, to avoid excessive requests.
- **JSON body size**: The Express `express.json()` default limit (100kb)
  may be exceeded by large canvas payloads. The limit should be increased
  to 1mb on the server. Canvas data is typically under this, but the
  ceiling avoids silent truncation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The drawer MUST have an interactive canvas where they can
  draw freeform lines.
- **FR-002**: The drawer MUST be able to clear the canvas to a blank state.
- **FR-003**: Canvas state MUST be serializable as an array of strokes
  (each stroke = array of `{x, y}` points).
- **FR-004**: The canvas state MUST be persisted on the server via
  `POST /rooms/:code/canvas` and included in the room snapshot.
- **FR-005**: All participants MUST see the current canvas state in the
  room snapshot (`canvasData`).
- **FR-006**: Guess submission MUST trim leading and trailing whitespace.
- **FR-007**: Guess submission MUST reject empty or whitespace-only guesses
  with a 400 error and message "Guess is required".
- **FR-008**: Guesses MUST be compared case-insensitively against the
  secret word.
- **FR-009**: The system MUST reject guess submissions from the current
  drawer with a 400 error and message "Drawer cannot guess".
- **FR-010**: A correct guess MUST increment the guesser's score by 100.
- **FR-011**: An incorrect guess MUST add 0 to the guesser's score.
- **FR-012**: Only the first correct guess by a player in a round awards
  points; subsequent correct guesses by the same player within the same
  round are idempotent. The system tracks this via a
  `correctGuessersThisRound` array on the room (reset per round).
- **FR-013**: The room snapshot MUST include a `guessHistory` array with
  all submitted guesses, visible to all participants.
- **FR-014**: The room snapshot MUST include `canvasData` (the current
  stroke array).
- **FR-015**: Each participant MUST have a `score` field (number, starts
  at 0, non-negative) persisted and included in the snapshot.
- **FR-016**: The system MUST reject guesses for rooms that are not in
  `in-progress` status with a 400 error.
- **FR-017**: When all non-drawer participants have correctly guessed the
  word, the system MUST automatically transition the room status to
  `finished`. The snapshot returned with the last correct guess MUST
  reflect this transition.

### Key Entities

- **Participant** (extended): New field `score: number` (default 0).
- **Room** (extended): New fields `canvasData: Stroke[]`,
  `guessHistory: GuessEntry[]`,
  `correctGuessersThisRound: string[]` (IDs of participants who guessed
  correctly this round; resets each round).
- **Stroke**: `{ points: { x: number, y: number }[] }` — a continuous
  freeform line.
- **GuessEntry**: `{ participantId: string, participantName: string,
  guess: string, correct: boolean, timestamp: string }`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can draw and clear the canvas via the UI.
- **SC-002**: Canvas state appears in the snapshot and is visible to
  guessers within 3 seconds of stroke completion.
- **SC-003**: Empty/whitespace-only guesses are rejected 100% of the time.
- **SC-004**: Correct-word guesses are detected correctly regardless of
  case or surrounding whitespace (100% of cases).
- **SC-005**: All guess history entries are visible to all participants
  within 3 seconds of submission.
- **SC-006**: Correct guessers receive exactly 100 points; incorrect
  guessers receive 0.
- **SC-007**: When the last guesser guesses correctly, the round
  transitions to `finished` within one API call.

## Assumptions

- Canvas data is stored as stroke point arrays (not bitmaps) to minimise
  payload size and serialisation cost.
- The existing 2-second polling mechanism (`startPolling` in
  `roomStore.ts`) is reused for guess history and canvas state syncing.
- The drawer sends canvas updates to `POST /rooms/:code/canvas` on each
  stroke end (mouse up / touch end), not per-pixel.
- Only the first correct guess per guesser per round awards points.
- Scores persist across rounds within a game (future feature will expose
  cumulative scoring).
- Round transitions (e.g., advancing to the next drawer) are out of scope
  for this feature.
- The `resolveWord` function is exported from `roomStore.ts` (or refactored
  into a shared helper) so the guess endpoint can access it.
- The LobbyPage redirects to `/game` when `room.status` becomes
  `in-progress`. The GamePage starts its own polling on mount.
- Canvas coordinate validation (`x < 800`, `y < 600`) and stroke point
  capping are implemented at the Zod schema level to reject malformed
  payloads early.
- The Express `errorHandler` is updated to propagate Zod custom error
  messages (e.g., "Guess is required") instead of a generic message.
