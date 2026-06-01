# Specification Quality Checklist: Round Mechanics — Drawing, Guessing & Scoring

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-01
**Updated**: 2026-06-01 (post-analysis)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Plan Quality Validation

- [x] Plan covers all functional requirements (FR-001 through FR-016)
- [x] Implementation phases are clearly ordered and scoped
- [x] Risk assessment included
- [x] Key design decisions documented (stroke-based canvas, drawer-only write guard, case-insensitive comparison, correctGuessersThisRound tracking, Lobby→Game transition, coordinate validation)
- [x] Tasks are concrete and actionable
- [x] Tasks reference specific file paths and line numbers
- [x] Each task has clear completion criteria
- [x] Contradictions with existing codebase are addressed (existing Participant/Room types extended, polling reused, errorHandler updated for Zod messages)

## Validation Notes

Two rounds of analysis completed. No remaining blockers.

### Issues found and fixed during review

| Issue | Severity | Fix |
|-------|----------|-----|
| `score > 0` check blocks multi-round guessing | HIGH | Replaced with `correctGuessersThisRound: string[]` on Room |
| `resolveWord` not exported (private function) | HIGH | Added explicit export requirement in T4.2 |
| GamePage has no polling, no navigation to /game | HIGH | Added T6.4 (LobbyPage redirect) + T6.5 (GamePage polling) |
| `errorHandler` swallows Zod custom error messages | HIGH | Added T2.1 to propagate first Zod issue message |
| No points-per-stroke cap | Medium | Added `z.array().max(1000)` + server-side guard |
| Canvas coordinate bounds not validated | Medium | Added `[0,800)` / `[0,600)` with `.lt()` in Zod schema |
| `.max(800)` inclusive vs spec exclusive `[0,800)` | Medium | Changed to `.lt(800)` |
| Unknown participantId not handled | Medium | Added validation in both guess and canvas endpoints |
| Guess response for silently-ignored submissions unspecified | Low | Specified both response shapes |
| Dedup case-sensitivity ambiguous | Low | Made explicitly case-insensitive |
| `createParticipant` not instructed to set `score: 0` | Low | Amended T2.4 |
| `GuessForm` hardcoded "Round 1" | Low | T6.2 now uses `room.currentRound` |

### All checks pass.
