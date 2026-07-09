import { act, renderHook } from "@testing-library/react-native";

import { useElapsedSeconds } from "@/features/sessions/useElapsedSeconds";

const STARTED_AT = "2026-07-09T10:00:00.000Z";

describe("useElapsedSeconds", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(STARTED_AT));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts at zero when running begins at startedAt", async () => {
    const { result } = await renderHook(() => useElapsedSeconds(STARTED_AT, true));

    expect(result.current).toBe(0);
  });

  it("ticks once per second while running", async () => {
    const { result } = await renderHook(() => useElapsedSeconds(STARTED_AT, true));

    await act(() => {
      jest.advanceTimersByTime(3_000);
    });

    expect(result.current).toBe(3);
  });

  it("does not tick while not running", async () => {
    const { result } = await renderHook(() => useElapsedSeconds(STARTED_AT, false));

    await act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(result.current).toBe(0);
  });

  it("stops ticking once isRunning flips to false", async () => {
    const { result, rerender } = await renderHook(
      ({ isRunning }: { isRunning: boolean }) => useElapsedSeconds(STARTED_AT, isRunning),
      { initialProps: { isRunning: true } }
    );

    await act(() => {
      jest.advanceTimersByTime(2_000);
    });
    expect(result.current).toBe(2);

    await rerender({ isRunning: false });

    await act(() => {
      jest.advanceTimersByTime(5_000);
    });
    expect(result.current).toBe(2);
  });
});
