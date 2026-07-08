import { act, renderHook } from "@testing-library/react-native";

import {
  DEFAULT_REST_SECONDS,
  calculateRemainingRestSeconds,
  formatRestTime,
  useRestTimer
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

describe("useRestTimer onComplete", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts running immediately with no separate trigger, and is not running before start() is called", async () => {
    const { result } = await renderHook(() => useRestTimer(10));

    expect(result.current.isRunning).toBe(false);

    await act(() => {
      result.current.start(10);
    });

    expect(result.current.isRunning).toBe(true);
  });

  it("calls onComplete once when the countdown naturally reaches zero", async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useRestTimer(5, onComplete));

    await act(() => {
      result.current.start(5);
    });

    await act(() => {
      jest.advanceTimersByTime(6_000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
  });

  it("calls onComplete immediately when skip() is called while running", async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useRestTimer(90, onComplete));

    await act(() => {
      result.current.start(90);
    });

    await act(() => {
      result.current.skip();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
  });

  it("does not call onComplete when skip() is called while not running", async () => {
    const onComplete = jest.fn();
    const { result } = await renderHook(() => useRestTimer(90, onComplete));

    await act(() => {
      result.current.skip();
    });

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("always invokes the latest onComplete passed on the most recent render", async () => {
    const firstOnComplete = jest.fn();
    const secondOnComplete = jest.fn();
    const { result, rerender } = await renderHook(
      ({ onComplete }: { onComplete: () => void }) => useRestTimer(90, onComplete),
      {
        initialProps: { onComplete: firstOnComplete }
      }
    );

    await act(() => {
      result.current.start(90);
    });

    await rerender({ onComplete: secondOnComplete });

    await act(() => {
      result.current.skip();
    });

    expect(firstOnComplete).not.toHaveBeenCalled();
    expect(secondOnComplete).toHaveBeenCalledTimes(1);
  });
});
