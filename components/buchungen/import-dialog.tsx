"use client";

import { useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { CsvPreviewRow } from "@/lib/csv";
import {
  IMPORT_FIELDS,
  guessImportMapping,
  mapCsvTable,
  mappingProblem,
  readCsvTable,
  sampleCell,
  type CsvTable,
  type ImportMapping,
} from "@/lib/csv-import";
import { isoToGermanDate } from "@/lib/dates";
import { formatEuro } from "@/lib/format";

export function ImportDialog({
  open,
  pending,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, mapping: ImportMapping, hasHeader: boolean) => Promise<void>;
}) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const form = (
    <ImportForm
      pending={pending}
      onCancel={() => onOpenChange(false)}
      onImport={onImport}
    />
  );

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CSV importieren</DialogTitle>
            <DialogDescription>
              Spalten zuordnen, Vorschau prüfen, dann übernehmen.
            </DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} fixed>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>CSV importieren</DrawerTitle>
          <DrawerDescription>
            Spalten zuordnen, Vorschau prüfen, dann übernehmen.
          </DrawerDescription>
        </DrawerHeader>
        {form}
      </DrawerContent>
    </Drawer>
  );
}

function ImportForm({
  pending,
  onCancel,
  onImport,
}: {
  pending: boolean;
  onCancel: () => void;
  onImport: (file: File, mapping: ImportMapping, hasHeader: boolean) => Promise<void>;
}) {
  const uid = useId();
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [hasHeader, setHasHeader] = useState(true);
  const [table, setTable] = useState<CsvTable | null>(null);
  const [mapping, setMapping] = useState<ImportMapping | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const loadText = (source: string, header: boolean) => {
    const result = readCsvTable(source, header);
    if ("error" in result) {
      setTable(null);
      setMapping(null);
      setFileError(result.error);
      return;
    }
    setFileError(null);
    setTable(result.table);
    setMapping(guessImportMapping(result.table.headers));
  };

  const handleFile = async (next: File | null) => {
    setFile(next);
    setText("");
    setTable(null);
    setMapping(null);
    setFileError(null);
    setHasHeader(true);
    if (!next) return;
    const source = await next.text();
    setText(source);
    loadText(source, true);
  };

  const problem =
    table && mapping ? mappingProblem(mapping, table.headers.length) : null;
  const preview = useMemo(() => {
    if (!table || !mapping || problem) return null;
    return mapCsvTable(table, mapping, hasHeader);
  }, [table, mapping, problem, hasHeader]);
  const stats = useMemo(() => {
    if (!preview) return null;
    return {
      errors: preview.rows.filter((row) => row.error).length,
      valid: preview.valid.length,
    };
  }, [preview]);
  const shownRows = useMemo(() => {
    if (!preview) return [];
    const errors = preview.rows.filter((row) => row.error);
    const valid = preview.rows.filter((row) => row.data);
    return [...errors, ...valid].slice(0, 100);
  }, [preview]);

  const canImport =
    Boolean(file && table && mapping) &&
    !fileError &&
    !problem &&
    (stats?.valid ?? 0) > 0 &&
    (stats?.errors ?? 0) === 0 &&
    !pending;

  return (
    <form
      className="flex min-h-0 flex-col overflow-hidden"
      onSubmit={(event) => {
        event.preventDefault();
        if (!file || !mapping || !canImport) return;
        void onImport(file, mapping, hasHeader);
      }}
    >
      <div
        data-vaul-no-drag
        className="grid min-h-0 gap-4 overflow-y-auto overscroll-contain px-4 py-4 touch-pan-y md:px-5"
      >
        <div className="grid gap-1.5">
          <Label htmlFor={uid}>CSV-Datei</Label>
          <Input
            id={uid}
            type="file"
            accept=".csv,text/csv,text/plain"
            disabled={pending}
            onChange={(event) => {
              void handleFile(event.target.files?.[0] ?? null);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Beliebige CSV mit Komma, Semikolon oder Tab. Ordne die Spalten den
            Feldern zu. Ein Betrag ist positiv eine Einnahme und negativ eine
            Ausgabe.
          </p>
          <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <input
              type="checkbox"
              checked={hasHeader}
              disabled={pending || !text}
              onChange={(event) => {
                const next = event.target.checked;
                setHasHeader(next);
                if (text) loadText(text, next);
              }}
              className="size-3.5 accent-foreground"
            />
            Erste Zeile enthält die Spaltennamen
          </label>
        </div>

        {fileError && (
          <p role="alert" className="text-xs text-destructive">
            {fileError}
          </p>
        )}

        {table && mapping && (
          <div className="grid gap-3 sm:grid-cols-2">
            {IMPORT_FIELDS.map((field) => {
              const column = mapping[field.id];
              const sample = column == null ? "" : sampleCell(table, column);
              return (
                <div key={field.id} className="grid gap-1.5">
                  <Label htmlFor={`${uid}-${field.id}`}>
                    {field.label}
                    {field.required ? " *" : ""}
                  </Label>
                  <select
                    id={`${uid}-${field.id}`}
                    value={column == null ? "" : String(column)}
                    disabled={pending}
                    onChange={(event) => {
                      const value = event.target.value;
                      setMapping((current) =>
                        current
                          ? {
                              ...current,
                              [field.id]: value === "" ? null : Number(value),
                            }
                          : current,
                      );
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm md:h-8"
                  >
                    <option value="">nicht zugeordnet</option>
                    {table.headers.map((header, index) => (
                      <option key={index} value={index}>
                        {header}
                      </option>
                    ))}
                  </select>
                  {sample && (
                    <p data-privacy className="truncate text-xs text-muted-foreground">
                      {sample}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {problem && (
          <p role="alert" className="text-xs text-destructive">
            {problem}
          </p>
        )}

        {shownRows.length > 0 && (
          <div className="max-h-64 overflow-auto rounded-md border text-[13px]">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="border-b bg-surface px-2 py-1.5 text-left text-xs font-medium">
                    Zeile
                  </th>
                  <th className="border-b bg-surface px-2 py-1.5 text-left text-xs font-medium">
                    Inhalt
                  </th>
                </tr>
              </thead>
              <tbody>
                {shownRows.map((row) => (
                  <PreviewLine key={row.line} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stats && (
          <p className="text-xs text-muted-foreground">
            {stats.valid} gültig, {stats.errors} fehlerhaft
            {preview && preview.rows.length > shownRows.length
              ? " · höchstens 100 Zeilen werden gezeigt"
              : ""}
            {stats.errors > 0 ? " — Import erst nach Korrektur möglich." : ""}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-surface px-4 py-3 md:flex-row md:justify-end md:px-5 md:rounded-b-lg">
        <Button type="button" onClick={onCancel} disabled={pending}>
          Abbrechen
        </Button>
        <Button type="submit" variant="primary" disabled={!canImport}>
          {pending ? "Importiere…" : "Importieren"}
        </Button>
      </div>
    </form>
  );
}

function PreviewLine({ row }: { row: CsvPreviewRow }) {
  return (
    <tr className="[&>td]:border-b last:[&>td]:border-b-0">
      <td className="num px-2 py-1.5 align-top text-muted-foreground">{row.line}</td>
      <td className="px-2 py-1.5">
        {row.error ? (
          <span className="text-destructive">{row.error}</span>
        ) : row.data ? (
          <span data-privacy>
            {row.data.category || (row.data.incomeCents > 0 ? "Einnahme" : "Ausgabe")} ·{" "}
            {row.data.description} · {isoToGermanDate(row.data.date)} ·{" "}
            {formatEuro(row.data.incomeCents || row.data.expenseCents)}
          </span>
        ) : null}
      </td>
    </tr>
  );
}
