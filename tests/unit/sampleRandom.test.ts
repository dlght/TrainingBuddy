import { sampleRandom } from "@/utils/sampleRandom";

describe("sampleRandom", () => {
  it("returns at most `count` items", () => {
    const result = sampleRandom([1, 2, 3, 4, 5], 3, () => 0.5);

    expect(result).toHaveLength(3);
  });

  it("returns every item, in shuffled order, when count exceeds the list length", () => {
    const result = sampleRandom([1, 2, 3], 10, () => 0.5);

    expect(result).toHaveLength(3);
    expect([...result].sort()).toEqual([1, 2, 3]);
  });

  it("returns an empty array for an empty input list", () => {
    expect(sampleRandom([], 5, () => 0.5)).toEqual([]);
  });

  it("never duplicates or drops items", () => {
    const input = Array.from({ length: 20 }, (_, i) => i);
    const result = sampleRandom(input, 10, Math.random);

    expect(result).toHaveLength(10);
    expect(new Set(result).size).toBe(10);
    expect(result.every((value) => input.includes(value))).toBe(true);
  });

  it("is deterministic for a fixed random function", () => {
    const input = [1, 2, 3, 4, 5];
    const randomFn = () => 0;

    expect(sampleRandom(input, 5, randomFn)).toEqual(sampleRandom(input, 5, randomFn));
  });
});
