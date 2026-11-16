import { z } from "zod";
import { ACCOUNTING_CATEGORIES } from "./categories";
import { isValidIsoDate } from "./dates";
import { bewirtungAbziehbarCents, parseBetrag } from "./money";

export const USER_ERROR = {
  unauthorized: "Nicht angemeldet.",
  forbidden: "Kein Zugriff.",
  notFound: "Buchung nicht gefunden.",
  generic: "Die Aktion konnte nicht ausgeführt werden.",
  validation: "Bitte Eingaben prüfen.",
  importInvalid: "Die Datei enthält ungültige Zeilen.",
} as const;

const categorySchema = z.enum(ACCOUNTING_CATEGORIES);

const isoDateSchema = z
  .string()
  .refine(isValidIsoDate, "Datum ist ungültig.");

const centsSchema = z
  .number()
  .int("Betrag muss in ganzen Cent vorliegen.")
  .nonnegative("Betrag darf nicht negativ sein.")
  .max(Number.MAX_SAFE_INTEGER, "Betrag ist zu groß.");

export const buchungInputSchema = z
  .object({
    kategorieId: categorySchema,
    konto: z.string().trim().max(32, "Konto ist zu lang."),
    bezeichnung: z
      .string()
      .trim()
      .min(1, "Bezeichnung fehlt.")
      .max(500, "Bezeichnung ist zu lang."),
    datum: isoDateSchema,
    typ: z.enum(["einnahme", "ausgabe"]),
    betragCent: centsSchema.positive("Betrag muss größer als 0 sein."),
    bruttoCent: centsSchema.positive("Bruttobetrag muss größer als 0 sein.").optional(),
    routeOrigin: z.string().trim().min(1).max(200).optional(),
    routeDestination: z.string().trim().min(1).max(200).optional(),
    distanceMeters: z.number().int().positive().max(2_000_000_000).optional(),
    rateCentsPerKm: z.number().int().positive().max(100_000).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const routeParts = [
      value.routeOrigin,
      value.routeDestination,
      value.distanceMeters,
      value.rateCentsPerKm,
    ];
    const routeCount = routeParts.filter((part) => part != null).length;
    if (routeCount > 0 && routeCount < 4) {
      ctx.addIssue({
        code: "custom",
        path: ["routeOrigin"],
        message: "Die Strecke ist unvollständig.",
      });
    }
    if (
      routeCount === 4 &&
      (value.kategorieId !== "Fahrtkosten" || value.typ !== "ausgabe")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["routeOrigin"],
        message: "Die Strecke gilt nur für Fahrtkosten.",
      });
    }
    if (value.bruttoCent == null) return;
    if (value.kategorieId !== "Bewirtungskosten" || value.typ !== "ausgabe") {
      ctx.addIssue({
        code: "custom",
        path: ["bruttoCent"],
        message: "Der Bruttobetrag gilt nur für Bewirtungskosten.",
      });
      return;
    }
    if (bewirtungAbziehbarCents(value.bruttoCent) <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["betragCent"],
        message: "70 % des Bruttobetrags müssen größer als 0 sein.",
      });
    }
  });

export const transactionAmountsSchema = z
  .object({
    incomeCents: centsSchema,
    expenseCents: centsSchema,
  })
  .refine(
    (v) =>
      (v.incomeCents > 0 && v.expenseCents === 0) ||
      (v.expenseCents > 0 && v.incomeCents === 0),
    "Eine Buchung muss entweder Einnahme oder Ausgabe sein.",
  );

export const routeQuerySchema = z
  .object({
    origin: z.string().trim().min(2, "Start fehlt.").max(200, "Start ist zu lang."),
    destination: z
      .string()
      .trim()
      .min(2, "Ziel fehlt.")
      .max(200, "Ziel ist zu lang."),
    rateCentsPerKm: z
      .number()
      .int()
      .positive("Kilometerpauschale muss größer als 0 sein.")
      .max(100_000, "Kilometerpauschale ist zu hoch."),
  })
  .strict()
  .refine(
    (value) =>
      value.origin.toLocaleLowerCase("de") !==
      value.destination.toLocaleLowerCase("de"),
    { path: ["destination"], message: "Start und Ziel müssen sich unterscheiden." },
  );

export const transactionIdSchema = z.uuid("Ungültige Buchung.");

export const yearSchema = z
  .number()
  .int()
  .min(1990, "Jahr ist ungültig.")
  .max(2100, "Jahr ist ungültig.");

export const filterSchema = z
  .object({
    year: yearSchema,
    query: z.string().trim().max(200).optional().default(""),
    category: z.union([categorySchema, z.literal("")]).optional(),
  })
  .strict();

export const csvRowSchema = z
  .object({
    category: categorySchema,
    account: z.string().trim().max(32),
    description: z
      .string()
      .trim()
      .min(1, "Bezeichnung fehlt.")
      .max(500, "Bezeichnung ist zu lang."),
    date: isoDateSchema,
    incomeCents: centsSchema,
    expenseCents: centsSchema,
  })
  .refine(
    (v) =>
      (v.incomeCents > 0 && v.expenseCents === 0) ||
      (v.expenseCents > 0 && v.incomeCents === 0),
    "Eine Buchung muss entweder Einnahme oder Ausgabe sein.",
  );

export type BuchungInputParsed = z.infer<typeof buchungInputSchema>;
export type CsvRowParsed = z.infer<typeof csvRowSchema>;

export function fieldErrorsFromZod(
  error: z.ZodError,
): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function parseOptionalAmount(raw: string | undefined | null): number | null {
  const value = (raw ?? "").trim();
  if (!value) return 0;
  return parseBetrag(value);
}
