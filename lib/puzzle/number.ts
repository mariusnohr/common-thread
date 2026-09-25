/**
 * The one-based puzzle number for a publish date, counted from `LAUNCH_DATE`.
 * Returns `null` when `LAUNCH_DATE` is missing, malformed, or later than the
 * publish date.
 */
export function puzzleNumberForDate(
  launchDate: string | undefined,
  publishDate: string,
): number | null {
  if (!launchDate || !/^\d{4}-\d{2}-\d{2}$/.test(launchDate)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishDate)) return null;

  const days = daysBetween(launchDate, publishDate);
  if (days === null || days < 0) return null;
  return days + 1;
}

function daysBetween(from: string, to: string): number | null {
  const start = Date.UTC(...parts(from));
  const end = Date.UTC(...parts(to));
  const days = Math.round((end - start) / 86_400_000);
  return Number.isFinite(days) ? days : null;
}

function parts(isoDate: string): [number, number, number] {
  const [year, month, day] = isoDate.split("-").map(Number);
  return [year, month - 1, day];
}
