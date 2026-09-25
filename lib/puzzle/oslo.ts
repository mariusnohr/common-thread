/**
 * Returns today's date in the `Europe/Oslo` timezone as an ISO `YYYY-MM-DD`
 * string. The puzzle day is an Oslo day, so "today" must not be derived from
 * the database server's timezone (or the Node process default).
 */
export function todayInOslo(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes): string => {
    const part = parts.find((candidate) => candidate.type === type);
    if (!part) throw new Error(`Missing ${type} in formatted date`);
    return part.value;
  };

  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** Shifts an ISO `YYYY-MM-DD` date by a whole number of days. */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}
