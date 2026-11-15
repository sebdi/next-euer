"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hint } from "@/components/ui/tooltip";
import { getKategorie } from "@/lib/categories";
import { buchungenToCsv, downloadCsv } from "@/lib/export";
import { useBuchungen } from "@/lib/store";
import type { Buchung, BuchungInput } from "@/lib/types";
import { BuchungDialog } from "./buchung-dialog";
import { BuchungenList } from "./buchungen-list";
import { BuchungenSkeleton } from "./buchungen-skeleton";
import { BuchungenTable, type Sort, type SortKey } from "./buchungen-table";
import { CategoryCombobox } from "./category-combobox";
import { EmptyState } from "./empty-state";
import { Totals } from "./totals";

const collator = new Intl.Collator("de");

function compare(a: Buchung, b: Buchung, key: SortKey): number {
  switch (key) {
    case "art":
      return collator.compare(
        getKategorie(a.kategorieId)?.name ?? "",
        getKategorie(b.kategorieId)?.name ?? "",
      );
    case "konto":
      return collator.compare(
        getKategorie(a.kategorieId)?.konto ?? "",
        getKategorie(b.kategorieId)?.konto ?? "",
      );
    case "bezeichnung":
      return collator.compare(a.bezeichnung, b.bezeichnung);
    case "datum":
      return a.datum.localeCompare(b.datum);
    case "einnahmen":
      return (
        (a.typ === "einnahme" ? a.betragCent : -1) -
        (b.typ === "einnahme" ? b.betragCent : -1)
      );
    case "ausgaben":
      return (
        (a.typ === "ausgabe" ? a.betragCent : -1) -
        (b.typ === "ausgabe" ? b.betragCent : -1)
      );
  }
}

