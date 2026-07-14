import { isRatioBadgeAchieved } from "@/features/challenges/bodyweightRatio";

describe("isRatioBadgeAchieved", () => {
  it("is never achieved (not an error) when bodyweight is missing", () => {
    expect(isRatioBadgeAchieved(null, 100, 1)).toBe(false);
  });

  it("is never achieved (not an error) when there is no PR yet for the exercise", () => {
    expect(isRatioBadgeAchieved(70, undefined, 1)).toBe(false);
  });

  it("achieves exactly at the threshold", () => {
    expect(isRatioBadgeAchieved(70, 70, 1)).toBe(true);
  });

  it("does not achieve just under the threshold", () => {
    expect(isRatioBadgeAchieved(70, 69, 1)).toBe(false);
  });

  it("applies the multiplier", () => {
    expect(isRatioBadgeAchieved(70, 104, 1.5)).toBe(false);
    expect(isRatioBadgeAchieved(70, 105, 1.5)).toBe(true);
  });
});
