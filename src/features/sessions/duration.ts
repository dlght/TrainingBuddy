export function getElapsedSeconds(startedAtIso: string, referenceIso: string): number {
  const startedAtMs = new Date(startedAtIso).getTime();
  const referenceMs = new Date(referenceIso).getTime();

  if (Number.isNaN(startedAtMs) || Number.isNaN(referenceMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((referenceMs - startedAtMs) / 1000));
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }

  return `${seconds}s`;
}
