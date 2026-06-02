# Tasks: Room Lifecycle

**Input**: Design documents from `specs/001-room-lifecycle/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md

**Tests**: Included per Testing Requirement in constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Frontend**: `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project is operational and tooling is in place

- [x] T001 [P] Verify backend compiles and tests pass: `cd backend && npx tsc --noEmit && npm test`
- [x] T002 [P] Verify frontend compiles and tests pass: `cd frontend && npx tsc --noEmit && npm test`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Add `role: ParticipantRole` field to `Participant` interface in `backend/src/models/game.ts`
- [x] T004 [P] Add `hostId: string` field to `Room` interface and `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T005 [P] Add `"in-progress" | "finished"` variants to `RoomStatus` type in `backend/src/models/game.ts`
- [x] T006 Update `createRoom` in `backend/src/services/roomStore.ts` to set creator's `role` to `"host"` and store `hostId` on the room
- [x] T007 Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `hostId` on the snapshot
- [x] T008 Add host transfer logic in `backend/src/services/roomStore.ts`: when a participant leaves during `lobby` and is the host, assign the next-joined participant as new host
- [x] T009 Add room cleanup in `backend/src/services/roomStore.ts`: remove rooms from the Map when the last participant leaves

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Create Room as Host (Priority: P1) 🎯 MVP

**Goal**: A player creates a room and is identified as the host with `role: "host"`.

**Independent Test**: Create a room and verify response includes `role: "host"` for the creator's participant.

### Tests for User Story 1

- [x] T010 [P] [US1] Test that `createRoom` assigns `role: "host"` to creator in `backend/src/services/roomStore.test.ts`
- [x] T011 [P] [US1] Test that `GET /rooms/:code` snapshot includes `hostId` and `role` on participants in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 1

- [x] T012 [US1] Expose `role` in participant data returned by `toRoomSnapshot` in `backend/src/services/roomStore.ts`
- [x] T013 [US1] Update `POST /rooms` endpoint so the 201 response includes `role: "host"` for the creator in `backend/src/api/rooms.ts`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Join Room with Validation (Priority: P1)

**Goal**: A player joins a room with proper input validation and clear error messages.

**Independent Test**: Attempt joins with empty name (400 "Name is required"), unknown code (404 "Room not found"), in-progress room (400 "Game already in progress").

### Tests for User Story 2

- [x] T014 [P] [US2] Test `joinRoom` rejects empty name in `backend/src/services/roomStore.test.ts`
- [x] T015 [P] [US2] Test `joinRoom` rejects unknown room code (returns null) in `backend/src/services/roomStore.test.ts`
- [x] T016 [P] [US2] Test `joinRoom` rejects joins to `in-progress` rooms in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 2

- [x] T017 [P] [US2] Require non-empty `playerName` in `joinRoomSchema` in `backend/src/api/schemas.ts`
- [x] T018 [US2] Add validation checks to `joinRoom` in `backend/src/services/roomStore.ts`: reject empty name, reject join to `in-progress` rooms
- [x] T019 [US2] Update `POST /rooms/:code/join` handler to return appropriate error messages (400/404) based on validation failures in `backend/src/api/rooms.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Host Starts Game with 2-Player Minimum (Priority: P2)

**Goal**: Only the host can start the game; minimum 2 players required.

**Independent Test**: (1) Host starts with 1 player → error, (2) host starts with 2+ players → success, (3) non-host calls start → 403 error.

### Tests for User Story 3

- [x] T020 [P] [US3] Test `startGame` with fewer than 2 participants returns error in `backend/src/services/roomStore.test.ts`
- [x] T021 [P] [US3] Test `startGame` by non-host returns 403 error in `backend/src/services/roomStore.test.ts`
- [x] T022 [P] [US3] Test `startGame` with host + 2+ participants succeeds and transitions room to `in-progress` in `backend/src/services/roomStore.test.ts`
- [x] T023 [P] [US3] Test `startGame` is idempotent (calling again on `in-progress` returns success) in `backend/src/services/roomStore.test.ts`
- [x] T024 [P] [US3] Test `startGame` Zod schema rejects missing `participantId` in `backend/src/api/schemas.test.ts`

