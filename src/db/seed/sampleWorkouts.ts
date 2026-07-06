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
  targetRestSeconds: number
): WorkoutExerciseSeed {
  return {
    exerciseId,
    orderIndex,
    targetSets,
    targetRepRangeLow,
    targetRepRangeHigh,
    targetRestSeconds,
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
    id: "incline-push-up",
    name: "Incline Push-Up",
    muscleGroupId: "chest",
    equipment: "bench",
    instructions: "Place your hands on a stable bench, keep your body straight, lower your chest, then press away.",
    isWarmup: false
  }),
  seedExercise({
    id: "one-arm-dumbbell-row",
    name: "One-Arm Dumbbell Row",
    muscleGroupId: "back",
    equipment: "dumbbell",
    instructions: "Support one hand on a bench, pull the dumbbell toward your ribs, then lower slowly.",
    isWarmup: false
  }),
  seedExercise({
    id: "glute-bridge",
    name: "Glute Bridge",
    muscleGroupId: "legs",
    equipment: "bodyweight",
    instructions: "Lie on your back with knees bent, squeeze your glutes, lift your hips, then lower with control.",
    isWarmup: true
  }),
  seedExercise({
    id: "dead-bug",
    name: "Dead Bug",
    muscleGroupId: "core",
    equipment: "bodyweight",
    instructions: "Brace your core, slowly lower opposite arm and leg, then return without arching your back.",
    isWarmup: true
  }),
  seedExercise({
    id: "standing-calf-raise",
    name: "Standing Calf Raise",
    muscleGroupId: "legs",
    equipment: "bodyweight",
    instructions: "Stand tall, rise onto the balls of your feet, pause briefly, then lower your heels slowly.",
    isWarmup: false
  }),
  seedExercise({
    id: "dumbbell-floor-press",
    name: "Dumbbell Floor Press",
    muscleGroupId: "chest",
    equipment: "dumbbell",
    instructions: "Lie on the floor, press the dumbbells above your chest, then lower until your upper arms touch down.",
    isWarmup: false
  }),
  seedExercise({
    id: "suitcase-carry",
    name: "Suitcase Carry",
    muscleGroupId: "core",
    equipment: "dumbbell",
    instructions: "Hold one dumbbell at your side, keep your ribs stacked, and walk without leaning.",
    isWarmup: false
  }),
  seedExercise({
    id: "reverse-lunge",
    name: "Reverse Lunge",
    muscleGroupId: "legs",
    equipment: "bodyweight",
    instructions: "Step one foot back, lower until both knees bend, then push through the front foot to stand.",
    isWarmup: false
  }),
  seedExercise({
    id: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    muscleGroupId: "shoulders",
    equipment: "dumbbell",
    instructions: "Start dumbbells at shoulder height, press overhead, then lower until your elbows are controlled.",
    isWarmup: false
  }),
  seedExercise({
    id: "band-pull-apart",
    name: "Band Pull-Apart",
    muscleGroupId: "back",
    equipment: "resistance band",
    instructions: "Hold a band at chest height, pull it apart by squeezing your shoulder blades, then return slowly.",
    isWarmup: true
  }),
  seedExercise({
    id: "front-plank",
    name: "Front Plank",
    muscleGroupId: "core",
    equipment: "bodyweight",
    instructions: "Brace your core on forearms and toes, keep a straight line, and breathe steadily.",
    isWarmup: false
  }),
  seedExercise({
    id: "dumbbell-romanian-deadlift",
    name: "Dumbbell Romanian Deadlift",
    muscleGroupId: "legs",
    equipment: "dumbbell",
    instructions: "Hold dumbbells in front, hinge your hips back with a soft knee bend, then stand tall.",
    isWarmup: false
  }),
  seedExercise({
    id: "step-up",
    name: "Step-Up",
    muscleGroupId: "legs",
    equipment: "bench",
    instructions: "Place one foot on a stable step, drive through that foot to stand tall, then step down carefully.",
    isWarmup: false
  }),
  seedExercise({
    id: "side-plank",
    name: "Side Plank",
    muscleGroupId: "core",
    equipment: "bodyweight",
    instructions: "Support yourself on one forearm, stack your feet, lift your hips, and keep your torso long.",
    isWarmup: false
  }),
  seedExercise({
    id: "dumbbell-hammer-curl",
    name: "Dumbbell Hammer Curl",
    muscleGroupId: "arms",
    equipment: "dumbbell",
    instructions: "Keep palms facing each other, curl the dumbbells without swinging, then lower slowly.",
    isWarmup: false
  }),
  seedExercise({
    id: "goblet-squat",
    name: "Goblet Squat",
    muscleGroupId: "legs",
    equipment: "dumbbell",
    instructions: "Hold a dumbbell at your chest, squat between your knees, then stand with control.",
    isWarmup: false
  }),
  seedExercise({
    id: "chair-dip",
    name: "Chair Dip",
    muscleGroupId: "arms",
    equipment: "bench",
    instructions: "Hold the edge of a stable bench, bend your elbows, then press back up without shrugging.",
    isWarmup: false
  }),
  seedExercise({
    id: "dumbbell-curl",
    name: "Dumbbell Curl",
    muscleGroupId: "arms",
    equipment: "dumbbell",
    instructions: "Keep your elbows near your sides, curl the dumbbells up, then lower them slowly.",
    isWarmup: false
  }),
  seedExercise({
    id: "bird-dog",
    name: "Bird Dog",
    muscleGroupId: "core",
    equipment: "bodyweight",
    instructions: "From hands and knees, reach opposite arm and leg long, pause, then return with control.",
    isWarmup: true
  }),
  seedExercise({
    id: "hip-hinge-drill",
    name: "Hip Hinge Drill",
    muscleGroupId: "legs",
    equipment: "bodyweight",
    instructions: "Place hands on your hips, push your hips back while keeping your back long, then stand tall.",
    isWarmup: true
  }),
  seedExercise({
    id: "wall-push-up",
    name: "Wall Push-Up",
    muscleGroupId: "chest",
    equipment: "bodyweight",
    instructions: "Place your hands on a wall, lower your chest toward it, then press back to the start.",
    isWarmup: true
  }),
  seedExercise({
    id: "seated-band-row",
    name: "Seated Band Row",
    muscleGroupId: "back",
    equipment: "resistance band",
    instructions: "Sit tall, loop a band around your feet, pull your elbows back, then return with control.",
    isWarmup: false
  }),
  seedExercise({
    id: "pallof-press",
    name: "Pallof Press",
    muscleGroupId: "core",
    equipment: "resistance band",
    instructions: "Stand side-on to a band anchor, press the band forward, pause, then bring it back to your chest.",
    isWarmup: false
  })
];

