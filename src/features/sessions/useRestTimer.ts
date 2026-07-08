import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

export const DEFAULT_REST_SECONDS = 90;

export type RestTimerCalculationInput = {
  durationSeconds: number;
  startedAtMs: number;
  nowMs: number;
};

export function calculateRemainingRestSeconds({
  durationSeconds,
  startedAtMs,
  nowMs
}: RestTimerCalculationInput): number {
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));

  return Math.max(0, durationSeconds - elapsedSeconds);
}

export function formatRestTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function useRestTimer(initialDurationSeconds = DEFAULT_REST_SECONDS, onComplete?: () => void) {
  const [durationSeconds, setDurationSeconds] = useState(initialDurationSeconds);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const remainingSeconds = useMemo(() => {
    if (startedAtMs === null) {
      return durationSeconds;
    }

    return calculateRemainingRestSeconds({
      durationSeconds,
      startedAtMs,
      nowMs
    });
  }, [durationSeconds, nowMs, startedAtMs]);

  const isRunning = startedAtMs !== null && remainingSeconds > 0;

  useEffect(() => {
    if (startedAtMs === null) {
      return undefined;
    }

    let intervalId: ReturnType<typeof setInterval>;

    const updateNow = () => {
      const currentNowMs = Date.now();

      setNowMs(currentNowMs);

      if (
        calculateRemainingRestSeconds({
          durationSeconds,
          startedAtMs,
          nowMs: currentNowMs
        }) === 0
      ) {
        // Stop the interval immediately rather than waiting for the setStartedAtMs(null)
        // update to re-run this effect, so onComplete cannot fire more than once for a
        // single countdown even if a tick lands before React re-renders.
        clearInterval(intervalId);
        setStartedAtMs(null);
        onCompleteRef.current?.();
      }
    };

    intervalId = setInterval(updateNow, 1000);
    const subscription = AppState.addEventListener("change", () => setNowMs(Date.now()));

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [durationSeconds, startedAtMs]);

  const start = useCallback(
    (nextDurationSeconds = durationSeconds) => {
      setDurationSeconds(nextDurationSeconds);
      setStartedAtMs(Date.now());
      setNowMs(Date.now());
    },
    [durationSeconds]
  );

  const skip = useCallback(() => {
    const wasRunning = startedAtMs !== null;

    setStartedAtMs(null);
    setNowMs(Date.now());

    if (wasRunning) {
      onCompleteRef.current?.();
    }
  }, [startedAtMs]);

  const updateDuration = useCallback((nextDurationSeconds: number) => {
    setDurationSeconds(nextDurationSeconds);
    setStartedAtMs(null);
    setNowMs(Date.now());
  }, []);

  return {
    durationSeconds,
    remainingSeconds,
    isRunning,
    start,
    skip,
    setDurationSeconds: updateDuration
  };
}
