export function formatRepRange(low: number, high: number): string {
  return low === high ? `${low}` : `${low}-${high}`;
}