export const sampleWorkouts: SeedWorkout[] = [
  {
    id: "full-body-a",
    name: "Full Body A",
    exercises: [
      target("bodyweight-squat", 0, 2, 8, 12, 60),
      target("incline-push-up", 1, 2, 6, 10, 60),
      target("one-arm-dumbbell-row", 2, 2, 8, 12, 60),
      target("glute-bridge", 3, 2, 10, 15, 45),
      target("dead-bug", 4, 2, 6, 8, 30),
      target("standing-calf-raise", 5, 2, 10, 15, 45),
      target("dumbbell-floor-press", 6, 2, 8, 12, 60),
      target("suitcase-carry", 7, 2, 20, 30, 45)
    ]
  },
  {
    id: "full-body-b",
    name: "Full Body B",
    exercises: [
      target("reverse-lunge", 0, 2, 6, 10, 60),
      target("dumbbell-shoulder-press", 1, 2, 8, 12, 60),
      target("band-pull-apart", 2, 2, 10, 15, 45),
      target("front-plank", 3, 2, 20, 30, 45),
      target("dumbbell-romanian-deadlift", 4, 2, 8, 12, 75),
      target("step-up", 5, 2, 8, 10, 60),
      target("side-plank", 6, 2, 15, 25, 45),
      target("dumbbell-hammer-curl", 7, 2, 8, 12, 45)
    ]
  },
  {
    id: "full-body-c",
    name: "Full Body C",
    exercises: [
      target("goblet-squat", 0, 2, 8, 12, 75),
      target("chair-dip", 1, 2, 6, 10, 60),
      target("dumbbell-curl", 2, 2, 8, 12, 45),
      target("bird-dog", 3, 2, 6, 8, 30),
      target("hip-hinge-drill", 4, 2, 8, 12, 45),
      target("wall-push-up", 5, 2, 8, 12, 45),
      target("seated-band-row", 6, 2, 10, 15, 60),
      target("pallof-press", 7, 2, 8, 12, 45)
    ]
  }
];

export const starterSeedData = {
  muscleGroups: seedMuscleGroups,
  exercises: seedExercises,
  workouts: sampleWorkouts
};