export function BuchungenApp() {
  const { buchungen, loading, add, edit, remove, restore } = useBuchungen();

  const [jahr, setJahr] = useState(() => new Date().getFullYear());
  const [suche, setSuche] = useState("");
  const [kategorie, setKategorie] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>({ key: "datum", dir: "desc" });
  const [dialog, setDialog] = useState<{ open: boolean; buchung?: Buchung }>({
    open: false,
  });

  const jahre = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear(), jahr]);
    for (const b of buchungen) set.add(Number(b.datum.slice(0, 4)));
    return [...set].sort((a, b) => b - a);
  }, [buchungen, jahr]);

  const imJahr = useMemo(
    () => buchungen.filter((b) => b.datum.startsWith(`${jahr}-`)),
    [buchungen, jahr],
  );

  const sichtbar = useMemo(() => {
    const q = suche.trim().toLocaleLowerCase("de");
    const rows = imJahr.filter((b) => {
      if (kategorie && b.kategorieId !== kategorie) return false;
      if (!q) return true;
      const k = getKategorie(b.kategorieId);
      return `${b.bezeichnung} ${k?.name ?? ""} ${k?.konto ?? ""}`
        .toLocaleLowerCase("de")
        .includes(q);
    });
    const factor = sort.dir === "asc" ? 1 : -1;
    return rows.sort(
      (a, b) =>
        factor * compare(a, b, sort.key) || b.datum.localeCompare(a.datum),
    );
  }, [imJahr, suche, kategorie, sort]);

  const summen = useMemo(() => {
    let einnahmen = 0;
    let ausgaben = 0;
    for (const b of sichtbar) {
      if (b.typ === "einnahme") einnahmen += b.betragCent;
      else ausgaben += b.betragCent;
    }
    return { einnahmen, ausgaben };
  }, [sichtbar]);

  const gefiltert = Boolean(suche.trim() || kategorie);

  const handleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "datum" || key === "einnahmen" || key === "ausgaben" ? "desc" : "asc" },
    );

  const openNeu = () => setDialog({ open: true });
  const openEdit = (buchung: Buchung) => setDialog({ open: true, buchung });
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const handleSubmit = (input: BuchungInput) => {
    if (dialog.buchung) {
      edit(dialog.buchung.id, input);
      toast.success("Buchung gespeichert");
    } else {
      add(input);
      toast.success("Buchung angelegt");
    }
    const neuesJahr = Number(input.datum.slice(0, 4));
    if (neuesJahr !== jahr) setJahr(neuesJahr);
    closeDialog();
  };

  const handleDelete = (buchung: Buchung) => {
    remove(buchung.id);
    closeDialog();
    toast("Buchung gelöscht", {
      description: buchung.bezeichnung,
      action: { label: "Rückgängig", onClick: () => restore(buchung) },
    });
  };

  const handleExport = () => {
    if (sichtbar.length === 0) {
      toast.error("Keine Buchungen zum Exportieren");
      return;
    }
    downloadCsv(`buchungen-${jahr}.csv`, buchungenToCsv(sichtbar));
    toast.success(
      `${sichtbar.length} ${sichtbar.length === 1 ? "Buchung" : "Buchungen"} exportiert`,
    );
  };

  return (
    <div className="min-h-dvh">
      <Header jahr={jahr} jahre={jahre} onJahrChange={setJahr} />

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6 md:pt-8">
        <div className="flex items-start justify-between gap-4 md:items-end">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">Buchungen</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Einnahmen und Ausgaben verwalten
            </p>
          </div>
          <Button variant="primary" onClick={openNeu}>
            <Plus /> Neue Buchung
          </Button>
        </div>

        <div
          role="search"
          className="mt-6 flex flex-wrap items-center gap-2"
        >
          <div className="relative w-full md:w-auto md:flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle-foreground md:left-2.5"
              aria-hidden
            />
            <Input
              type="search"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Buchungen durchsuchen…"
              aria-label="Buchungen durchsuchen"
              className="px-9 md:px-8 [&::-webkit-search-cancel-button]:hidden"
            />
            {suche && (
              <button
                type="button"
                onClick={() => setSuche("")}
                aria-label="Suche leeren"
                className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground md:size-6 md:right-1"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <CategoryCombobox
            allowAll
            aria-label="Nach Kategorie filtern"
            value={kategorie}
            onChange={setKategorie}
            className="min-w-0 flex-1 md:w-56 md:flex-none"
          />
          <Hint label="Als CSV exportieren">
            <Button onClick={handleExport} aria-label="Als CSV exportieren">
              <Download />
              <span className="hidden md:inline">Export</span>
            </Button>
          </Hint>
        </div>

        <section
          aria-label={`Buchungen ${jahr}`}
          className="mt-3 rounded-md border"
        >
          {loading ? (
            <BuchungenSkeleton />
          ) : sichtbar.length === 0 ? (
            <EmptyState
              gefiltert={gefiltert}
              jahr={jahr}
              onNeu={openNeu}
              onReset={() => {
                setSuche("");
                setKategorie(null);
              }}
            />
          ) : (
            <>
              <div className="hidden md:block">
                <BuchungenTable
                  buchungen={sichtbar}
                  sort={sort}
                  onSort={handleSort}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              </div>
              <div className="md:hidden">
                <BuchungenList buchungen={sichtbar} onEdit={openEdit} />
              </div>
              <div className="overflow-hidden rounded-b-[5px]">
                <Totals
                  einnahmenCent={summen.einnahmen}
                  ausgabenCent={summen.ausgaben}
                />
              </div>
            </>
          )}
        </section>

        {!loading && sichtbar.length > 0 && (
          <p className="mt-3 text-xs text-subtle-foreground">
            {sichtbar.length} {sichtbar.length === 1 ? "Buchung" : "Buchungen"}
            {gefiltert && ` von ${imJahr.length}`} in {jahr}
            {gefiltert && " · Summen beziehen sich auf die gefilterte Auswahl"}
          </p>
        )}
      </main>

      <BuchungDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        buchung={dialog.buchung}
        onSubmit={handleSubmit}
        onDelete={
          dialog.buchung ? () => handleDelete(dialog.buchung!) : undefined
        }
      />
    </div>
  );
}
