import { formatDuration, getElapsedSeconds } from "@/features/sessions/duration";

describe("getElapsedSeconds", () => {
  it("computes whole seconds between two ISO timestamps", () => {
    expect(getElapsedSeconds("2026-07-09T10:00:00.000Z", "2026-07-09T10:00:42.000Z")).toBe(42);
  });

  it("computes elapsed time spanning hours", () => {
    expect(getElapsedSeconds("2026-07-09T10:00:00.000Z", "2026-07-09T11:05:30.000Z")).toBe(3930);
  });

  it("clamps a negative delta (reference before start) to zero", () => {
    expect(getElapsedSeconds("2026-07-09T10:00:00.000Z", "2026-07-09T09:00:00.000Z")).toBe(0);
  });

  it("returns zero for an invalid timestamp instead of NaN", () => {
    expect(getElapsedSeconds("not-a-date", "2026-07-09T10:00:00.000Z")).toBe(0);
  });

  it("returns zero when start and reference are identical", () => {
    expect(getElapsedSeconds("2026-07-09T10:00:00.000Z", "2026-07-09T10:00:00.000Z")).toBe(0);
  });
});

describe("formatDuration", () => {
  it("formats zero seconds as 0s", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats a sub-minute duration in seconds", () => {
    expect(formatDuration(45)).toBe("45s");
  });

  it("formats an exact minute", () => {
    expect(formatDuration(60)).toBe("1m 00s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(753)).toBe("12m 33s");
  });

  it("formats hours and minutes, dropping seconds", () => {
    expect(formatDuration(3900)).toBe("1h 05m");
  });

  it("formats a duration of exactly one hour", () => {
    expect(formatDuration(3600)).toBe("1h 00m");
  });

  it("treats negative input as zero", () => {
    expect(formatDuration(-5)).toBe("0s");
  });
});
