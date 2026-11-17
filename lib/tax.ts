import { bigintToCents, parseBetrag } from "./money";

/** 100,00 % as basis points. 4200 means 42,00 %. */
export const MAX_TAX_RATE_BPS = 10_000;

/**
 * Reads a percent such as "42" or "42,50" into basis points.
 * An empty field clears the rate. Invalid input returns "invalid".
 */
export function parseTaxRateInput(raw: string): number | null | "invalid" {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const bps = parseBetrag(trimmed);
  if (bps == null || bps > MAX_TAX_RATE_BPS) return "invalid";
  return bps;
}

/**
 * Expected income tax for one EÜR year: positive profit times the marginal rate.
 * A loss or a zero result is 0. A missing rate returns null.
 * Half-up to integer cents. Solidarity surcharge and church tax are not included.
 */
export function expectedIncomeTaxCents(
  profitCents: number,
  rateBps: number | null,
): number | null {
  if (rateBps == null) return null;
  if (
    !Number.isInteger(profitCents) ||
    !Number.isSafeInteger(profitCents) ||
    !Number.isInteger(rateBps) ||
    rateBps < 0 ||
    rateBps > MAX_TAX_RATE_BPS
  ) {
    throw new RangeError("Invalid tax estimate.");
  }
  if (profitCents <= 0) return 0;
  const tax =
    (BigInt(profitCents) * BigInt(rateBps) + 5_000n) / 10_000n;
  return bigintToCents(tax);
}
