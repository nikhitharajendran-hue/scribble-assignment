# Tasks: Round Start — Drawer & Word Assignment

## Phase 1 — Setup

- [x] **T1.1** Check out fresh branch and verify baseline
  - Backend: `cd backend && npx vitest run` — all 15 tests pass
  - Frontend: `cd frontend && npx vitest run` — all 2 tests pass
  - TypeScript: no errors in either project

---

## Phase 2 — Data Model (`backend/src/models/game.ts`)

- [x] **T2.1** Split `ParticipantRole` into two types:
  - `Role = "host" | "participant"` (renamed from `ParticipantRole` for
    room-ownership role)
  - `GameRole = "drawer" | "guesser" | null` (new, for round role)
  - Remove `"drawer"` from the old `ParticipantRole` — it moves to
    `GameRole`.

- [x] **T2.2** Extend `Participant` interface:
  - Add optional `gameRole?: GameRole`

- [x] **T2.3** Extend `Room` interface:
  - Add `currentDrawerId: string | null` (initially `null`)
  - Add `currentRound: number` (initially `0`, first round sets to `1`)

- [x] **T2.4** Extend `RoomSnapshot` interface:
  - Add `currentDrawerId: string | null`
  - Add `currentRound: number`
  - Add `currentWord: string | null` (viewer-dependent)
  - Remove `availableWords: string[]`
  - Remove `roles: ParticipantRole[]`

- [x] **T2.5** Update `backend/src/seed/starterData.ts`:
  - Remove `STARTER_ROLES` export (no longer needed)

---

## Phase 3 — Name Validation

- [x] **T3.1** Update `createRoomSchema` in `backend/src/api/schemas.ts`:
  - Change `playerName` from `z.string().optional()` to
    `z.string().trim().min(1, "Name is required")` (required — removed `.optional()`)

- [x] **T3.2** Update `joinRoomSchema` in `backend/src/api/schemas.ts`:
  - Add `.trim()` before `.min(1)`:
    `z.string().trim().min(1, "Name is required")`

- [x] **T3.3** Update `backend/src/services/roomStore.ts`:
  - Remove `displayName()` fallback for create — empty name now rejected
    at schema level
  - Remove inline trimming from `joinRoom` — `joinRoomSchema`
    now handles it
  - Simplify `joinRoom`: no more `trimmedName` check, rely on schema
  - `createParticipant` now takes `name: string` (required)

- [x] **T3.4** Update `createRoom` signature/behavior:
  - `createRoom` no longer receives empty/whitespace names (blocked by
    schema). Remove the `displayName` fallback path for create.
  - Store the name directly as provided by Zod (already trimmed).
  - `createRoom` now takes `playerName: string` (required)

- [x] **T3.5** Update `backend/src/api/rooms.ts`:
  - The join route no longer needs the "Unable to join room" fallback for
    name issues. Whitespace names now fail Zod validation before reaching
    the handler → Zod error (400) instead of handler error.

- [x] **T3.6** Update tests in `schemas.test.ts`:
  - Add test: `joinRoomSchema` rejects whitespace-only name with "Name is
    required"
  - Add test: `createRoomSchema` rejects whitespace-only name

- [x] **T3.7** Update tests in `roomStore.test.ts`:
  - The "joinRoom rejects empty name" test removed (now caught by Zod).
  - Schema-level test in `schemas.test.ts` validates whitespace rejection.

---

## Phase 4 — Drawer Assignment

- [x] **T4.1** Update `startGame` in `backend/src/services/roomStore.ts`:
  - After setting `room.status = "in-progress"`:
    - Set `room.currentDrawerId = room.hostId`
    - Set `room.currentRound = 1`
    - For each participant:
      - If `p.id === room.hostId` → `p.gameRole = "drawer"`
      - Else → `p.gameRole = "guesser"`
  - Idempotent path (already `in-progress`): still returns room with
    existing `currentDrawerId` and `gameRole`s set.

- [x] **T4.2** Update `createRoom` to initialize new fields:
  - `currentDrawerId: null`
  - `currentRound: 0`

- [x] **T4.3** Update `createParticipant` to include `gameRole`:
  - `gameRole: null` initially

- [x] **T4.4** Add tests to `roomStore.test.ts`:
  - Test: after startGame, `currentDrawerId` equals hostId
  - Test: after startGame, host participant has `gameRole: "drawer"`
  - Test: after startGame, other participants have `gameRole: "guesser"`
  - Test: idempotent start still has correct `currentDrawerId`

---

## Phase 5 — Word Selection

- [x] **T5.1** Create a `resolveWord` function (inline in `roomStore.ts`):
  - Input: room code (string), round number (number)
  - Deterministic: same code + round → same word
  - Algorithm: simple FNV-1a-like hash of `code + round` →
    index % words.length → word

- [x] **T5.2** Update `toRoomSnapshot` in `backend/src/services/roomStore.ts`:
  - Pass `viewerParticipantId` through properly
  - Include `currentDrawerId` and `currentRound` from room
  - If game is in-progress:
    - Resolve word via `resolveWord(room.code, room.currentRound)`
    - If viewerParticipantId === room.currentDrawerId → `currentWord = word`
    - Else → `currentWord = null`
  - If game is lobby: `currentWord = null`
  - If game is finished: `currentWord = word` (revealed to all)
  - Remove `availableWords` and `roles` from return value

- [x] **T5.3** Add tests to `roomStore.test.ts`:
  - Test: drawer sees word in snapshot
  - Test: non-drawer sees `currentWord: null` in snapshot
  - Test: unauthenticated viewer sees `currentWord: null`
  - Test: deterministic — same call returns same word

---

## Phase 6 — Frontend

- [x] **T6.1** Update `frontend/src/services/api.ts`:
  - Split `ParticipantRole` into `Role` and `GameRole` (mirror backend)
  - Add `gameRole?: "drawer" | "guesser" | null` to `Participant`
  - Add `currentDrawerId`, `currentRound`, `currentWord` to
    `RoomSnapshot`
  - Remove `availableWords`, `roles` from `RoomSnapshot`
  - Add `"finished"` to `RoomSnapshot.status`

- [x] **T6.2** Update `frontend/src/state/roomStore.ts`:
  - No structural changes needed — new fields flow through existing
    polling

- [x] **T6.3** Update `frontend/src/pages/LobbyPage.tsx`:
  - After game starts (status = "in-progress"), show drawer name
    prominently
  - If the current user is the drawer and `currentWord` is present,
    display the secret word (styling note: only the drawer sees it)
  - If the current user is not the drawer, show "Drawer is drawing..."
    without the word
  - Host indicator: `role === "host"` still works (unchanged)
  - Navigate to `/game` or show game view inline (as designed)

- [x] **T6.4** Add frontend tests:
  - Test: `fetchRoom` returns `currentWord` for drawer and `null` for non-drawer
  - Test: `fetchRoom` returns finished snapshot with word visible to all

---

## Phase 7 — Polish

- [x] **T7.1** Run full backend test suite
  - `cd backend && npx vitest run` — 55 tests pass (10 schema + 45 roomStore)
- [x] **T7.2** Run full frontend test suite
  - `cd frontend && npx vitest run` — 6 tests pass
- [x] **T7.3** Run TypeScript checks
  - `cd backend && npx tsc --noEmit` — clean
  - `cd frontend && npx tsc --noEmit` — clean
- [x] **T7.4** Verify no lint errors — clean
- [ ] **T7.5** (Optional) Manual smoke test: create room, join, start game,
  verify drawer sees word and guesser does not
