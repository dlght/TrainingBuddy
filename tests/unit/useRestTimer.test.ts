import {
  DEFAULT_REST_SECONDS,
  calculateRemainingRestSeconds,
  formatRestTime
} from "@/features/sessions/useRestTimer";

describe("rest timer helpers", () => {
  it("defaults to 90 seconds and accounts for elapsed time", () => {
    expect(DEFAULT_REST_SECONDS).toBe(90);
    expect(
      calculateRemainingRestSeconds({
        durationSeconds: DEFAULT_REST_SECONDS,
        startedAtMs: 1_000,
        nowMs: 31_100
      })
    ).toBe(60);
  });

  it("never returns a negative remaining value", () => {
    expect(
      calculateRemainingRestSeconds({
        durationSeconds: 10,
        startedAtMs: 0,
        nowMs: 12_500
      })
    ).toBe(0);
  });

  it("formats timer text for display", () => {
    expect(formatRestTime(90)).toBe("01:30");
    expect(formatRestTime(5)).toBe("00:05");
  });
});
