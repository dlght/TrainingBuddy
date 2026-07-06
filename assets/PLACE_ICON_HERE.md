Place the provided app icon image here and name it `icon.png` (square PNG, recommended 1024x1024) and also copy it as `splash.png` (recommended 2048x1536 or at least 1200x900) for use as the splash screen.

Steps:

1. Save the attached image as `assets/icon.png` (1024×1024 PNG recommended).
2. Save a copy as `assets/splash.png` (2048×1536 recommended).
3. Rebuild or restart Expo: `npx expo start` and test on device or run `npx expo prebuild` for native builds.

Notes:
- `app.json` is already configured to use `./assets/icon.png` and `./assets/splash.png`.
- For Android adaptive icons, you can provide separate foreground/background images if desired.
- If you want me to generate resized icons/splash variants automatically, I can add a small script, but it requires the original PNG to be present in `assets/`.
