"use client";

import { useId, useState } from "react";
import { RadioGroup } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryCombobox } from "./category-combobox";
import { getKategorie } from "@/lib/categories";
import { centToInput, heuteIso, parseBetrag } from "@/lib/format";
import type { Buchung, BuchungInput, BuchungTyp } from "@/lib/types";

type Errors = Partial<
  Record<"bezeichnung" | "kategorie" | "datum" | "betrag", string>
>;

export function BuchungForm({
  buchung,
  onSubmit,
  onCancel,
  onDelete,
}: {
  buchung?: Buchung;
  onSubmit: (input: BuchungInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const uid = useId();
  const [typ, setTyp] = useState<BuchungTyp>(buchung?.typ ?? "ausgabe");
  const [bezeichnung, setBezeichnung] = useState(buchung?.bezeichnung ?? "");
  const [kategorieId, setKategorieId] = useState<string | null>(
    buchung?.kategorieId ?? null,
  );
  const [datum, setDatum] = useState(buchung?.datum ?? heuteIso());
  const [betrag, setBetrag] = useState(
    buchung ? centToInput(buchung.betragCent) : "",
  );
  const [errors, setErrors] = useState<Errors>({});

  const clear = (key: keyof Errors) =>
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cent = parseBetrag(betrag);
    const next: Errors = {};
    if (!bezeichnung.trim()) next.bezeichnung = "Bezeichnung fehlt.";
    if (!kategorieId) next.kategorie = "Kategorie wählen.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) next.datum = "Datum fehlt.";
    if (cent === null) next.betrag = "Betrag wie 1.234,56 eingeben.";
    else if (cent <= 0) next.betrag = "Betrag muss größer als 0 sein.";
    setErrors(next);

    const firstInvalid = (
      ["bezeichnung", "kategorie", "datum", "betrag"] as const
    ).find((k) => next[k]);
    if (firstInvalid) {
      document.getElementById(`${uid}-${firstInvalid}`)?.focus();
      return;
    }
    onSubmit({
      typ,
      bezeichnung: bezeichnung.trim(),
      kategorieId: kategorieId!,
      datum,
      betragCent: cent!,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-col">
      <div className="grid gap-4 overflow-y-auto px-4 py-4 md:px-5">
        <RadioGroup.Root
          aria-label="Art der Buchung"
          value={typ}
          onValueChange={(v) => setTyp(v as BuchungTyp)}
          className="grid grid-cols-2 gap-0.5 rounded-md border bg-surface p-0.5"
        >
          {(
            [
              ["ausgabe", "Ausgabe"],
              ["einnahme", "Einnahme"],
            ] as const
          ).map(([value, label]) => (
            <RadioGroup.Item
              key={value}
              value={value}
              className="h-9 rounded-sm text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-[0_0_0_1px_var(--border)] md:h-7 md:text-[13px]"
            >
              {label}
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>

        <Field id={`${uid}-bezeichnung`} label="Bezeichnung" error={errors.bezeichnung}>
          {(field) => (
            <Input
              {...field}
              value={bezeichnung}
              onChange={(e) => {
                setBezeichnung(e.target.value);
                clear("bezeichnung");
              }}
              placeholder="z. B. Bahnfahrt München"
              autoComplete="off"
              autoFocus={!buchung}
            />
          )}
        </Field>

        <Field id={`${uid}-kategorie`} label="Kategorie" error={errors.kategorie}>
          {(field) => (
            <CategoryCombobox
              {...field}
              value={kategorieId}
              onChange={(id) => {
                setKategorieId(id);
                clear("kategorie");
                const k = id ? getKategorie(id) : undefined;
                if (k) setTyp(k.typ);
              }}
            />
          )}
        </Field>

        <div className="grid grid-cols-2 items-start gap-3">
          <Field id={`${uid}-datum`} label="Datum" error={errors.datum}>
            {(field) => (
              <Input
                {...field}
                type="date"
                value={datum}
                onChange={(e) => {
                  setDatum(e.target.value);
                  clear("datum");
                }}
                className="num"
              />
            )}
          </Field>
          <Field id={`${uid}-betrag`} label="Betrag in €" error={errors.betrag}>
            {(field) => (
              <Input
                {...field}
                value={betrag}
                onChange={(e) => {
                  setBetrag(e.target.value);
                  clear("betrag");
                }}
                onBlur={() => {
                  const cent = parseBetrag(betrag);
                  if (cent !== null) setBetrag(centToInput(cent));
                }}
                inputMode="decimal"
                placeholder="0,00"
                autoComplete="off"
                className="num text-right"
              />
            )}
          </Field>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t bg-surface px-4 py-3 md:flex-row md:items-center md:px-5 md:rounded-b-lg">
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Löschen
          </Button>
        )}
        <Button type="button" onClick={onCancel} className="md:ml-auto">
          Abbrechen
        </Button>
        <Button type="submit" variant="primary">
          {buchung ? "Speichern" : "Buchung anlegen"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: (field: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
