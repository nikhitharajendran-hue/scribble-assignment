# Discovery: Codebase Scaffold Understanding

**Date**: 2026-06-01 (initial discovery phase, prior to any feature work)

**Scope**: Initial exploration of the Scribble monorepo project scaffold before feature implementation began.

---

## Project Overview

Monolithic repository for a multiplayer drawing/guessing game ("Scribble"). Contains an Express + TypeScript backend and a Vite + React + TypeScript frontend. Communication is via HTTP polling (no WebSockets). All data is stored in-memory (no databases). No authentication.

## Repository Layout

```
scribble-assignment/
├── AGENTS.md                  # Copilot agent instructions
├── README.md                  # Project overview + 4 business scenarios
├── backend/                    # Express + TypeScript API server
│   ├── src/
│   │   ├── server.ts          # Entry point
│   │   ├── app.ts             # Express app factory
│   │   ├── api/
│   │   │   ├── router.ts      # Mounts routes, error handlers
│   │   │   ├── rooms.ts       # All room route handlers
│   │   │   ├── schemas.ts     # Zod validation schemas
│   │   │   └── schemas.test.ts
│   │   ├── models/
│   │   │   └── game.ts        # TypeScript type definitions
│   │   ├── services/
│   │   │   ├── roomStore.ts   # Core business logic (in-memory)
│   │   │   └── roomStore.test.ts
│   │   └── seed/
│   │       └── starterData.ts # 5 seed words
│   └── package.json
├── frontend/                   # Vite + React SPA
│   ├── src/
│   │   ├── main.tsx           # Entry point
│   │   ├── App.tsx            # Root component + provider
│   │   ├── services/
│   │   │   ├── api.ts         # HTTP client + types
│   │   │   └── api.test.ts
│   │   ├── state/
│   │   │   └── roomStore.ts   # Client state (Context + useSyncExternalStore)
│   │   ├── routes/
│   │   │   └── index.tsx      # React Router v6 routes
│   │   ├── pages/
│   │   │   ├── StartPage.tsx
│   │   │   ├── CreateRoomPage.tsx
│   │   │   ├── JoinRoomPage.tsx
│   │   │   ├── LobbyPage.tsx
│   │   │   ├── GamePage.tsx
│   │   │   └── ResultsPage.tsx
│   │   ├── components/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Canvas.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── GuessForm.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── ResultPanel.tsx
│   │   │   ├── RoomCodeBadge.tsx
│   │   │   └── Scoreboard.tsx
│   │   └── styles/
│   │       └── app.css        # All styles (568 lines)
│   └── package.json
├── .specify/
│   └── feature.json           # Points to active spec
└── specs/                     # Feature specifications
    ├── discovery.md           # This file
    ├── 001-room-lifecycle/
    ├── 002-round-start-drawer-word/
    ├── 003-round-mechanics/
    └── 004-round-end/
```

## Tech Stack Discoveries

| Layer | Technology | Version/Config | Notes |
|-------|-----------|----------------|-------|
| **Runtime** | Node.js | v22+ (`.nvmrc`) | ES Modules throughout |
| **Backend** | Express | ^4.21.1 | ESM, `tsx` for dev execution |
| **Backend validation** | Zod | ^3.23.8 | All request/response validation |
| **Frontend** | React | ^18.3.1 | Functional components + hooks |
| **Frontend bundler** | Vite | ^6 (from config) | Fast dev, ESM-native |
| **Frontend routing** | React Router | ^6.30.1 | v6 paradigm (`BrowserRouter`, `Route`) |
| **Frontend state** | Custom Context + `useSyncExternalStore` | — | Class-based store, not Zustand |
| **Testing** | Vitest | ^3.2.4 | Both projects, jsdom for frontend |
| **TypeScript** | — | ES2022 target, strict mode | Both projects |

## Backend Architecture

### Request Flow
```
HTTP Request → Express → Router → API Route → Zod parse → roomStore fn → Response
                                                      ↓
                                               HttpError / ZodError → errorHandler
```

### Error Handling Pattern
- **ZodError** → 400 with first error message (custom messages like "Name is required", "Guess is required")
- **HttpError** (custom class with `statusCode`) → 404/400/403 with message
- **Other errors** → 500 generic message
- Route handlers use `try/catch` with `next(error)` propagation to central `errorHandler` in `router.ts`

### Room Store Pattern
- In-memory `Map<string, Room>` (keyed by 6-char room code)
- Functions return `{ result, error }` union types (not throw internally)
- `cloneRoom(room)` via `structuredClone` for immutability
- All mutations call `rooms.set()` then return a clone

