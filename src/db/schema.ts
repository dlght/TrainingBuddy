import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bodyweight: real("bodyweight").notNull(),
  height: real("height"),
  weightUnit: text("weight_unit").notNull(),
  experienceLevel: text("experience_level").notNull(),
  goal: text("goal").notNull(),
  createdAt: text("created_at").notNull()
});

export const muscleGroups = sqliteTable("muscle_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull()
}, (table) => [
  uniqueIndex("muscle_groups_name_unique").on(table.name)
]);

export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroupId: text("muscle_group_id")
    .notNull()
    .references(() => muscleGroups.id, { onDelete: "restrict" }),
  equipment: text("equipment"),
  imageUrl: text("image_url").notNull(),
  instructions: text("instructions").notNull(),
  isWarmup: integer("is_warmup", { mode: "boolean" }).notNull(),
  videoUrl: text("video_url"),
  source: text("source"),
  sourceId: text("source_id"),
  licenseAuthor: text("license_author"),
  licenseUrl: text("license_url")
}, (table) => [
  uniqueIndex("exercises_name_unique").on(table.name),
  index("exercises_muscle_group_idx").on(table.muscleGroupId),
  index("exercises_source_idx").on(table.source, table.sourceId)
]);

export const workouts = sqliteTable("workouts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
  isTemplate: integer("is_template", { mode: "boolean" }).notNull(),
  sourceTemplateId: text("source_template_id"),
  isFavourite: integer("is_favourite", { mode: "boolean" }).notNull().default(false)
}, (table) => [
  index("workouts_user_idx").on(table.userId),
  index("workouts_template_idx").on(table.isTemplate),
  index("workouts_source_template_idx").on(table.sourceTemplateId),
  index("workouts_favourite_idx").on(table.isFavourite)
]);

export const workoutExercises = sqliteTable("workout_exercises", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "restrict" }),
  orderIndex: integer("order_index").notNull(),
  targetSets: integer("target_sets").notNull(),
  targetRepRangeLow: integer("target_rep_range_low").notNull(),
  targetRepRangeHigh: integer("target_rep_range_high").notNull(),
  targetRestSeconds: integer("target_rest_seconds").notNull(),
  targetWeight: real("target_weight"),
  supersetGroupId: text("superset_group_id")
}, (table) => [
  uniqueIndex("workout_exercises_workout_order_unique").on(table.workoutId, table.orderIndex),
  index("workout_exercises_workout_idx").on(table.workoutId),
  index("workout_exercises_exercise_idx").on(table.exerciseId)
]);

export const workoutExerciseSetPlans = sqliteTable("workout_exercise_set_plans", {
  id: text("id").primaryKey(),
  workoutExerciseId: text("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weight: real("weight")
}, (table) => [
  uniqueIndex("workout_exercise_set_plans_unique").on(table.workoutExerciseId, table.setNumber),
  index("workout_exercise_set_plans_workout_exercise_idx").on(table.workoutExerciseId)
]);

export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "restrict" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: text("started_at").notNull(),
  endedAt: text("ended_at"),
  status: text("status").notNull(),
  workoutNameSnapshot: text("workout_name_snapshot").notNull()
}, (table) => [
  index("workout_sessions_user_status_idx").on(table.userId, table.status),
  index("workout_sessions_workout_idx").on(table.workoutId)
]);

export const setLogs = sqliteTable("set_logs", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => workoutSessions.id, { onDelete: "cascade" }),
  workoutExerciseId: text("workout_exercise_id")
    .notNull()
    .references(() => workoutExercises.id, { onDelete: "restrict" }),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weight: real("weight"),
  completedAt: text("completed_at").notNull(),
  exerciseNameSnapshot: text("exercise_name_snapshot").notNull(),
  targetRepsSnapshot: text("target_reps_snapshot"),
  targetRestSecondsSnapshot: integer("target_rest_seconds_snapshot")
}, (table) => [
  index("set_logs_session_idx").on(table.sessionId),
  index("set_logs_workout_exercise_idx").on(table.workoutExerciseId)
]);

export const seedVersions = sqliteTable("seed_versions", {
  id: text("id").primaryKey(),
  appliedAt: text("applied_at").notNull()
});

export const schema = {
  users,
  muscleGroups,
  exercises,
  workouts,
  workoutExercises,
  workoutExerciseSetPlans,
  workoutSessions,
  setLogs,
  seedVersions
};

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type MuscleGroupRow = typeof muscleGroups.$inferSelect;
export type NewMuscleGroupRow = typeof muscleGroups.$inferInsert;
export type ExerciseRow = typeof exercises.$inferSelect;
export type NewExerciseRow = typeof exercises.$inferInsert;
export type WorkoutRow = typeof workouts.$inferSelect;
export type NewWorkoutRow = typeof workouts.$inferInsert;
export type WorkoutExerciseRow = typeof workoutExercises.$inferSelect;
export type NewWorkoutExerciseRow = typeof workoutExercises.$inferInsert;
export type WorkoutExerciseSetPlanRow = typeof workoutExerciseSetPlans.$inferSelect;
export type NewWorkoutExerciseSetPlanRow = typeof workoutExerciseSetPlans.$inferInsert;
export type WorkoutSessionRow = typeof workoutSessions.$inferSelect;
export type NewWorkoutSessionRow = typeof workoutSessions.$inferInsert;
export type SetLogRow = typeof setLogs.$inferSelect;
export type NewSetLogRow = typeof setLogs.$inferInsert;
