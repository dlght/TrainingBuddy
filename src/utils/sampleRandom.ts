/**
 * Returns up to `count` items from `items` in random order, using a
 * Fisher-Yates shuffle. `randomFn` is injectable so callers can pass a seeded
 * generator in tests instead of depending on the real Math.random.
 */
export function sampleRandom<T>(items: T[], count: number, randomFn: () => number = Math.random): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
