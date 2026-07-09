import { useEffect, useState } from "react";

import { getElapsedSeconds } from "./duration";

export function useElapsedSeconds(startedAtIso: string, isRunning: boolean): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => setTick((value) => value + 1), 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  return getElapsedSeconds(startedAtIso, new Date().toISOString());
}
