<!--
Sync Impact Report
Version change: 1.0.0 -> 2.0.0
Modified principles:
- II. Offline-First Local Ownership -> II. Cloud-Backed, Per-User Data Ownership
- III. Expo, React Native, TypeScript, SQLite -> III. Expo, React Native, TypeScript, Supabase
Added sections: none
Removed sections: none
Modified sections:
- Product Constraints: accounts and remote persistence are now default scope
  (no longer require case-by-case justification); fully offline operation is
  no longer guaranteed by default.
Templates requiring updates:
- .specify/templates/plan-template.md: updated
- .specify/templates/spec-template.md: updated
- .specify/templates/tasks-template.md: not yet reviewed against v2.0.0
Follow-up TODOs:
- Re-review tasks-template.md wording once spec 006 (accounts + cloud backend)
  ships, in case task phrasing still assumes local-only SQLite work items.
-->
# TrainingBuddy Constitution

## Core Principles

### I. Beginner-First Workout Logging
TrainingBuddy MUST make the next action obvious to someone new to structured
training. Every feature MUST use plain fitness language, avoid expert-only
concepts unless they are explained in context, and keep the primary workout
logging path short enough to complete during a real workout.

Rationale: The product exists to help beginners build consistency, not to
reward power users with dense configuration.

### II. Cloud-Backed, Per-User Data Ownership
Workout plans, exercise history, session logs, and user preferences MUST be
stored in the project's Supabase backend, scoped to an authenticated account
via Row Level Security so one user can never read or write another user's
data. Features MUST define explicit behavior for signed-out access, a lost or
slow network connection, and session expiry; a clear "can't reach the server"
state is required wherever full offline operation is not.

Rationale: Multiple people now use the app from their own accounts and
devices, so data must live somewhere all of a user's devices can reach, with
isolation enforced by the backend rather than trusted to client code. Full
offline support was deliberately deferred (see specs/006) to keep the backend
migration small; it may return as a later, explicitly-scoped enhancement.

### III. Expo, React Native, TypeScript, Supabase
The app MUST be built with Expo, React Native, TypeScript, and Supabase
(Postgres, Auth, Row Level Security) unless a constitution amendment
explicitly changes the stack. Runtime code MUST prefer typed domain models and
simple data-access functions over untyped objects or large abstraction
layers. The app MUST keep running unmodified inside standard Expo Go — no
custom native modules or EAS custom dev client requirement may be introduced
without a documented amendment, since that would require a paid Apple
Developer account this project does not have. Any additional native module,
custom backend server, or platform-specific code requires documented
justification in the implementation plan.

Rationale: Supabase (Postgres + Auth + RLS + auto-generated REST) satisfies
multi-user, parallel-access persistence without hosting or paying for a
bespoke server, and its client SDK is pure JS, keeping the app inside Expo Go.

### IV. Simplicity Over Feature Breadth
Each feature MUST deliver one beginner-visible outcome before adding optional
settings, analytics, social flows, gamification, or advanced training concepts.
Plans MUST reject or defer scope that increases navigation depth, setup time, or
data-model complexity without improving the beginner's first successful workout
log.

Rationale: The product wins by being easy to use repeatedly, not by having the
largest checklist of fitness features.

### V. Small, Testable Increments
Work MUST be sliced by independently testable user stories. Each story MUST
include an acceptance path for manual Expo validation and, where logic or data
persistence is involved, targeted automated tests for TypeScript functions,
SQLite persistence, or React Native behavior. Data migrations MUST include a
rollback or forward-safe strategy documented in the plan.

Rationale: Small verified increments protect offline data and keep development
steady as the app grows.

## Product Constraints

TrainingBuddy is a mobile app for beginner workout tracking. The default scope
is: sign in to a personal account, create or choose a simple workout, log sets
or completion, review recent history, and have that data available from any
device signed into the same account, backed by Supabase.

Accounts and Supabase-backed persistence are now default scope and do not
require case-by-case justification. Payments, social sharing, coach
dashboards, generated training plans, wearables, advanced analytics, or a
custom backend server beyond Supabase MUST still be treated as non-default
scope and justified against the simplicity principle before planning
proceeds. Reintroducing full offline support beyond a clear "offline" error
state likewise requires its own justified plan.

## Development Workflow

Feature specs MUST prioritize beginner user journeys and identify the smallest
MVP story that produces a useful logged workout or reviewable history. Plans
MUST pass the Constitution Check before research and again after design. Tasks
MUST keep Expo app structure, TypeScript typing, Supabase schema/RLS/migration
work, and Expo Go compatibility visible as explicit work items.

Pull requests and implementation reviews MUST verify that the feature enforces
per-user data isolation via RLS, surfaces a clear state when the network is
unavailable, fits the approved stack, keeps running inside standard Expo Go,
and does not add avoidable complexity. When a principle is intentionally
violated, the plan MUST document the violation, why it is necessary now, and
the simpler alternative that was rejected.

## Governance

This constitution supersedes conflicting project practices, templates, and
feature plans. Amendments require a documented change to this file, an updated
Sync Impact Report, and review of dependent Spec Kit templates for alignment.

Versioning follows semantic versioning:
- MAJOR for principle removals, incompatible redefinitions, or stack changes.
- MINOR for new principles, new required sections, or materially expanded
  governance.
- PATCH for clarifications, wording fixes, and non-semantic refinements.

Every feature plan MUST include a Constitution Check. Every task list MUST
preserve traceability to prioritized user stories and include validation tasks
for per-user data isolation and network-loss handling when persistence or
workout logging is touched.

**Version**: 2.0.0 | **Ratified**: 2026-07-05 | **Last Amended**: 2026-07-09
