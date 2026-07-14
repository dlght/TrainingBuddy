-- The 23 curated starter-workout exercises (seeded before the wger import in
-- spec 008) pointed at locally bundled images that were the wrong
-- resolution/aspect ratio. Repoints them at real wger.de photos, matching
-- `supabase/seed.sql`'s updated curated block so fresh resets and the
-- already-seeded hosted project agree. `on conflict do nothing` in seed.sql
-- means editing that file alone never touches rows already inserted here.
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1733/4ef77069-beb2-4504-a4f3-b181d5f35212.png', license_author = 'Tierrasverdes', license_url = '' where id = 'bodyweight-squat';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/16/Incline-press-1.png', license_author = 'Everkinetic', license_url = '' where id = 'incline-dumbbell-press';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1801/60043328-1cfb-4289-9865-aaf64d5aaa28.jpg', license_author = 'Workout Guru', license_url = '' where id = 'barbell-squat';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1283/e7262f70-7512-408a-8d00-4c499ef632fc.jpg', license_author = 'carlos3c', license_url = 'https://hivamf.tistory.com/entry/%EC%9D%B8%ED%81%B4%EB%9D%BC%EC%9D%B8-%EB%B2%A4%EC%B9%98-%EB%8D%A4%EB%B2%A8-%EB%A1%9C%EC%9A%B0Incline-Bench-Dumbbell-Row' where id = 'chest-supported-dumbbell-row';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/364/b318dde9-f5f2-489f-940a-cd864affb9e3.png', license_author = 'Franpol', license_url = '' where id = 'seated-leg-curl';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/81/Biceps-curl-1.png', license_author = 'Everkinetic', license_url = '' where id = 'dumbbell-incline-curl';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1336/ebf88217-df26-4ef7-94cb-f0c2220c6abe.webp', license_author = '', license_url = '' where id = 'dumbbell-overhead-triceps-extension';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/129/Standing-biceps-curl-1.png', license_author = 'Everkinetic', license_url = '' where id = 'behind-body-cable-curl';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1519/fab7f641-27d4-40b5-8edd-1a0a137bfd94.gif', license_author = 'benjamin.yildiz@proton.me', license_url = '' where id = 'rope-overhead-triceps-extension';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/192/Bench-press-1.png', license_author = 'Everkinetic', license_url = '' where id = 'barbell-bench-press';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1652/0306c8c0-70cc-45d4-92de-6fa72ceaa834.webp', license_author = 'AlucardEvil40', license_url = '' where id = 'romanian-deadlift';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1127/4942b7c0-6bda-4983-88e5-86547c3d445e.png', license_author = 'Franpol', license_url = '' where id = 'lat-pulldown';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/113/Walking-lunges-1.png', license_author = 'Everkinetic', license_url = '' where id = 'walking-lunges';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1378/7c1fcf34-fb7e-45e7-a0c1-51f296235315.jpg', license_author = 'carlos3c', license_url = 'https://commons.wikimedia.org/wiki/File:Girl_doing_one_arm_shoulder_raise.jpg' where id = 'behind-body-cable-lateral-raise';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/91/Crunches-1.png', license_author = '', license_url = '' where id = 'reverse-crunch';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1968/cd92e973-a0d9-4e5f-9011-5369012598d3.png', license_author = '', license_url = '' where id = 'seated-dumbbell-shoulder-press';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1186/1987a039-cf35-437e-bbdc-40c53dd7d053.jpg', license_author = 'anto.kreegyr', license_url = '' where id = 'one-arm-dumbbell-row';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1642/a81ad922-caf5-47f8-99b4-640cb0717436.webp', license_author = 'AlucardEvil40', license_url = '' where id = 'barbell-hip-thrust';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/981/f9377a7e-eb58-4cca-b805-2d36863aeb03.png', license_author = '', license_url = '' where id = 'dumbbell-step-up';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/369/78c915d1-e46d-4d30-8124-65d68664c3ef.png', license_author = 'Franpol', license_url = '' where id = 'leg-extension';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/1922/eb750ee5-3220-4128-aef1-5e2f1ccff40a.webp', license_author = 'shushu', license_url = '' where id = 'seated-cable-chest-fly';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/622/9a429bd0-afd3-4ad0-8043-e9beec901c81.jpeg', license_author = 'clafal', license_url = '' where id = 'standing-calf-raise';
update public.exercises set image_url = 'https://wger.de/media/exercise-images/822/74affc0d-03b6-4f33-b5f4-a822a2615f68.png', license_author = 'cshep442', license_url = '' where id = 'reverse-cable-fly';
