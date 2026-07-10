import type { ImageSourcePropType } from "react-native";

/**
 * Bundled photos for the curated sample-workout exercises, keyed by the same
 * `assets/seed-exercises/processed/<id>.jpg` path stored in `exercises.image_url`.
 * Metro requires string-literal `require` calls, so this map can't be generated
 * dynamically from the file list.
 */
export const exerciseLocalImages: Record<string, ImageSourcePropType> = {
  "assets/seed-exercises/processed/incline-dumbbell-press.jpg": require("../../../assets/seed-exercises/processed/incline-dumbbell-press.jpg"),
  "assets/seed-exercises/processed/barbell-squat.jpg": require("../../../assets/seed-exercises/processed/barbell-squat.jpg"),
  "assets/seed-exercises/processed/chest-supported-dumbbell-row.jpg": require("../../../assets/seed-exercises/processed/chest-supported-dumbbell-row.jpg"),
  "assets/seed-exercises/processed/seated-leg-curl.jpg": require("../../../assets/seed-exercises/processed/seated-leg-curl.jpg"),
  "assets/seed-exercises/processed/dumbbell-incline-curl.jpg": require("../../../assets/seed-exercises/processed/dumbbell-incline-curl.jpg"),
  "assets/seed-exercises/processed/behind-body-cable-curl.jpg": require("../../../assets/seed-exercises/processed/behind-body-cable-curl.jpg"),
  "assets/seed-exercises/processed/dumbbell-overhead-triceps-extension.jpg": require("../../../assets/seed-exercises/processed/dumbbell-overhead-triceps-extension.jpg"),
  "assets/seed-exercises/processed/rope-overhead-triceps-extension.jpg": require("../../../assets/seed-exercises/processed/rope-overhead-triceps-extension.jpg"),
  "assets/seed-exercises/processed/barbell-bench-press.jpg": require("../../../assets/seed-exercises/processed/barbell-bench-press.jpg"),
  "assets/seed-exercises/processed/romanian-deadlift.jpg": require("../../../assets/seed-exercises/processed/romanian-deadlift.jpg"),
  "assets/seed-exercises/processed/lat-pulldown.jpg": require("../../../assets/seed-exercises/processed/lat-pulldown.jpg"),
  "assets/seed-exercises/processed/walking-lunges.jpg": require("../../../assets/seed-exercises/processed/walking-lunges.jpg"),
  "assets/seed-exercises/processed/behind-body-cable-lateral-raise.jpg": require("../../../assets/seed-exercises/processed/behind-body-cable-lateral-raise.jpg"),
  "assets/seed-exercises/processed/reverse-crunch.jpg": require("../../../assets/seed-exercises/processed/reverse-crunch.jpg"),
  "assets/seed-exercises/processed/seated-dumbbell-shoulder-press.jpg": require("../../../assets/seed-exercises/processed/seated-dumbbell-shoulder-press.jpg"),
  "assets/seed-exercises/processed/one-arm-dumbbell-row.jpg": require("../../../assets/seed-exercises/processed/one-arm-dumbbell-row.jpg"),
  "assets/seed-exercises/processed/barbell-hip-thrust.jpg": require("../../../assets/seed-exercises/processed/barbell-hip-thrust.jpg"),
  "assets/seed-exercises/processed/dumbbell-step-up.jpg": require("../../../assets/seed-exercises/processed/dumbbell-step-up.jpg"),
  "assets/seed-exercises/processed/leg-extension.jpg": require("../../../assets/seed-exercises/processed/leg-extension.jpg"),
  "assets/seed-exercises/processed/seated-cable-chest-fly.jpg": require("../../../assets/seed-exercises/processed/seated-cable-chest-fly.jpg"),
  "assets/seed-exercises/processed/standing-calf-raise.jpg": require("../../../assets/seed-exercises/processed/standing-calf-raise.jpg"),
  "assets/seed-exercises/processed/reverse-cable-fly.jpg": require("../../../assets/seed-exercises/processed/reverse-cable-fly.jpg")
};