### Implementation for User Story 3

- [x] T025 [P] [US3] Add `startGameSchema` with required `participantId` in `backend/src/api/schemas.ts`
- [x] T026 [US3] Add `startGame(code, participantId)` function in `backend/src/services/roomStore.ts`: validate host role, check 2+ participants, transition status, handle idempotency
- [x] T027 [US3] Add `POST /rooms/:code/start` endpoint to rooms router in `backend/src/api/rooms.ts`
- [x] T028 [P] [US3] Add `startGame` method to frontend API client in `frontend/src/services/api.ts`
- [x] T029 [P] [US3] Add `startGame` method to `RoomStore` class in `frontend/src/state/roomStore.ts`
- [x] T030 [US3] Update `LobbyPage` in `frontend/src/pages/LobbyPage.tsx`: show "Start Game" button enabled for host, disabled for non-hosts with tooltip "Waiting for host to start"; clicking navigates to `/game` on success

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Lobby Auto-Polling (Priority: P2)

**Goal**: The lobby page polls the room snapshot every ~2 seconds to show new joiners without manual refresh.

**Independent Test**: Open lobby in tab A, join from tab B — tab A's participant list updates within ~3 seconds.

### Tests for User Story 4

- [x] T031 [P] [US4] Test API client `fetchRoom` is callable with room code and participantId in `frontend/src/services/api.test.ts`

### Implementation for User Story 4

- [x] T032 [P] [US4] Add `startPolling(roomCode, participantId)` and `stopPolling()` methods to `RoomStore` in `frontend/src/state/roomStore.ts` using `setInterval(~2000ms)` calling `fetchRoom`
- [x] T033 [US4] Update `LobbyPage` in `frontend/src/pages/LobbyPage.tsx`: start polling on mount, stop on unmount; track consecutive failures and show "Connection lost" inline message after 3 failures

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: User Story 5 - Multi-Room Isolation (Priority: P3)

**Purpose**: Verify that rooms are completely independent.

**Independent Test**: Create two rooms, join different players to each, verify each room's snapshot contains only its own members.

### Tests for User Story 5

- [x] T034 [P] [US5] Test that two separate rooms have independent participant lists in `backend/src/services/roomStore.test.ts`

### Implementation for User Story 5

- [x] T035 [US5] Multi-room isolation is architecturally guaranteed by the `Map<string, Room>` store. Verify by running all tests; no code change needed unless tests reveal a leak.

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T036 [P] Run full backend test suite: `cd backend && npm test`
- [x] T037 [P] Run full frontend test suite: `cd frontend && npm test`
- [x] T038 [P] Run TypeScript type check on backend: `cd backend && npx tsc --noEmit`
- [x] T039 [P] Run TypeScript type check on frontend: `cd frontend && npx tsc --noEmit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational — No dependencies on other stories
- **User Story 3 (P2)**: Depends on US1 (host tracking must exist)
- **User Story 4 (P2)**: Can start after Foundational — No dependencies on other stories
- **User Story 5 (P3)**: No code dependencies — verification only

### Within Each User Story

- Models before services
- Services before endpoints
- Backend before frontend (where applicable)

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel
- Once Foundational completes: US1 and US2 can run in parallel
- US4 (purely frontend) can run in parallel with US3 (backend-heavy)
- All tests for a user story marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all [P] tasks together:
Task: "T010 Test createRoom assigns host role"
Task: "T011 Test snapshot includes hostId and role"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (host tracking)
4. Complete Phase 4: User Story 2 (join validation)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 + US2 → Test independently → MVP (create + join works with validation)
3. Add US3 → Host can start game (2-player min) → Test
4. Add US4 → Auto-polling → Test
5. Add US5 → Isolation verification → Test
