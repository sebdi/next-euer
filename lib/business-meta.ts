import type { BetriebArt } from "./types";

export const BETRIEB_ARTEN: { value: BetriebArt; label: string }[] = [
  { value: "freiberuflich", label: "Freiberuflich" },
  { value: "gewerblich", label: "Gewerblich" },
];

export const DEFAULT_BETRIEB_NAME = "Mein Betrieb";

/** Cookie, das den zuletzt gewählten Betrieb merkt */
export const BETRIEB_COOKIE = "nexteuer-betrieb";

export function betriebArtLabel(art: BetriebArt): string {
  return art === "gewerblich" ? "Gewerblich" : "Freiberuflich";
}

/** Dateiname-tauglicher Kurzname, z. B. „Büro Müller“ → „buero-mueller“ */
export function businessSlug(name: string): string {
  const slug = name
    .toLocaleLowerCase("de")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug || "betrieb";
}
