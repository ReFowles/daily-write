/**
 * Formats a word count for display with locale-aware thousands separators
 * (e.g. 12345 → "12,345"). Use everywhere a word count is rendered so counts
 * stay consistent across the app.
 */
export function formatWordCount(count: number): string {
  return count.toLocaleString("en-US");
}
