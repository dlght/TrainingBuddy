/**
 * Best-effort detection of "couldn't reach the server" failures (device
 * offline, DNS/TLS failure, request timeout) versus other errors (validation,
 * RLS rejection, etc.), so screens can show a distinct offline message
 * instead of a generic failure per FR-009.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // React Native's fetch throws a plain TypeError for connectivity
    // failures, e.g. "Network request failed".
    return /network/i.test(error.message);
  }

  if (error && typeof error === "object" && "message" in error) {
    return /network|fetch failed|failed to fetch/i.test(String((error as { message: unknown }).message));
  }

  return false;
}

export function describeLoadError(error: unknown, fallback: string): string {
  return isNetworkError(error) ? "You're offline. Check your connection and try again." : fallback;
}
