import type { Exercise, MuscleGroup } from "../../models/exercise";
import type { SeedWorkout, WorkoutExerciseSeed } from "../../models/workout";

export const PLACEHOLDER_EXERCISE_IMAGE = "assets/seed-exercises/placeholder.txt";

export const seedMuscleGroups: MuscleGroup[] = [
  { id: "arms", name: "arms" },
  { id: "back", name: "back" },
  { id: "chest", name: "chest" },
  { id: "core", name: "core" },
  { id: "legs", name: "legs" },
  { id: "shoulders", name: "shoulders" }
];

type SeedExerciseInput = Omit<
  Exercise,
  "imageUrl" | "videoUrl" | "source" | "sourceId" | "licenseAuthor" | "licenseUrl"
>;

function seedExercise(input: SeedExerciseInput): Exercise {
  return {
    ...input,
    imageUrl: PLACEHOLDER_EXERCISE_IMAGE,
    videoUrl: null,
    source: "wger",
    sourceId: `seed-${input.id}`,
    licenseAuthor: "wger exercise contributors",
    licenseUrl: "https://wger.de/"
  };
}

function target(
  exerciseId: string,
  orderIndex: number,
  targetSets: number,
  targetRepRangeLow: number,
  targetRepRangeHigh: number,
  targetRestSeconds: number,
  targetWeight: number | null = null
): WorkoutExerciseSeed {
  return {
    exerciseId,
    orderIndex,
    targetSets,
    targetRepRangeLow,
    targetRepRangeHigh,
    targetRestSeconds,
    targetWeight,
    supersetGroupId: null
  };
}

export const seedExercises: Exercise[] = [
  seedExercise({
    id: "bodyweight-squat",
    name: "Bodyweight Squat",
    muscleGroupId: "legs",
    equipment: "bodyweight",
    instructions: "Stand tall, sit your hips back, bend your knees, then stand up with control.",
    isWarmup: true
  }),
  seedExercise({
    id: "incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    muscleGroupId: "chest",
    equipment: "dumbbell",
    instructions: "Perform compound warm-up sets. Choose bench angle that doesn't stress shoulders. Neutral grip is optional. Retract shoulders throughout movement.",
    isWarmup: false
  }),
  seedExercise({
    id: "barbell-squat",
    name: "Barbell Squat",
    muscleGroupId: "legs",
    equipment: "barbell",
    instructions: "Perform compound warm-up sets. Elevate heels if ankle mobility limits squat depth.",
    isWarmup: false
  }),
  seedExercise({
    id: "chest-supported-dumbbell-row",
    name: "Chest Supported Dumbbell Row",
    muscleGroupId: "back",
    equipment: "dumbbell",
    instructions: "Retract shoulder blades during pull. Stretch fully at bottom. Avoid excessive biceps involvement. Last set: optional 3-5 partial reps after failure.",
    isWarmup: false
  }),
  seedExercise({
    id: "seated-leg-curl",
    name: "Seated Leg Curl",
    muscleGroupId: "legs",
    equipment: "machine",
    instructions: "Keep hips pressed into seat. Control the lowering phase. Squeeze hamstrings at top.",
    isWarmup: false
  }),
  seedExercise({
    id: "dumbbell-incline-curl",
    name: "Dumbbell Incline Curl",
    muscleGroupId: "arms",
    equipment: "dumbbell",
    instructions: "Set bench to 45-60 degrees. Curl dumbbells toward shoulders, then lower slowly. Keep elbows stationary.",
    isWarmup: false
  }),
  seedExercise({
    id: "dumbbell-overhead-triceps-extension",
    name: "Dumbbell Overhead Triceps Extension",
    muscleGroupId: "arms",
    equipment: "dumbbell",
    instructions: "Hold one dumbbell with both hands overhead. Lower behind head, then extend arms upward. Keep elbows close to head.",
    isWarmup: false
  }),
  seedExercise({
    id: "behind-body-cable-curl",
    name: "Behind-the-Body Cable Curl",
    muscleGroupId: "arms",
    equipment: "cable",
    instructions: "Stand facing away from cable machine. Curl handles toward shoulders, then lower with control.",
    isWarmup: false
  }),
  seedExercise({
    id: "rope-overhead-triceps-extension",
    name: "Rope Overhead Triceps Extension",
    muscleGroupId: "arms",
    equipment: "cable",
    instructions: "Face away from cable machine. Hold rope overhead, extend arms, then return slowly. Keep elbows stationary.",
    isWarmup: false
  }),
  seedExercise({
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    muscleGroupId: "chest",
    equipment: "barbell",
    instructions: "Perform compound warm-up sets. Lower bar to mid-chest, then press upward. Keep feet flat on floor.",
    isWarmup: false
  }),
  seedExercise({
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    muscleGroupId: "legs",
    equipment: "barbell",
    instructions: "Keep knees slightly bent. Hinge at hips, lower bar while keeping back straight, then return to standing.",
    isWarmup: false
  }),
  seedExercise({
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscleGroupId: "back",
    equipment: "cable",
    instructions: "Pull bar down to upper chest. Lean back slightly. Control the return. Focus on lats.",
    isWarmup: false
  }),
  seedExercise({
    id: "walking-lunges",
    name: "Walking Lunges",
    muscleGroupId: "legs",
    equipment: "bodyweight",
    instructions: "Step forward, lower hips until both knees bend 90 degrees, then step forward with other leg. Keep torso upright.",
    isWarmup: false
  }),
  seedExercise({
    id: "behind-body-cable-lateral-raise",
    name: "Behind-the-Body Cable Lateral Raise",
    muscleGroupId: "shoulders",
    equipment: "cable",
    instructions: "Stand facing away from cable. Raise arms to sides until parallel to floor. Control the lowering phase.",
    isWarmup: false
  }),
  seedExercise({
    id: "reverse-crunch",
    name: "Reverse Crunch",
    muscleGroupId: "core",
    equipment: "bodyweight",
    instructions: "Lie on back, lift knees toward chest, curl hips off floor, then lower slowly. Keep lower back pressed to floor.",
    isWarmup: false
  }),
  seedExercise({
    id: "seated-dumbbell-shoulder-press",
    name: "Seated Dumbbell Shoulder Press",
    muscleGroupId: "shoulders",
    equipment: "dumbbell",
    instructions: "Dumbbells preferred over barbell. Bench slightly reclined. Press with elbows flared. Lower dumbbells beside shoulders.",
    isWarmup: false
  }),
  seedExercise({
    id: "one-arm-dumbbell-row",
    name: "One-Arm Dumbbell Row",
    muscleGroupId: "back",
    equipment: "dumbbell",
    instructions: "Pull elbow toward hip. Keep forearm vertical. Avoid torso rotation. Last set: optional partial reps after failure.",
    isWarmup: false
  }),
  seedExercise({
    id: "barbell-hip-thrust",
    name: "Barbell Hip Thrust",
    muscleGroupId: "legs",
    equipment: "barbell",
    instructions: "Keep back neutral. Brace core. Squeeze glutes at top. Alternative: Dumbbell Step-Up.",
    isWarmup: false
  }),
  seedExercise({
    id: "dumbbell-step-up",
    name: "Dumbbell Step-Up",
    muscleGroupId: "legs",
    equipment: "dumbbell",
    instructions: "Lean slightly forward and alternate legs. Step onto box, drive through heel to stand tall.",
    isWarmup: false
  }),
  seedExercise({
    id: "leg-extension",
    name: "Leg Extension",
    muscleGroupId: "legs",
    equipment: "machine",
    instructions: "Lean back if machine allows for greater rectus femoris stretch. Extend legs fully, then lower with control.",
    isWarmup: false
  }),
  seedExercise({
    id: "seated-cable-chest-fly",
    name: "Seated Cable Chest Fly",
    muscleGroupId: "chest",
    equipment: "cable",
    instructions: "Foam pad behind back increases chest stretch. Alternative: Pec Deck. Last set: optional partial reps after failure.",
    isWarmup: false
  }),
  seedExercise({
    id: "standing-calf-raise",
    name: "Standing Calf Raise",
    muscleGroupId: "legs",
    equipment: "machine",
    instructions: "Pause at bottom for stretch. Rise onto balls of feet, squeeze calves at top.",
    isWarmup: false
  }),
  seedExercise({
    id: "reverse-cable-fly",
    name: "Reverse Cable Fly",
    muscleGroupId: "shoulders",
    equipment: "cable",
    instructions: "Cables slightly above shoulder height. Start with arms crossed for deeper stretch. Pull arms apart and back.",
    isWarmup: false
  })
];

