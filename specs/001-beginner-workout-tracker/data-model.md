# Data Model: Beginner Workout Tracker

## Overview

SQLite is the durable source of truth. Drizzle schema definitions and migrations
MUST match this model. All timestamps use ISO-8601 strings. IDs may be generated
as text UUIDs locally unless implementation chooses integer keys consistently
across all tables.

## Entities

### User

Represents the single local profile.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | text | yes | Primary key |
| name | text | yes | Non-empty, beginner-facing display name |
| bodyweight | real | yes | Greater than 0 |
| height | real | no | Optional profile metric |
| weight_unit | text | yes | `kg` or `lb` |
| experience_level | text | yes | Beginner-friendly enum such as `new`, `some_experience`, `returning` |
| goal | text | yes | User-selected primary goal |
| created_at | text | yes | ISO timestamp |

Relationships:
- User has many Workouts.
- User has many WorkoutSessions.

Validation:
- Exactly one active local user profile in v1.
- `weight_unit` controls bodyweight, set-log weight entry, and progress displays.

### MuscleGroup

Represents the app's beginner grouping for exercise browsing.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | text | yes | Primary key |
| name | text | yes | One of `chest`, `back`, `legs`, `shoulders`, `arms`, `core` |

Relationships:
- MuscleGroup has many Exercises.

Validation:
- Names are unique.
- wger categories/muscles are mapped into these six app groups during seeding.

### Exercise

Represents a preloaded library exercise.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | text | yes | Primary key |
| name | text | yes | Unique within v1 seed library |
| muscle_group_id | text | yes | References MuscleGroup |
| equipment | text | no | Plain label such as bodyweight, dumbbell, barbell |
| image_url | text | yes | Local bundled asset key/path for starter data; remote URL may be retained for attribution/re-cache |
| instructions | text | yes | Short beginner-readable instructions |
| is_warmup | integer boolean | yes | 1 when warmup-friendly |
| video_url | text | no | Optional wger video URL |
| source | text | no | `wger` for seeded exercises |
| source_id | text | no | wger exercise id or UUID when available |
| license_author | text | no | Attribution from wger image/exercise metadata |
| license_url | text | no | Source or object URL when available |

Relationships:
- Exercise belongs to one MuscleGroup.
- Exercise appears in many WorkoutExercises.
- Exercise appears in many completed SetLog snapshots through WorkoutExercise.

Validation:
- v1 seed library contains only exercises needed by the three sample workouts.
- Every exercise must show either a bundled image or a placeholder visual.

### Workout

Represents a reusable routine. Preloaded starter workouts are protected
templates with no user owner.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | text | yes | Primary key |
| name | text | yes | Non-empty |
| user_id | text | no | Null for protected preloaded sample templates |
| created_at | text | yes | ISO timestamp |
| is_template | integer boolean | yes | 1 for sample workouts |
| source_template_id | text | no | Set when copied from a sample workout |

Relationships:
- Workout belongs to User when custom.
- Workout has many WorkoutExercises.
- Workout has many WorkoutSessions.

Validation:
- Template workouts are not edited directly.
- Copying a template creates a user-owned Workout and child WorkoutExercises.

### WorkoutExercise

Represents an ordered exercise inside a workout.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | text | yes | Primary key |
| workout_id | text | yes | References Workout |
| exercise_id | text | yes | References Exercise |
| order_index | integer | yes | 0-based or 1-based, consistent app-wide |
| target_sets | integer | yes | Greater than 0 |
| target_rep_range_low | integer | yes | Greater than 0 |
| target_rep_range_high | integer | yes | Greater than or equal to low |
| target_rest_seconds | integer | yes | 0 or greater |
| superset_group_id | text | no | Nullable marker used to group workout exercises as a simple superset |

Relationships:
- WorkoutExercise belongs to Workout and Exercise.
- WorkoutExercise can have many SetLogs through sessions.

Validation:
- A workout cannot start with zero WorkoutExercises.
- Order is unique within a workout.

### WorkoutSession

Represents an active or completed instance of a workout.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | text | yes | Primary key |
| workout_id | text | yes | References Workout used to start session |
| user_id | text | yes | References User |
| started_at | text | yes | ISO timestamp |
| ended_at | text | no | Null while active |
| status | text | yes | `active`, `completed`, or `discarded` |
| workout_name_snapshot | text | yes | Name at session start/completion |

Relationships:
- WorkoutSession belongs to User and Workout.
- WorkoutSession has many SetLogs.

Validation:
- Only one resumable active session is allowed in v1.
- Completed sessions preserve original performed details.

State transitions:
- `active` -> `completed`
- `active` -> `discarded`
- `completed` and `discarded` are terminal states.

### SetLog

Represents one logged set in a workout session.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | text | yes | Primary key |
| session_id | text | yes | References WorkoutSession |
| workout_exercise_id | text | yes | References WorkoutExercise |
| set_number | integer | yes | Starts at 1 per workout exercise |
| reps | integer | yes | 0 or greater for attempted sets; completed working sets should be greater than 0 |
| weight | real | yes | 0 or greater in user's selected unit |
| effort_rpe | integer | yes | 1 through 10 |
| completed_at | text | yes | ISO timestamp |
| exercise_name_snapshot | text | yes | Name at logging/completion time |
| target_reps_snapshot | text | no | Target range label at logging/completion time |
| target_rest_seconds_snapshot | integer | no | Rest target at logging/completion time |

Relationships:
- SetLog belongs to WorkoutSession and WorkoutExercise.

Validation:
- `effort_rpe` must be between 1 and 10.
- `weight`, `reps`, and rest values cannot be negative.

### ExerciseProgress

Derived read model, not necessarily a table.

Fields:
- exercise_id
- exercise_name
- sessions: date, set_number, reps, weight, effort_rpe
- weight_points: date and representative logged weight values
- volume_by_session: sum of reps * weight for logged sets

Rules:
- Do not calculate or highlight highest weight or one-rep max in v1.
- Use completed session snapshots so history remains stable after edits.

## Seed Data

Required:
- 6 MuscleGroups.
- Exercises only for Full Body A/B/C sample workouts.
- 3 protected sample Workouts.
- WorkoutExercises with beginner-appropriate targets.
- Local image assets for every seeded Exercise, or explicit placeholders.

Seed source:
- wger public API data is transformed into app seed files during development.
- Runtime app startup loads bundled seed rows if no local seed version exists.

## Migration Strategy

- Use Drizzle migrations for schema creation and changes.
- Store a seed version so future app launches do not overwrite user-customized
  copies or completed history.
- Migrations must preserve completed session snapshots.
