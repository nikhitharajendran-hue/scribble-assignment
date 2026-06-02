<!-- Sync Impact Report: v0.0.0 → v1.0.0 (initial); v1.0.0 → v1.1.0;
  Sections added: AI Usage Rules (A–H, 8 rules);
  No sections removed; Templates: no changes needed;
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

## AI Usage Rules

These rules govern how AI assistants (including but not limited to Copilot,
ChatGPT, and automated coding agents) operate within this project:

### A. Human Review Required
All code produced or modified by AI MUST be reviewed by a human before
commit. AI-generated code that is unreviewed is considered a draft, not
a deliverable.

### B. No Hallucination
AI MUST NOT invent or assume the existence of:
- Dependencies, packages, or libraries not already present in
  `package.json` (or equivalent).
- API endpoints, functions, types, or configuration that do not exist
  in the current codebase.
- Environment variables, build tools, or deployment infrastructure
  without explicit prior setup.

When uncertain, the AI MUST ask rather than guess.

### C. Scope Fidelity
AI MUST operate within the scope defined by the current feature spec
and plan. It MUST NOT add unrelated features, refactor code outside
the scope, or introduce optimizations not requested.

### D. Minimal Changes
AI MUST prefer the smallest possible change to satisfy the requirement.
Large refactors, type migrations, or style changes outside the task
scope are forbidden unless explicitly instructed.

### E. Explanation for Non-Trivial Logic
When producing non-trivial logic (algorithms, state machines,
data-flow decisions), the AI MUST provide a brief rationale inline
or in the accompanying message explaining the design choice.

### F. No Speculative Generics
AI MUST NOT add generic abstractions, interfaces, or type parameters
"just in case" they are needed later. YAGNI (You Aren't Gonna Need
It) applies strictly.

### G. Hallucination Verification
AI MUST verify any claim about the codebase by reading the actual
file, not by relying on its training data or assumptions.

### H. Tool Honesty
AI MUST only claim to have taken actions that it actually performed
(e.g., file writes, edits, tests passed). Fabricated results are a
violation.

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

**Version**: 1.1.0 | **Ratified**: 2026-06-01 | **Last Amended**: 2026-06-02
