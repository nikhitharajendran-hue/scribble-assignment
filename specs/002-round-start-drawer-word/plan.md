# Implementation Plan: Round Start — Drawer & Word Assignment

## Problem Summary

When the host starts a game, (1) player names must be trimmed/validated,
(2) the first drawer must be clearly identified, (3) the secret word must
be deterministically selected and only visible to the drawer. This plan
extends the existing room lifecycle feature.

## Implementation Phases

| Phase | Scope | Files |
|-------|-------|-------|
| **1. Setup** | Verify baseline (tests pass, app compiles) | — |
| **2. Data Model** | Extend `Participant` with `gameRole`, `Room` with `currentDrawerId`/`currentRound`, `RoomSnapshot` with viewer-dependent fields | `backend/src/models/game.ts` |
| **3. Name Validation** | Trim + reject empty/whitespace names on create and join | `backend/src/api/schemas.ts`, `backend/src/services/roomStore.ts`, `backend/src/api/rooms.ts` |
| **4. Drawer Assignment** | `startGame` sets drawer + `gameRole` for all participants | `backend/src/services/roomStore.ts` |
| **5. Word Selection** | Deterministic word function + viewer-dependent snapshot | `backend/src/services/roomStore.ts`, `backend/src/models/game.ts` |
| **6. Frontend** | Update types, store, LobbyPage for drawer/word display | `frontend/src/services/api.ts`, `frontend/src/state/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx` |
| **7. Polish** | Full test pass, lint, typecheck | All |

## Key Design Decisions

1. **Role split**: Existing `role` field stays as `"host" | "participant"`.
   New `gameRole` field (`"drawer" | "guesser" | null`) tracks game-round
   role. The old `ParticipantRole` type is split into two types.
   `STARTER_ROLES` (used in `RoomSnapshot.roles`) is removed.

2. **Room snapshot viewer-dependence**: `toRoomSnapshot` now uses
   `viewerParticipantId` to conditionally include `currentWord` and
   set each participant's `gameRole`. Non-drawers see `currentWord: null`.

3. **Deterministic word selection**: `selectWord(code, round)` uses
   a simple FNV-1a-like hash of `code + round` modulo word list length.

4. **`availableWords` and `roles` removed** from `RoomSnapshot` — they
   are implementation details the frontend doesn't need.

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Breaking existing create/join tests | Low | Name trimming is a superset of current behavior |
| Breaking existing startGame tests | Medium | `startGame` now requires `roomStore.ts` to be imported; `Room` model changes may ripple |
| Frontend store breakage | Low | New fields are additive, old fields unchanged |
| ESLint/TypeScript issues | Low | Run typecheck after each phase |
