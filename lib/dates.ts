const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_PREFIX = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;
const DAY_FIRST = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;
const YEAR_FIRST_DOTS = /^(\d{4})\.(\d{2})\.(\d{2})$/;

export function isValidIsoDate(iso: string): boolean {
  const match = ISO_DATE.exec(iso);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const d = new Date(utc);
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/** Calendar year bounds as UTC dates (inclusive start, exclusive end). */
export function yearDateRange(year: number): { gte: Date; lt: Date } {
  return {
    gte: new Date(Date.UTC(year, 0, 1)),
    lt: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

export function isoDateToUtc(iso: string): Date {
  if (!isValidIsoDate(iso)) {
    throw new Error("Invalid date.");
  }
  return new Date(`${iso}T00:00:00.000Z`);
}

export function utcDateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseFlexibleDate(raw: string): string | null {
  const trimmed = raw.trim();
  const isoPrefix = ISO_PREFIX.exec(trimmed);
  if (isoPrefix) {
    const iso = `${isoPrefix[1]}-${isoPrefix[2]}-${isoPrefix[3]}`;
    return isValidIsoDate(iso) ? iso : null;
  }
  const dottedYear = YEAR_FIRST_DOTS.exec(trimmed);
  if (dottedYear) {
    const iso = `${dottedYear[1]}-${dottedYear[2]}-${dottedYear[3]}`;
    return isValidIsoDate(iso) ? iso : null;
  }
  const de = DAY_FIRST.exec(trimmed);
  if (!de) return null;
  const day = de[1].padStart(2, "0");
  const month = de[2].padStart(2, "0");
  const iso = `${de[3]}-${month}-${day}`;
  return isValidIsoDate(iso) ? iso : null;
}

export function isoToGermanDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function parseYearParam(raw: string | undefined | null): number {
  if (!raw || !/^\d{4}$/.test(raw)) return currentYear();
  const year = Number(raw);
  if (year < 1990 || year > 2100) return currentYear();
  return year;
}
