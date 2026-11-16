"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Search, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hint } from "@/components/ui/tooltip";
import {
  createBuchungAction,
  deleteBuchungAction,
  updateBuchungAction,
} from "@/app/actions/transactions";
import { importCsvAction } from "@/app/actions/import";
import { getKategorie } from "@/lib/categories";
import type { AppUser, Buchung, BuchungInput, YearTotals } from "@/lib/types";
import { BuchungDialog } from "./buchung-dialog";
import { BuchungenList } from "./buchungen-list";
import { BuchungenTable, type Sort, type SortKey } from "./buchungen-table";
import { CategoryCombobox } from "./category-combobox";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { EmptyState } from "./empty-state";
import { ImportDialog } from "./import-dialog";
import { Totals } from "./totals";

const collator = new Intl.Collator("de");

function compare(a: Buchung, b: Buchung, key: SortKey): number {
  switch (key) {
    case "art":
      return collator.compare(
        getKategorie(a.kategorieId)?.name ?? a.kategorieId,
        getKategorie(b.kategorieId)?.name ?? b.kategorieId,
      );
    case "konto":
      return collator.compare(a.konto, b.konto);
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

export function BuchungenApp({
  user,
  jahr,
  jahre,
  buchungen,
  totals,
  loadError,
  homeAddress: initialHomeAddress,
}: {
  user: AppUser;
  jahr: number;
  jahre: number[];
  buchungen: Buchung[];
  totals: YearTotals;
  loadError: string | null;
  homeAddress: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [suche, setSuche] = useState("");
  const [kategorie, setKategorie] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>({ key: "datum", dir: "desc" });
  const [dialog, setDialog] = useState<{ open: boolean; buchung?: Buchung }>({
    open: false,
  });
  const [toDelete, setToDelete] = useState<Buchung | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [homeAddress, setHomeAddress] = useState(initialHomeAddress);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const sichtbar = useMemo(() => {
    const q = suche.trim().toLocaleLowerCase("de");
    const rows = buchungen.filter((b) => {
      if (kategorie && b.kategorieId !== kategorie) return false;
      if (!q) return true;
      const k = getKategorie(b.kategorieId);
      return `${b.bezeichnung} ${k?.name ?? b.kategorieId} ${b.konto}`
        .toLocaleLowerCase("de")
        .includes(q);
    });
    const factor = sort.dir === "asc" ? 1 : -1;
    return rows.sort(
      (a, b) =>
        factor * compare(a, b, sort.key) || b.datum.localeCompare(a.datum),
    );
  }, [buchungen, suche, kategorie, sort]);

  const gefiltert = Boolean(suche.trim() || kategorie);

  const handleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : {
            key,
            dir:
              key === "datum" || key === "einnahmen" || key === "ausgaben"
                ? "desc"
                : "asc",
          },
    );

  const setJahr = (next: number) => {
    startTransition(() => {
      router.push(`/?jahr=${next}`);
    });
  };

  const openNeu = () => setDialog({ open: true });
  const openEdit = (buchung: Buchung) => setDialog({ open: true, buchung });
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const handleSubmit = async (input: BuchungInput) => {
    if (saving) return { form: "Bitte warten…" };
    setSaving(true);
    try {
      const result = dialog.buchung
        ? await updateBuchungAction(dialog.buchung.id, input)
        : await createBuchungAction(input);
      if (!result.ok) {
        toast.error(result.error);
        return result.fieldErrors ?? { form: result.error };
      }
      toast.success(dialog.buchung ? "Buchung gespeichert" : "Buchung angelegt");
      const neuesJahr = Number(input.datum.slice(0, 4));
      closeDialog();
      startTransition(() => {
        if (neuesJahr !== jahr) router.push(`/?jahr=${neuesJahr}`);
        else router.refresh();
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (buchung: Buchung) => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await deleteBuchungAction(buchung.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Buchung gelöscht");
      setToDelete(null);
      closeDialog();
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (buchungen.length === 0) {
      toast.error("Keine Buchungen zum Exportieren");
      return;
    }
    window.location.assign(`/api/export?year=${jahr}`);
    toast.success("Export wird heruntergeladen");
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await importCsvAction(data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `${result.data.imported} importiert` +
          (result.data.skipped
            ? `, ${result.data.skipped} bereits vorhanden`
            : ""),
      );
      setImportOpen(false);
      startTransition(() => router.refresh());
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-dvh">
      <Header
        jahr={jahr}
        jahre={jahre}
        onJahrChange={setJahr}
        user={user}
        homeAddress={homeAddress}
        onHomeAddressChange={setHomeAddress}
      />

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

        <div role="search" className="mt-6 flex flex-wrap items-center gap-2">
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
          <Hint label="CSV importieren">
            <Button
              onClick={() => setImportOpen(true)}
              aria-label="CSV importieren"
            >
              <Upload />
              <span className="hidden md:inline">Import</span>
            </Button>
          </Hint>
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
          {loadError ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-medium">Daten konnten nicht geladen werden</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{loadError}</p>
            </div>
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
                  onDelete={setToDelete}
                />
              </div>
              <div className="md:hidden">
                <BuchungenList buchungen={sichtbar} onEdit={openEdit} />
              </div>
              <div className="overflow-hidden rounded-b-[5px]">
                <Totals
                  einnahmenCent={totals.incomeCents}
                  ausgabenCent={totals.expenseCents}
                />
              </div>
            </>
          )}
        </section>

        {!loadError && (
          <p className="mt-3 text-xs text-subtle-foreground">
            {sichtbar.length} {sichtbar.length === 1 ? "Buchung" : "Buchungen"}
            {gefiltert && ` von ${buchungen.length}`} in {jahr}
            {gefiltert && " · Summen beziehen sich auf das gesamte Jahr"}
            {pending ? " · Aktualisiere…" : ""}
          </p>
        )}
      </main>

      <BuchungDialog
        open={dialog.open}
        pending={saving}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        buchung={dialog.buchung}
        onSubmit={handleSubmit}
        homeAddress={homeAddress}
        onDelete={
          dialog.buchung ? () => setToDelete(dialog.buchung ?? null) : undefined
        }
      />
      <ConfirmDeleteDialog
        buchung={toDelete}
        pending={saving}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        onConfirm={() => {
          if (toDelete) void handleDelete(toDelete);
        }}
      />
      <ImportDialog
        open={importOpen}
        pending={importing}
        onOpenChange={setImportOpen}
        onImport={handleImport}
      />
    </div>
  );
}
