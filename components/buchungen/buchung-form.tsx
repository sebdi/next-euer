"use client";

import { useId, useMemo, useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { RadioGroup } from "radix-ui";
import { House } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { filterTexts, type EntrySuggestions } from "@/lib/suggestions";
import { CategoryCombobox } from "./category-combobox";
import { SuggestInput } from "./suggest-input";
import {
  defaultAccountForCategory,
  defaultTypForCategory,
  getKategorie,
} from "@/lib/categories";
import { calculateRouteAction } from "@/app/actions/distance";
import {
  DEFAULT_KM_RATE_CENTS,
  fahrtkostenCents,
  formatKilometers,
  tripDistanceMeters,
} from "@/lib/distance/fare";
import { centToInput, formatEuro, heuteIso, parseBetrag } from "@/lib/format";
import { bewirtungAbziehbarCents } from "@/lib/money";
import { betriebArtLabel } from "@/lib/business-meta";
import type { Betrieb, Buchung, BuchungInput, BuchungTyp } from "@/lib/types";

type Errors = Partial<
  Record<
    | "bezeichnung"
    | "kategorie"
    | "datum"
    | "betrag"
    | "konto"
    | "route"
    | "rate"
    | "rechnungsnummer"
    | "betrieb",
    string
  >
>;

type RouteQuote = {
  origin: string;
  destination: string;
  rateCentsPerKm: number;
  distanceMeters: number;
};

function routeAmount(quote: RouteQuote, roundTrip: boolean): number {
  return fahrtkostenCents(
    tripDistanceMeters(quote.distanceMeters, roundTrip),
    quote.rateCentsPerKm,
  );
}

function initialQuote(buchung?: Buchung): RouteQuote | null {
  if (
    !buchung?.routeOrigin ||
    !buchung.routeDestination ||
    buchung.distanceMeters == null ||
    buchung.rateCentsPerKm == null
  ) {
    return null;
  }
  return {
    origin: buchung.routeOrigin,
    destination: buchung.routeDestination,
    rateCentsPerKm: buchung.rateCentsPerKm,
    distanceMeters: buchung.distanceMeters,
  };
}

export function BuchungForm({
  buchung,
  pending,
  onSubmit,
  onCancel,
  onDelete,
  homeAddress,
  suggestions,
  betriebe = [],
  betriebId = "",
}: {
  buchung?: Buchung;
  pending?: boolean;
  onSubmit: (
    input: BuchungInput,
    betriebId: string,
  ) => Promise<Record<string, string> | null>;
  /** Alle Betriebe; das Feld erscheint erst ab zwei */
  betriebe?: Betrieb[];
  /** Aktiver Betrieb, Vorbelegung für das Feld */
  betriebId?: string;
  onCancel: () => void;
  onDelete?: () => void;
  homeAddress?: string | null;
  suggestions: EntrySuggestions;
}) {
  const uid = useId();
  const desktop = useMediaQuery("(min-width: 768px)");
  const [typ, setTyp] = useState<BuchungTyp>(buchung?.typ ?? "ausgabe");
  const [bezeichnung, setBezeichnung] = useState(buchung?.bezeichnung ?? "");
  const [kategorieId, setKategorieId] = useState<string | null>(
    buchung && buchung.typ !== "einnahme" ? buchung.kategorieId || null : null,
  );
  const [rechnungsnummer, setRechnungsnummer] = useState(buchung?.rechnungsnummer ?? "");
  const [konto, setKonto] = useState(buchung?.konto ?? "");
  const [datum, setDatum] = useState(buchung?.datum ?? heuteIso());
  const [betrag, setBetrag] = useState(
    buchung ? centToInput(buchung.bruttoCent ?? buchung.betragCent) : "",
  );
  const [routeFrom, setRouteFrom] = useState(buchung?.routeOrigin ?? "");
  const [routeTo, setRouteTo] = useState(buchung?.routeDestination ?? "");
  const [rate, setRate] = useState(
    centToInput(buchung?.rateCentsPerKm ?? DEFAULT_KM_RATE_CENTS),
  );
  const [quote, setQuote] = useState<RouteQuote | null>(() => initialQuote(buchung));
  const [roundTrip, setRoundTrip] = useState(buchung?.roundTrip === true);
  const [calculating, setCalculating] = useState(false);
  const [zielBetrieb, setZielBetrieb] = useState(betriebId);
  const [errors, setErrors] = useState<Errors>({});

  const clear = (key: keyof Errors) =>
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));

  const fillHome = (target: "from" | "to") => {
    if (!homeAddress) {
      toast.error("Wohnadresse fehlt. Lege sie unter Einstellungen an.");
      return;
    }
    if (target === "from") setRouteFrom(homeAddress);
    else setRouteTo(homeAddress);
    clear("route");
  };

  const erfasstBrutto =
    kategorieId === "Bewirtungskosten" &&
    typ === "ausgabe" &&
    (!buchung ||
      buchung.kategorieId !== "Bewirtungskosten" ||
      buchung.bruttoCent != null);
  const geparsterBetrag = parseBetrag(betrag);
  const rateCents = parseBetrag(rate);
  const fahrtkosten =
    kategorieId === "Fahrtkosten" && typ === "ausgabe";
  const activeQuote =
    fahrtkosten &&
    quote &&
    quote.origin === routeFrom.trim() &&
    quote.destination === routeTo.trim() &&
    rateCents === quote.rateCentsPerKm
      ? quote
      : null;
  const abziehbar =
    erfasstBrutto && geparsterBetrag != null && geparsterBetrag > 0
      ? bewirtungAbziehbarCents(geparsterBetrag)
      : null;
  const passendeBuchungen = useMemo(
    () => suggestions.bookings.filter((row) => row.typ === typ),
    [suggestions.bookings, typ],
  );
  const bezeichnungVorschlaege = useMemo(
    () => filterTexts(passendeBuchungen.map((row) => row.bezeichnung), bezeichnung),
    [passendeBuchungen, bezeichnung],
  );
  const kontoVorschlaege = useMemo(
    () =>
      filterTexts(
        typ === "einnahme" ? suggestions.incomeAccounts : suggestions.expenseAccounts,
        konto,
      ),
    [suggestions.expenseAccounts, suggestions.incomeAccounts, konto, typ],
  );
  const rechnungsVorschlaege = useMemo(
    () => filterTexts(suggestions.invoices, rechnungsnummer),
    [suggestions.invoices, rechnungsnummer],
  );
  const startVorschlaege = useMemo(
    () => filterTexts([homeAddress ?? "", ...suggestions.origins], routeFrom),
    [homeAddress, suggestions.origins, routeFrom],
  );
  const zielVorschlaege = useMemo(
    () => filterTexts([homeAddress ?? "", ...suggestions.destinations], routeTo),
    [homeAddress, suggestions.destinations, routeTo],
  );

  const applyBezeichnung = (value: string) => {
    setBezeichnung(value);
    clear("bezeichnung");
    const row = passendeBuchungen.find((item) => item.bezeichnung === value);
    if (!row) return;
    if (typ === "ausgabe" && !kategorieId && row.kategorieId) {
      setKategorieId(row.kategorieId);
    }
    setKonto((prev) => {
      const previousDefault = kategorieId ? defaultAccountForCategory(kategorieId) : "";
      if (prev.trim() && prev !== previousDefault) return prev;
      return row.konto;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cent = parseBetrag(betrag);
    const next: Errors = {};
    if (!bezeichnung.trim()) next.bezeichnung = "Bezeichnung fehlt.";
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
    let serverErrors: Record<string, string> | null = null;
    try {
      const brutto = erfasstBrutto ? cent! : undefined;
      serverErrors = await onSubmit({
        typ,
        bezeichnung: bezeichnung.trim(),
        kategorieId: typ === "einnahme" ? "" : (kategorieId ?? ""),
        rechnungsnummer:
          typ === "einnahme" ? rechnungsnummer.trim() || undefined : undefined,
        konto: konto.trim(),
        datum,
        betragCent: brutto != null ? bewirtungAbziehbarCents(brutto) : cent!,
        bruttoCent: brutto,
        ...(activeQuote
          ? {
              routeOrigin: activeQuote.origin,
              routeDestination: activeQuote.destination,
              distanceMeters: activeQuote.distanceMeters,
              rateCentsPerKm: activeQuote.rateCentsPerKm,
              roundTrip,
            }
          : {}),
      }, zielBetrieb);
    } catch {
      setErrors({ bezeichnung: "Die Buchung konnte nicht gespeichert werden." });
      return;
    }
    if (serverErrors) {
      const mapped: Errors = {
        bezeichnung: serverErrors.bezeichnung,
        kategorie: serverErrors.kategorieId ?? serverErrors.kategorie,
        datum: serverErrors.datum,
        betrag: serverErrors.betragCent ?? serverErrors.betrag,
        konto: serverErrors.konto,
        rechnungsnummer: serverErrors.rechnungsnummer,
        betrieb: serverErrors.betrieb,
      };
      setErrors(mapped);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        "flex flex-col",
        !desktop && "min-h-0 flex-1 overflow-hidden",
      )}
    >
      <div className="shrink-0 px-4 pt-4 md:px-5">
        <RadioGroup.Root
          aria-label="Art der Buchung"
          value={typ}
          onValueChange={(v) => {
            const next = v as BuchungTyp;
            setTyp(next);
            if (next === "einnahme") {
              setKonto((prev) => {
                const previousDefault = kategorieId
                  ? defaultAccountForCategory(kategorieId)
                  : "";
                return !prev || prev === previousDefault ? "" : prev;
              });
              setKategorieId(null);
              clear("kategorie");
            }
          }}
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
      </div>
      <div
        data-vaul-no-drag
        className={cn(
          "grid gap-4 px-4 py-4 md:px-5",
          !desktop &&
            "min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y",
        )}
      >
        {betriebe.length > 1 && (
          <Field
            id={`${uid}-betrieb`}
            label="Betrieb"
            error={errors.betrieb}
            hint={
              buchung && zielBetrieb !== betriebId
                ? "Die Buchung wird in diesen Betrieb verschoben."
                : buchung
                  ? "Anderer Betrieb verschiebt die Buchung."
                  : undefined
            }
          >
            {(field) => (
              <select
                {...field}
                value={zielBetrieb}
                disabled={pending}
                onChange={(event) => {
                  setZielBetrieb(event.target.value);
                  clear("betrieb");
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-2.5 text-sm md:h-8"
              >
                {betriebe.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name === betriebArtLabel(b.art)
                      ? b.name
                      : `${b.name} · ${betriebArtLabel(b.art)}`}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
        <Field id={`${uid}-bezeichnung`} label="Bezeichnung" error={errors.bezeichnung}>
          {(field) => (
            <SuggestInput
              {...field}
              data-privacy
              suggestions={bezeichnungVorschlaege}
              value={bezeichnung}
              onValueChange={applyBezeichnung}
              placeholder="z. B. Bahnfahrt München"
              autoFocus={!buchung && desktop}
              disabled={pending}
            />
          )}
        </Field>

        {typ === "einnahme" && (
          <Field
            id={`${uid}-rechnung`}
            label="Rechnungsnummer"
            error={errors.rechnungsnummer}
          >
            {(field) => (
              <SuggestInput
                {...field}
                data-privacy
                suggestions={rechnungsVorschlaege}
                value={rechnungsnummer}
                onValueChange={(value) => {
                  setRechnungsnummer(value);
                  clear("rechnungsnummer");
                }}
                placeholder="optional"
                disabled={pending}
              />
            )}
          </Field>
        )}

        {typ === "ausgabe" && (
        <Field id={`${uid}-kategorie`} label="Kategorie" error={errors.kategorie}>
          {(field) => (
            <CategoryCombobox
              {...field}
              allowEmpty
              placeholder="optional"
              value={kategorieId}
              onChange={(id) => {
                setKategorieId(id);
                clear("kategorie");
                const k = id ? getKategorie(id) : undefined;
                setKonto((prev) => {
                  const previousDefault = kategorieId
                    ? defaultAccountForCategory(kategorieId)
                    : "";
                  if (prev && prev !== previousDefault) return prev;
                  return k?.konto ?? "";
                });
                if (k) setTyp(defaultTypForCategory(k.id));
              }}
            />
          )}
        </Field>
        )}

        {fahrtkosten && (
          <div className="grid gap-3 rounded-md border bg-surface p-3">
            <Field id={`${uid}-start`} label="Start" error={errors.route}>
              {(field) => (
                <div className="flex items-start gap-2">
                  <SuggestInput
                    {...field}
                    wrapperClassName="min-w-0 flex-1"
                    data-privacy
                    suggestions={startVorschlaege}
                    value={routeFrom}
                    onValueChange={(value) => {
                      setRouteFrom(value);
                      clear("route");
                    }}
                    placeholder="z. B. Heidelberg, Hauptstraße 1"
                    disabled={pending || calculating}
                  />
                  <Button
                    type="button"
                    className="shrink-0"
                    disabled={pending || calculating}
                    onClick={() => fillHome("from")}
                  >
                    <House /> Zuhause
                  </Button>
                </div>
              )}
            </Field>
            <Field id={`${uid}-ziel`} label="Ziel">
              {(field) => (
                <div className="flex items-start gap-2">
                  <SuggestInput
                    {...field}
                    wrapperClassName="min-w-0 flex-1"
                    data-privacy
                    suggestions={zielVorschlaege}
                    value={routeTo}
                    onValueChange={(value) => {
                      setRouteTo(value);
                      clear("route");
                    }}
                    placeholder="z. B. Stuttgart Hbf"
                    disabled={pending || calculating}
                  />
                  <Button
                    type="button"
                    className="shrink-0"
                    disabled={pending || calculating}
                    onClick={() => fillHome("to")}
                  >
                    <House /> Zuhause
                  </Button>
                </div>
              )}
            </Field>
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <input
                type="checkbox"
                checked={roundTrip}
                disabled={pending || calculating}
                onChange={(event) => {
                  const next = event.target.checked;
                  setRoundTrip(next);
                  if (activeQuote) {
                    setBetrag(centToInput(routeAmount(activeQuote, next)));
                    clear("betrag");
                  }
                }}
                className="size-3.5 accent-foreground"
              />
              Hin und zurück
            </label>
            <div className="flex items-end gap-2">
              <Field
                id={`${uid}-rate`}
                label="Pauschale €/km"
                error={errors.rate}
                className="min-w-0 flex-1"
              >
                {(field) => (
                  <Input
                    {...field}
                    data-privacy="strong"
                    value={rate}
                    onChange={(e) => {
                      setRate(e.target.value);
                      clear("rate");
                    }}
                    onBlur={() => {
                      const cent = parseBetrag(rate);
                      if (cent !== null) setRate(centToInput(cent));
                    }}
                    inputMode="decimal"
                    placeholder="0,30"
                    autoComplete="off"
                    className="num text-right"
                    disabled={pending || calculating}
                  />
                )}
              </Field>
              <Button
                type="button"
                className="mb-px shrink-0"
                disabled={pending || calculating || !routeFrom.trim() || !routeTo.trim()}
                onClick={() => {
                  void (async () => {
                    const cents = rate.trim()
                      ? parseBetrag(rate)
                      : DEFAULT_KM_RATE_CENTS;
                    if (cents == null || cents <= 0) {
                      setErrors((current) => ({
                        ...current,
                        rate: "Pauschale wie 0,30 eingeben.",
                      }));
                      return;
                    }
                    setCalculating(true);
                    try {
                      const result = await calculateRouteAction({
                        origin: routeFrom,
                        destination: routeTo,
                        rateCentsPerKm: cents,
                        roundTrip,
                      });
                      if (!result.ok) {
                        setErrors((current) => ({
                          ...current,
                          route:
                            result.fieldErrors?.origin ??
                            result.fieldErrors?.destination ??
                            result.error,
                          rate: result.fieldErrors?.rateCentsPerKm,
                        }));
                        return;
                      }
                      setQuote({
                        origin: routeFrom.trim(),
                        destination: routeTo.trim(),
                        rateCentsPerKm: result.data.rateCentsPerKm,
                        distanceMeters: result.data.distanceMeters,
                      });
                      setBetrag(centToInput(result.data.amountCents));
                      clear("betrag");
                      clear("route");
                      clear("rate");
                    } catch {
                      setErrors((current) => ({
                        ...current,
                        route: "Die Entfernung konnte nicht berechnet werden.",
                      }));
                    } finally {
                      setCalculating(false);
                    }
                  })();
                }}
              >
                {calculating ? "Berechne…" : "Berechnen"}
              </Button>
            </div>
            {activeQuote && (
              <p data-privacy="strong" className="text-xs text-muted-foreground">
                {formatKilometers(activeQuote.distanceMeters)}
                {roundTrip ? " × 2" : ""} × {formatEuro(activeQuote.rateCentsPerKm)}
                /km = {formatEuro(routeAmount(activeQuote, roundTrip))}
              </p>
            )}
          </div>
        )}

        <Field id={`${uid}-konto`} label="Konto" error={errors.konto}>
          {(field) => (
            <SuggestInput
              {...field}
              data-privacy
              suggestions={kontoVorschlaege}
              value={konto}
              onValueChange={(value) => {
                setKonto(value);
                clear("konto");
              }}
              placeholder="optional"
              disabled={pending}
              className="num"
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
                disabled={pending}
              />
            )}
          </Field>
          <Field
            id={`${uid}-betrag`}
            label={erfasstBrutto ? "Bruttobetrag in €" : "Betrag in €"}
            error={errors.betrag}
            hint={
              abziehbar != null && abziehbar > 0
                ? `Erfasst werden 70 %: ${formatEuro(abziehbar)}`
                : undefined
            }
          >
            {(field) => (
              <Input
                {...field}
                data-privacy="strong"
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
                disabled={pending}
              />
            )}
          </Field>
        </div>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-surface px-4 py-3 md:flex-row md:items-center md:px-5 md:rounded-b-lg">
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={pending}>
            Löschen
          </Button>
        )}
        <Button type="button" onClick={onCancel} className="md:ml-auto" disabled={pending}>
          Abbrechen
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending
            ? "Speichern…"
            : buchung
              ? "Speichern"
              : "Buchung anlegen"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: (field: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={`grid content-start gap-1.5 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} data-privacy="strong" className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
