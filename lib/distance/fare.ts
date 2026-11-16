import { bigintToCents } from "@/lib/money";

/** German commuter allowance default: 0,30 € per kilometre. */
export const DEFAULT_KM_RATE_CENTS = 30;

/**
 * Kilometre allowance in integer cents.
 * `round(meters / 1000 * rateCents)`.
 */
export function fahrtkostenCents(
  distanceMeters: number,
  rateCentsPerKm: number,
): number {
  if (!Number.isInteger(distanceMeters) || distanceMeters <= 0) {
    throw new RangeError("Invalid distance.");
  }
  if (!Number.isInteger(rateCentsPerKm) || rateCentsPerKm <= 0) {
    throw new RangeError("Invalid kilometre rate.");
  }
  const cents =
    (BigInt(distanceMeters) * BigInt(rateCentsPerKm) + 500n) / 1000n;
  const amount = bigintToCents(cents);
  if (amount <= 0) throw new RangeError("Amount rounds to zero.");
  return amount;
}

/** Metres to a German kilometre label, rounded to 0,1 km. */
export function formatKilometers(distanceMeters: number): string {
  const tenths = Math.round(distanceMeters / 100);
  const whole = Math.trunc(tenths / 10);
  const frac = Math.abs(tenths % 10);
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return frac === 0 ? `${grouped} km` : `${grouped},${frac} km`;
}
