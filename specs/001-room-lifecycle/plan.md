# Implementation Plan: Room Lifecycle

**Branch**: `001-room-lifecycle` | **Date**: 2026-06-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-room-lifecycle/spec.md`

## Summary

Add host tracking, join validation, lobby polling, and host-only game start
with a 2-player minimum to the multiplayer drawing game. The room lifecycle
must support host transfer, clear join errors, idempotent starts, and
resilient polling.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 24.x, React 18.x

**Primary Dependencies**: Express 4.x (backend), Zod 3.x (validation),
Vite 5.x (frontend build), React Router DOM v6 (routing)

**Storage**: In-memory (Map<string, Room>) — no database

**Testing**: Vitest (node env for backend, jsdom env for frontend)

**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge);
Node.js server

**Project Type**: Monorepo web application (backend API + React SPA)

**Performance Goals**: Polling interval ~2000ms; room creation under 1s;
API response times under 100ms for read operations

**Constraints**: No WebSockets (HTTP polling only), no database (in-memory
only), no authentication, ES Modules throughout

**Scale/Scope**: Single-server; rooms cleaned up when all participants leave

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| TypeScript Strictness | ✅ PASS | All new types will be strict, no `any` |
| Immutability & Pure Functions | ✅ PASS | Store operations return new snapshots |
| Error Handling | ✅ PASS | Backend uses centralized error handler; frontend catches API errors |
| Validation Discipline | ✅ PASS | Zod schemas for all new endpoints |
| Testing Requirement | ✅ PASS | Vitest tests for both BE and FE |
| No WebSockets | ✅ PASS | HTTP polling only |
| No Databases | ✅ PASS | In-memory Map storage |
| No Authentication | ✅ PASS | No auth added |

No violations. Complexity Tracking section is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-room-lifecycle/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # Room, Participant types (extend role, hostId)
│   ├── services/
│   │   └── roomStore.ts     # createRoom (host), joinRoom (validation), startGame
│   └── api/
│       ├── schemas.ts       # Add start game schema
│       ├── router.ts        # (unchanged)
│       └── rooms.ts         # Add POST /rooms/:code/start

frontend/
├── src/
│   ├── pages/
│   │   └── LobbyPage.tsx    # Polling, host indicator, start button
│   ├── services/
│   │   └── api.ts           # Add startGame method
│   └── state/
│       └── roomStore.ts     # Polling logic, start game action
```

**Structure Decision**: Web application (Option 2) — backend + frontend
split per existing project conventions.

## Complexity Tracking

*(Not applicable — all principles pass with no violations.)*