export const sampleWorkouts: SeedWorkout[] = [
  {
    id: "workout-a",
    name: "Full Body A",
    exercises: [
      target("bodyweight-squat", 0, 2, 10, 15, 45, null),
      target("incline-dumbbell-press", 1, 3, 8, 12, 90, 12),
      target("barbell-squat", 2, 3, 6, 8, 120, 40),
      target("chest-supported-dumbbell-row", 3, 3, 8, 10, 90, 14),
      target("seated-leg-curl", 4, 3, 10, 15, 60, 25),
      target("dumbbell-incline-curl", 5, 3, 10, 15, 45, 8),
      target("dumbbell-overhead-triceps-extension", 6, 3, 10, 15, 45, 10)
    ]
  },
  {
    id: "workout-b",
    name: "Full Body B",
    exercises: [
      target("barbell-bench-press", 0, 3, 6, 8, 120, 40),
      target("romanian-deadlift", 1, 3, 8, 10, 90, 50),
      target("lat-pulldown", 2, 3, 8, 12, 90, 35),
      target("walking-lunges", 3, 3, 10, 12, 60, null),
      target("behind-body-cable-lateral-raise", 4, 3, 12, 15, 45, 5),
      target("reverse-crunch", 5, 3, 12, 15, 45, null)
    ]
  },
  {
    id: "workout-c",
    name: "Full Body C",
    exercises: [
      target("seated-dumbbell-shoulder-press", 0, 3, 8, 12, 90, 10),
      target("one-arm-dumbbell-row", 1, 3, 8, 12, 90, 14),
      target("barbell-hip-thrust", 2, 3, 10, 15, 90, 40),
      target("leg-extension", 3, 3, 10, 15, 60, 25),
      target("seated-cable-chest-fly", 4, 3, 10, 15, 60, 15),
      target("standing-calf-raise", 5, 3, 10, 15, 45, 30),
      target("reverse-cable-fly", 6, 3, 10, 15, 45, 5)
    ]
  }
];

export const starterSeedData = {
  muscleGroups: seedMuscleGroups,
  exercises: seedExercises,
  workouts: sampleWorkouts
};
