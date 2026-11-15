"use client";

import { getKategorie } from "@/lib/categories";
import { formatDatum, formatEuroSigned } from "@/lib/format";
import type { Buchung } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Kompakte Buchungsliste für kleine Bildschirme */
export function BuchungenList({
  buchungen,
  onEdit,
}: {
  buchungen: Buchung[];
  onEdit: (buchung: Buchung) => void;
}) {
  return (
    <ul className="divide-y">
      {buchungen.map((b) => {
        const k = getKategorie(b.kategorieId);
        const einnahme = b.typ === "einnahme";
        return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onEdit(b)}
              className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 active:bg-surface"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {b.bezeichnung}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="num">{formatDatum(b.datum)}</span>
                  <span aria-hidden className="text-border-strong">·</span>
                  <span className="truncate">{k?.name ?? "Unbekannt"}</span>
                </span>
              </span>
              <span
                className={cn(
                  "num shrink-0 text-sm",
                  einnahme ? "font-medium" : "text-muted-foreground",
                )}
              >
                <span className="sr-only">{einnahme ? "Einnahme" : "Ausgabe"} </span>
                {formatEuroSigned(einnahme ? b.betragCent : -b.betragCent)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
