# Tasks: Round End & Restart

**Input**: Design documents from `/specs/004-round-end/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Phase 1: Setup

**Purpose**: Verify baseline before implementation

- [x] T001 Verify baseline — backend + frontend tests pass, TypeScript compiles

---

## Phase 2: Foundational

**Purpose**: Shared infrastructure needed by multiple user stories

- [x] T002 [P] Add `hostActionSchema` in `backend/src/api/schemas.ts`

---

## Phase 3: User Story 1 — Round Results Display (Priority: P1) 🎯 MVP

**Goal**: Backend support for ending a round — `POST /rooms/:code/end-round` transitions `in-progress` → `finished`, exposes the word to all viewers, preserves guess history and canvas.

**Independent Test**: Start a game, submit guesses, call `POST /rooms/:code/end-round`, verify snapshot has `status: "finished"`, currentWord visible to all, guessHistory intact.

- [x] T003 [US1] Add `endRound` function in `backend/src/services/roomStore.ts` — validate room exists, status is `in-progress`, caller is host; set `status = "finished"`, return `{ room: cloneRoom(room), error: null }`
- [x] T004 [US1] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` — expose `currentWord` to ALL viewers when `room.status === "finished"`
- [x] T005 [US1] Add `POST /rooms/:code/end-round` route in `backend/src/api/rooms.ts` — call `endRound`, handle errors (404/400/403), return snapshot
- [x] T006 [US1] Add backend tests in `backend/src/services/roomStore.test.ts` — endRound transitions status, word visible to all, non-host rejected, lobby rejected, canvas/guessHistory preserved

---

## Phase 4: User Story 2 — Host Restarts the Game (Priority: P1)

**Goal**: Backend support for restarting — `POST /rooms/:code/restart` transitions `finished` → `lobby`, clears round state, preserves players and cumulative scores.

**Independent Test**: End a round, call `POST /rooms/:code/restart`, verify `status: "lobby"`, players intact, scores preserved, canvasData/guessHistory/currentDrawerId/currentRound/gameRoles reset.

- [x] T007 [US2] Add `restartGame` function in `backend/src/services/roomStore.ts` — validate room exists, status is `finished`, caller is host; reset round state, preserve participants + scores, return `{ room: cloneRoom(room), error: null }`
- [x] T008 [US2] Add `POST /rooms/:code/restart` route in `backend/src/api/rooms.ts` — call `restartGame`, handle errors (404/400/403), return snapshot
- [x] T009 [US2] Add backend tests in `backend/src/services/roomStore.test.ts` — restart transitions to lobby, clears state, preserves players/scores, non-host rejected, wrong-status rejected, full cycle (start → end → restart → start)

---

## Phase 5: User Story 3 — Frontend Results Page (Priority: P1)

**Goal**: Players see a results page when the round ends — correct word, scoreboard, guess history, and a "Play Again" button for the host. Auto-navigate from game to results, and results to lobby on restart.

**Independent Test**: End a round via the backend, navigate to `/results` in the frontend, verify word/scores/history displayed; host sees Play Again; clicking it navigates to `/lobby`.

- [x] T010 [P] [US3] Add `endRound` and `restartGame` methods to `frontend/src/services/api.ts`
- [x] T011 [P] [US3] Add `endRound()` and `restartGame()` methods to `frontend/src/state/roomStore.ts`
- [x] T012 [US3] Add frontend API tests in `frontend/src/services/api.test.ts` — verify POST to `/rooms/:code/end-round` and `/rooms/:code/restart`
- [x] T013 [US3] Create `frontend/src/pages/ResultsPage.tsx` — shows correct word, final scoreboard, full guess history; "Play Again" button for host, disabled with "Waiting for host to restart" tooltip for non-hosts
- [x] T014 [US3] Add `/results` route in `frontend/src/routes/index.tsx`
- [x] T015 [US3] Update `frontend/src/pages/GamePage.tsx` — navigate to `/results` when poll detects `status === "finished"`
- [x] T016 [US3] Add polling to `ResultsPage.tsx` — on mount start polling, on unmount stop, navigate to `/lobby` when `status` transitions to `"lobby"`

---

## Phase 6: Polish

**Purpose**: Cross-cutting verification

- [x] T017 Run full backend test suite — `cd backend && npx vitest run`
- [x] T018 Run full frontend test suite — `cd frontend && npx vitest run`
- [x] T019 Run TypeScript checks — `cd backend && npx tsc --noEmit` and `cd frontend && npx tsc --noEmit`
- [x] T020 Lint and optional smoke test

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup
- **User Story 1 (Phase 3)**: Depends on Foundational
- **User Story 2 (Phase 4)**: Depends on Foundational — independent of US1
- **User Story 3 (Phase 5)**: Depends on Foundational — independent of US1/US2 (frontend-only, uses existing API contract)
- **Polish (Phase 6)**: Depends on all user stories complete

### Parallel Opportunities

- T002 (schemas), T010 (api.ts), T011 (roomStore.ts) are [P] — different files, no interdependencies
- US1 and US2 can be implemented in parallel (separate functions in the same file, but no logical dependency)
- US3 is fully independent (frontend-only, API contract is predetermined)

### MVP Scope

Phase 1 + 2 + 3 (US1: backend end-round) is the smallest MVP — the endpoint exists and snapshot is correct. Phase 4 (US2: restart) adds the full cycle. Phase 5 (US3: results page) is the player-facing completion.
