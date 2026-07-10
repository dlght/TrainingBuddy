update public.exercises set image_url = 'https://xchfgfceaxizeiqfrnjz.supabase.co/storage/v1/object/public/exercise-images/processed/' || id || '.jpg'
where id in (
  'incline-dumbbell-press','barbell-squat','chest-supported-dumbbell-row','seated-leg-curl',
  'dumbbell-incline-curl','behind-body-cable-curl','dumbbell-overhead-triceps-extension','rope-overhead-triceps-extension',
  'barbell-bench-press','romanian-deadlift','lat-pulldown','walking-lunges',
  'behind-body-cable-lateral-raise','reverse-crunch','seated-dumbbell-shoulder-press','one-arm-dumbbell-row',
  'barbell-hip-thrust','dumbbell-step-up','leg-extension','seated-cable-chest-fly',
  'standing-calf-raise','reverse-cable-fly'
)
returning id, image_url;
