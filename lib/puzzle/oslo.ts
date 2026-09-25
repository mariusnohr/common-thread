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

/**
 * Seconds left of the current Oslo day, i.e. until the next puzzles appear.
 * Ignores the one hour gained or lost on the two daylight-saving nights.
 */
export function secondsUntilOsloMidnight(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const elapsed = get("hour") * 3600 + get("minute") * 60 + get("second");
  return Math.max(0, 86_400 - elapsed);
}

/** A Norwegian day label for an ISO date, e.g. `fredag 25. september`. */
export function formatNorwegianDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}
