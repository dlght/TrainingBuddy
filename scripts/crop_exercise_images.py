from PIL import Image
import os

SRC_DIR = "assets"
OUT_DIR = "assets/seed-exercises/processed"

# (source_filename, exercise_id, left, top, right, bottom) - fractions of W/H
CROPS = [
    ("A1_Incline_Dumbbell_Press.png", "incline-dumbbell-press", 0.0, 0.20, 1.0, 1.0),
    ("A2_Barbell_Squat.png", "barbell-squat", 0.0, 0.20, 0.88, 1.0),
    ("A3_Chest_Supported_Row.png", "chest-supported-dumbbell-row", 0.0, 0.20, 0.87, 1.0),
    ("A4_Seated_Leg_Curl.png", "seated-leg-curl", 0.0, 0.20, 0.93, 1.0),
    ("A5A_Incline_DB_Curl.png", "dumbbell-incline-curl", 0.0, 0.0, 1.0, 1.0),
    ("A5B_Behind_Body_Cable_Curl.png", "behind-body-cable-curl", 0.0, 0.28, 0.90, 1.0),
    ("A6A_Overhead_DB_Ext.png", "dumbbell-overhead-triceps-extension", 0.0, 0.0, 1.0, 0.95),
    ("A6B_Rope_Overhead_Triceps_Ext.png", "rope-overhead-triceps-extension", 0.0, 0.20, 1.0, 1.0),
    ("B1_Bench_Press.png", "barbell-bench-press", 0.0, 0.37, 1.0, 1.0),
    ("B2_RDL.png", "romanian-deadlift", 0.0, 0.37, 0.95, 1.0),
    ("B3_Lat_Pulldown.png", "lat-pulldown", 0.0, 0.42, 0.88, 1.0),
    ("B4_Walking_Lunges.png", "walking-lunges", 0.0, 0.42, 0.85, 1.0),
    ("B5_Cable_Lateral_Raise.png", "behind-body-cable-lateral-raise", 0.0, 0.37, 1.0, 1.0),
    ("B6_Reverse_Crunch.png", "reverse-crunch", 0.0, 0.37, 1.0, 1.0),
    ("C1_Shoulder_Press.png", "seated-dumbbell-shoulder-press", 0.0, 0.35, 0.68, 1.0),
    ("C2_OneArm_Row.png", "one-arm-dumbbell-row", 0.0, 0.30, 0.45, 1.0),
    ("C3A_Hip_Thrust.png", "barbell-hip-thrust", 0.0, 0.40, 0.55, 1.0),
    ("C3B_Step_Up.png", "dumbbell-step-up", 0.0, 0.35, 0.42, 1.0),
    ("C4_Leg_Extension.png", "leg-extension", 0.0, 0.20, 0.43, 1.0),
    ("C5A_Cable_Chest_Fly.png", "seated-cable-chest-fly", 0.0, 0.35, 1.0, 1.0),
    ("C6_Standing_Calf_Raise.png", "standing-calf-raise", 0.0, 0.28, 0.76, 1.0),
    ("C7_Reverse_Cable_Fly.png", "reverse-cable-fly", 0.0, 0.28, 1.0, 1.0),
]

os.makedirs(OUT_DIR, exist_ok=True)

for filename, exercise_id, l, t, r, b in CROPS:
    im = Image.open(os.path.join(SRC_DIR, filename)).convert("RGB")
    w, h = im.size
    box = (int(l * w), int(t * h), int(r * w), int(b * h))
    cropped = im.crop(box)
    out_path = os.path.join(OUT_DIR, f"{exercise_id}.jpg")
    cropped.save(out_path, "JPEG", quality=90)
    print(f"{filename} {w}x{h} -> {out_path} {cropped.size}")
