<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Beginner-First Workout Logging
- Template principle 2 -> II. Offline-First Local Ownership
- Template principle 3 -> III. Expo, React Native, TypeScript, SQLite
- Template principle 4 -> IV. Simplicity Over Feature Breadth
- Template principle 5 -> V. Small, Testable Increments
Added sections:
- Product Constraints
- Development Workflow
Removed sections:
- Placeholder template guidance
Templates requiring updates:
- .specify/templates/plan-template.md: updated
- .specify/templates/spec-template.md: updated
- .specify/templates/tasks-template.md: updated
- .specify/templates/commands/*.md: not present
Follow-up TODOs: none
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

### II. Offline-First Local Ownership
Core tracking workflows MUST work without network access. Workout plans,
exercise history, session logs, and user preferences MUST be stored locally in
SQLite before any optional synchronization or external service is considered.
Features MUST define behavior for first launch, airplane mode, app restart, and
local data migration.

Rationale: A workout tracker is most useful when it remains reliable in gyms,
travel, and low-connectivity environments.

### III. Expo, React Native, TypeScript, SQLite
The app MUST be built with Expo, React Native, TypeScript, and SQLite unless a
constitution amendment explicitly changes the stack. Runtime code MUST prefer
typed domain models and simple data-access functions over untyped objects or
large abstraction layers. Native modules, cloud services, and platform-specific
code require documented justification in the implementation plan.

Rationale: A stable, narrow stack reduces setup friction and keeps the project
approachable for contributors.

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
is local-only functionality: create or choose a simple workout, log sets or
completion, review recent history, and keep data available across restarts.

Any feature that introduces accounts, remote sync, payments, social sharing,
coach dashboards, generated training plans, wearables, or advanced analytics
MUST be treated as non-default scope and justified against the simplicity and
offline-first principles before planning proceeds.

## Development Workflow

Feature specs MUST prioritize beginner user journeys and identify the smallest
MVP story that produces a useful logged workout or reviewable history. Plans
MUST pass the Constitution Check before research and again after design. Tasks
MUST keep Expo app structure, TypeScript typing, SQLite schema or migration
work, and offline validation visible as explicit work items.

Pull requests and implementation reviews MUST verify that the feature works
offline, preserves existing local data, fits the approved stack, and does not
add avoidable complexity. When a principle is intentionally violated, the plan
MUST document the violation, why it is necessary now, and the simpler
alternative that was rejected.

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
for offline behavior when persistence or workout logging is touched.

**Version**: 1.0.0 | **Ratified**: 2026-07-05 | **Last Amended**: 2026-07-05
