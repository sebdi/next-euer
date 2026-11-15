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
import { validateCsvText, type CsvPreviewRow } from "@/lib/csv";
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
  onImport: (file: File) => Promise<void>;
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>CSV importieren</DialogTitle>
            <DialogDescription>
              Vorschau prüfen, dann gültige Zeilen übernehmen.
            </DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>CSV importieren</DrawerTitle>
          <DrawerDescription>
            Vorschau prüfen, dann gültige Zeilen übernehmen.
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
  onImport: (file: File) => Promise<void>;
}) {
  const uid = useId();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreviewRow[] | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!preview) return null;
    const errors = preview.filter((r) => r.error).length;
    const valid = preview.filter((r) => r.data).length;
    return { errors, valid };
  }, [preview]);

  const handleFile = async (next: File | null) => {
    setFile(next);
    setPreview(null);
    setHeaderError(null);
    if (!next) return;
    const text = await next.text();
    const result = validateCsvText(text);
    if (!result.headersOk) {
      setHeaderError(result.rows[0]?.error ?? "Ungültige Datei.");
      return;
    }
    setPreview(result.rows);
  };

  const canImport =
    Boolean(file) &&
    !headerError &&
    (stats?.valid ?? 0) > 0 &&
    (stats?.errors ?? 0) === 0 &&
    !pending;

  return (
    <form
      className="flex min-h-0 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (!file || !canImport) return;
        void onImport(file);
      }}
    >
      <div className="grid gap-4 overflow-y-auto px-4 py-4 md:px-5">
        <div className="grid gap-1.5">
          <Label htmlFor={uid}>CSV-Datei</Label>
          <Input
            id={uid}
            type="file"
            accept=".csv,text/csv,text/plain"
            disabled={pending}
            onChange={(e) => {
              void handleFile(e.target.files?.[0] ?? null);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Semikolon-getrennt, UTF-8, Spalten Art; Konto; Bezeichnung; Datum;
            Einnahmen; Ausgaben.
          </p>
        </div>

        {headerError && (
          <p role="alert" className="text-xs text-destructive">
            {headerError}
          </p>
        )}

        {preview && (
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
                {preview.map((row) => (
                  <tr key={row.line} className="[&>td]:border-b last:[&>td]:border-b-0">
                    <td className="num px-2 py-1.5 align-top text-muted-foreground">
                      {row.line}
                    </td>
                    <td className="px-2 py-1.5">
                      {row.error ? (
                        <span className="text-destructive">{row.error}</span>
                      ) : row.data ? (
                        <span>
                          {row.data.category} · {row.data.description} ·{" "}
                          {isoToGermanDate(row.data.date)} ·{" "}
                          {formatEuro(
                            row.data.incomeCents || row.data.expenseCents,
                          )}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {stats && (
          <p className="text-xs text-muted-foreground">
            {stats.valid} gültig, {stats.errors} fehlerhaft
            {stats.errors > 0 ? " — Import erst nach Korrektur möglich." : ""}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t bg-surface px-4 py-3 md:flex-row md:justify-end md:px-5 md:rounded-b-lg">
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
