"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/tooltip";
import { artLabel, getKategorie } from "@/lib/categories";
import { formatDatum, formatEuro } from "@/lib/format";
import type { Buchung } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SortKey =
  | "art"
  | "konto"
  | "bezeichnung"
  | "datum"
  | "einnahmen"
  | "ausgaben";

export interface Sort {
  key: SortKey;
  dir: "asc" | "desc";
}

const COLUMNS: { key: SortKey; label: string; numeric?: boolean; className: string }[] = [
  { key: "art", label: "Art", className: "w-[200px]" },
  { key: "konto", label: "Konto", className: "w-[84px]" },
  { key: "bezeichnung", label: "Bezeichnung", className: "" },
  { key: "datum", label: "Datum", className: "w-[112px]" },
  { key: "einnahmen", label: "Einnahmen", numeric: true, className: "w-[132px]" },
  { key: "ausgaben", label: "Ausgaben", numeric: true, className: "w-[132px]" },
];

export function BuchungenTable({
  buchungen,
  sort,
  onSort,
  onEdit,
  onDelete,
}: {
  buchungen: Buchung[];
  sort: Sort;
  onSort: (key: SortKey) => void;
  onEdit: (buchung: Buchung) => void;
  onDelete: (buchung: Buchung) => void;
}) {
  return (
    <table className="w-full table-fixed border-separate border-spacing-0 text-[13px]">
      <thead className="sticky top-0 z-10">
        <tr>
          {COLUMNS.map((col, i) => {
            const active = sort.key === col.key;
            const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
            return (
              <th
                key={col.key}
                scope="col"
                aria-sort={
                  active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
                }
                className={cn(
                  "h-9 border-b bg-surface px-3 text-xs font-medium",
                  col.numeric ? "text-right" : "text-left",
                  i === 0 && "rounded-tl-[5px]",
                  col.className,
                )}
              >
                <button
                  type="button"
                  onClick={() => onSort(col.key)}
                  className={cn(
                    "group/sort -mx-1 inline-flex h-6 items-center gap-1 rounded-sm px-1 transition-colors duration-150 hover:text-foreground",
                    col.numeric && "flex-row-reverse",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {col.label}
                  <Icon
                    aria-hidden
                    className={cn(
                      "size-3 transition-opacity duration-150",
                      active
                        ? "opacity-70"
                        : "opacity-0 group-hover/sort:opacity-50 group-focus-visible/sort:opacity-50",
                    )}
                  />
                </button>
              </th>
            );
          })}
          <th className="w-[76px] rounded-tr-[5px] border-b bg-surface">
            <span className="sr-only">Aktionen</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {buchungen.map((b) => {
          const k = getKategorie(b.kategorieId);
          return (
            <tr
              key={b.id}
              className="group transition-colors duration-150 hover:bg-surface [&>td]:border-b last:[&>td]:border-b-0"
            >
              <td className="h-10 px-3">
                <span
                  data-privacy
                  className="inline-block max-w-full truncate rounded-sm border bg-surface px-1.5 py-px align-middle text-xs text-muted-foreground group-hover:bg-background"
                >
                  {artLabel(b)}
                </span>
              </td>
              <td data-privacy className="num px-3 text-muted-foreground">
                {b.konto || k?.konto || "–"}
              </td>
              <td
                data-privacy
                className="truncate px-3 font-medium"
                title={
                  b.rechnungsnummer
                    ? `${b.bezeichnung} · ${b.rechnungsnummer}`
                    : b.bezeichnung
                }
              >
                {b.bezeichnung}
                {b.rechnungsnummer && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {b.rechnungsnummer}
                  </span>
                )}
              </td>
              <td className="num px-3 text-muted-foreground">
                {formatDatum(b.datum)}
              </td>
              <td data-privacy="strong" className="num px-3 text-right">
                {b.typ === "einnahme" && formatEuro(b.betragCent)}
              </td>
              <td
                data-privacy="strong"
                className="num px-3 text-right"
                title={
                  b.typ === "ausgabe" && b.bruttoCent != null
                    ? `70 % von ${formatEuro(b.bruttoCent)}`
                    : undefined
                }
              >
                {b.typ === "ausgabe" && formatEuro(b.betragCent)}
              </td>
              <td className="px-2">
                <div className="flex justify-end gap-0.5 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
                  <Hint label="Bearbeiten">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${b.bezeichnung} bearbeiten`}
                      onClick={() => onEdit(b)}
                    >
                      <Pencil className="size-3.5!" />
                    </Button>
                  </Hint>
                  <Hint label="Löschen">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${b.bezeichnung} löschen`}
                      onClick={() => onDelete(b)}
                    >
                      <Trash2 className="size-3.5!" />
                    </Button>
                  </Hint>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
