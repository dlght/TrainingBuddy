import { RATING_OPTIONS, getEffortRatingMeta } from "@/features/sessions/effortRating";

describe("RATING_OPTIONS", () => {
  it("defines exactly the 5 specified levels in order", () => {
    expect(RATING_OPTIONS.map((option) => `${option.value} ${option.label}`)).toEqual([
      "1 In my sleep",
      "2 Could do more",
      "3 Right there",
      "4 Almost couldn't do it",
      "5 Impossible"
    ]);
  });
});

describe("getEffortRatingMeta", () => {
  it.each(RATING_OPTIONS)("returns the label and emoji for rating $value", (option) => {
    expect(getEffortRatingMeta(option.value)).toEqual({ label: option.label, emoji: option.emoji });
  });

  it("returns a not-rated result for null", () => {
    expect(getEffortRatingMeta(null)).toEqual({ label: "Not rated", emoji: "—" });
  });

  it("returns a not-rated result for undefined", () => {
    expect(getEffortRatingMeta(undefined)).toEqual({ label: "Not rated", emoji: "—" });
  });

  it("returns a not-rated result for an out-of-range value", () => {
    expect(getEffortRatingMeta(9)).toEqual({ label: "Not rated", emoji: "—" });
  });
});
