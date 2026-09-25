/**
 * Formats a word count for display with locale-aware thousands separators
 * (e.g. 12345 → "12,345"). Use everywhere a word count is rendered so counts
 * stay consistent across the app.
 */
export function formatWordCount(count: number): string {
  return count.toLocaleString("en-US");
}

/**
 * Pluralizes a unit label for display (e.g. "word"/"words", "chapter"/"chapters").
 * Falls back to "unit" for a blank label so manual goals never render an empty noun.
 */
export function pluralizeUnit(label: string, count: number): string {
  const trimmed = label.trim() || "unit";
  return count === 1 ? trimmed : `${trimmed}s`;
}
