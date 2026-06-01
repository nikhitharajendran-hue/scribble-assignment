<!-- Sync Impact Report: v0.0.0 → v1.0.0; Principles filled from placeholder (5 new);
  Sections added: Project Structure & Boundaries, Strictly Forbidden (non-negotiable);
  No sections removed; Templates: spec-template.md ✅, plan-template.md ✅, tasks-template.md ✅;
  No deferred items. -->
# Scribble Constitution

## Core Principles

### I. TypeScript Strictness
All code MUST be fully typed. `any` is strictly forbidden; use `unknown`
as the dynamic type fallback when the shape is genuinely unknown. Prefer
explicit return types on all function signatures.

### II. Immutability & Pure Functions
Prefer immutable data structures. Keep functions pure where possible —
same inputs MUST produce the same outputs, with no side effects. Mutate
state only through explicit, well-defined channels (e.g., in-memory store
updates).

### III. Error Handling
Backend MUST use centralized error handlers — never inline `try/catch` in
route handlers. Define an `HttpError` class (or equivalent) for structured
HTTP errors. Frontend MUST gracefully handle all API errors — no UI crashes
on unexpected exceptions. Fail fast and visibly during development, degrade
gracefully in production.

### IV. Validation Discipline
All request payloads and responses on the backend MUST be validated with
Zod schemas. Route handlers MUST NOT assume the shape of incoming data
without passing through schema validation first.

### V. Testing Requirement
Both frontend and backend MUST use Vitest. Backend tests run in the `node`
environment; frontend tests run in the `jsdom` environment. All new
functionality MUST include tests. Prefer the Arrange-Act-Assert pattern.

## Project Structure & Boundaries

- **Backend** (`backend/`):
  - `src/api/` — Routes and request handling
  - `src/services/` — Core business logic (e.g., Room management)
  - `src/models/` — TypeScript types and entity representations
- **Frontend** (`frontend/`):
  - `src/pages/` — Page-level components (one per route)
  - `src/components/` — Reusable UI components
  - `src/state/` — State management (Context, Zustand, or custom stores)
  - `src/styles/` — Global CSS (`app.css`) and CSS modules
- All source code MUST use ES Modules (`"type": "module"`) and TypeScript.

## Strictly Forbidden (non-negotiable)

These constraints MUST NOT be violated under any circumstance:

- **No WebSockets**: Do not use WebSockets, Socket.io, or any real-time push
  protocol. All client-server sync MUST use HTTP polling.
- **No Databases**: Do not use any database (SQL, NoSQL, SQLite, etc.).
  All data MUST be stored in-memory only (e.g., `Map` on the backend).
- **No Authentication**: Do not add authentication, sessions, JWT, OAuth,
  or any identity/access control system.

## Governance

This constitution is the authoritative source of project rules and
constraints. It supersedes any ad-hoc or informal practices.

- **Amendments**: Changes require a documented proposal, review, and
  explicit approval. Amendments that add or remove principles are MINOR
  version bumps; backward-incompatible removals/redefinitions are MAJOR.
- **Compliance**: All specs, plans, task lists, and code reviews MUST
  reference and conform to this constitution. Violations MUST be flagged
  during review.
- **Complexity Justification**: Any deviation from the principles or
  structure defined here MUST be documented with a clear rationale and
  an approved simpler alternative that was rejected.

**Version**: 1.0.0 | **Ratified**: 2026-06-01 | **Last Amended**: 2026-06-01