### API Route Convention
```
router.post("/:code/action", (req, res, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(req.params);
    const { participantId } = actionSchema.parse(req.body);
    const result = actionFn(code, participantId);

    if (result.error === "NOT_FOUND") throw new HttpError(404, "Room not found");
    if (result.error === "NOT_HOST") throw new HttpError(403, "...");

    res.json({ room: toRoomSnapshot(result.room!, participantId) });
  } catch (error) {
    next(error);
  }
});
```

## Frontend Architecture

### Data Flow
```
Page → useRoomStore() → store.method() → api.method() → fetch → HTTP → Backend
  ↑                          ↓
  └── useRoomState() ←─── store state ←── setRoomSnapshot(response.room)
```

### Store Pattern (RoomStore)
- Class instantiated once in a `useRef`, provided via React Context
- `subscribe(listener)` → internal listener array, called on every state change
- `getSnapshot()` → returns current `RoomState`
- State changes via `setState(partial)` — merges into existing state
- `useRoomState()` hook uses `useSyncExternalStore(store.subscribe, store.getSnapshot)`
- Polling: `setInterval` at 2s, stops after 3 consecutive fetch failures

### State Shape
```typescript
interface RoomState {
  room: RoomSnapshot | null;
  participantId: string | null;
  error: string | null;
  isLoading: boolean;
}
```

### Navigation Guards
Each page checks `room` on mount and redirects based on `room.status`:
- `LobbyPage`: Redirects to `/` if no room, to `/game` if `in-progress`
- `GamePage`: Redirects to `/` if no room, to `/results` if `finished`
- `ResultsPage`: Redirects to `/` if no room, to `/lobby` if `lobby`, to `/game` if `in-progress`

## Data Model (Initial Discovery)

Before any feature work, the seed scaffold included:
- `Participant`: `id`, `name`, `role` (host/guesser — this was later split)
- `Room`: `code`, `status` (lobby/in-progress/finished), `hostId`, `participants`
- `RoomSnapshot`: mirror of Room for API responses
- `RoomSessionResponse`: `{ participantId, room }`

All game-specific fields (`currentDrawerId`, `currentRound`, `currentWord`, `canvasData`, `guessHistory`, `correctGuessersThisRound`, `gameRole`, `score`) were added during feature implementation.

## API Endpoints (Initial Scaffold)

The scaffold had only the route structure; most endpoints were added during features:
- Original: `GET /health`, `GET /`, `GET /rooms/:code`
- Added in 001: `POST /rooms`, `POST /rooms/:code/join`, `POST /rooms/:code/start`, `POST /rooms/:code/leave`
- Added in 002: None (data model changes only)
- Added in 003: `POST /rooms/:code/canvas`, `POST /rooms/:code/guess`
- Added in 004: `POST /rooms/:code/end-round`, `POST /rooms/:code/restart`

## CSS Architecture

- Single file (`app.css`, 568 lines)
- CSS custom properties for theming (`--surface`, `--ink`, `--brand`, `--shadow`, etc.)
- BEM-like naming (`.card__header`, `.form__field`, `.button--primary`)
- 3-column grid for game page (sidebar : canvas : sidebar)
- Responsive: 1024px (game stacks), 720px (padding reduces, full-width buttons)

## Key Constraints (from README)

The following constraints were documented in the project README before any feature work:
- **No WebSockets**: All sync via HTTP polling
- **No databases**: In-memory only
- **No authentication**: No sessions, JWT, or OAuth
- **4 business scenarios**: Room Setup, Game Start, Gameplay, Result & Restart
- **Out of scope**: Multiple rounds, timers, custom words, spectator mode, moderation

## Initial Test Baseline

Before any feature implementation:
- **Backend**: 43 tests (all passing)
- **Frontend**: 2 tests (all passing)
- **TypeScript**: Both projects compiled clean

## Specs Implementation Order

| # | Feature | Branch | Status |
|---|---------|--------|--------|
| 001 | Room Lifecycle | `001-room-lifecycle` | Complete (39 tasks) |
| 002 | Round Start — Drawer & Word | `002-round-start-drawer-word` | Complete (26 tasks) |
| 003 | Round Mechanics — Drawing, Guessing & Scoring | `002-round-start-drawer-word` (no separate branch) | Complete (37 tasks) |
| 004 | Round End & Restart | `002-round-start-drawer-word` (no separate branch) | Complete (20 tasks) |

All features were implemented on branches derived from scaffold, and none have been merged to `main`.
