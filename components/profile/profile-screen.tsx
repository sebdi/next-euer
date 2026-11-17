"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createBusinessAction,
  deleteBusinessAction,
  updateBusinessAction,
} from "@/app/actions/businesses";
import { saveProfileAction } from "@/app/actions/profile";
import {
  BetriebDialog,
  type BetriebFormValues,
} from "@/components/betriebe/betrieb-dialog";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buchungenHref, profilHref, rememberBetrieb } from "@/lib/business-meta";
import { centToInput, formatEuro, formatEuroSigned, formatTaxRate } from "@/lib/format";
import { expectedIncomeTaxCents, parseTaxRateInput } from "@/lib/tax";
import type { AppUser, Betrieb, YearTotals } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProfileScreen({
  user,
  jahr,
  jahre,
  totals,
  homeAddress,
  marginalTaxRateBps,
  loadError,
  anzahlBetriebe = 1,
  betrieb = null,
  betriebe = [],
}: {
  user: AppUser;
  jahr: number;
  jahre: number[];
  totals: YearTotals;
  homeAddress: string | null;
  marginalTaxRateBps: number | null;
  loadError: string | null;
  /** Ab zwei Betrieben wird der gemeinsame Gewinn ausgewiesen */
  anzahlBetriebe?: number;
  betrieb?: Betrieb | null;
  betriebe?: Betrieb[];
}) {
  const mehrereBetriebe = anzahlBetriebe > 1;
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [betriebDialog, setBetriebDialog] = useState<{
    open: boolean;
    betrieb?: Betrieb;
  }>({ open: false });

  const setJahr = (next: number) => {
    startTransition(() => {
      router.push(profilHref(betrieb?.id, next));
    });
  };

  const setBetrieb = (id: string) => {
    if (id === betrieb?.id) return;
    rememberBetrieb(id);
    startTransition(() => {
      router.push(profilHref(id, jahr));
    });
  };

  const handleBetriebSubmit = async (
    values: BetriebFormValues,
  ): Promise<Record<string, string> | null> => {
    if (saving) return { name: "Bitte warten…" };
    setSaving(true);
    try {
      const editing = betriebDialog.betrieb;
      const result = editing
        ? await updateBusinessAction(editing.id, values)
        : await createBusinessAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return result.fieldErrors ?? { name: result.error };
      }
      setBetriebDialog((current) => ({ ...current, open: false }));
      if (editing) {
        toast.success("Betrieb gespeichert");
        startTransition(() => router.refresh());
      } else {
        toast.success(`${result.data.name} angelegt`);
        rememberBetrieb(result.data.id);
        startTransition(() => router.push(profilHref(result.data.id, jahr)));
      }
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleBetriebDelete = async () => {
    const target = betriebDialog.betrieb;
    if (!target || saving) return;
    setSaving(true);
    try {
      const result = await deleteBusinessAction(target.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`${target.name} gelöscht`);
      setBetriebDialog((current) => ({ ...current, open: false }));
      const next = betriebe.find((item) => item.id !== target.id);
      if (next) rememberBetrieb(next.id);
      startTransition(() => router.push(profilHref(next?.id, jahr)));
    } finally {
      setSaving(false);
    }
  };

  const tax = loadError
    ? null
    : expectedIncomeTaxCents(totals.profitCents, marginalTaxRateBps);

  return (
    <div className="min-h-dvh">
      <Header
        jahr={jahr}
        jahre={jahre}
        onJahrChange={setJahr}
        user={user}
        homeHref={buchungenHref(betrieb?.id, jahr)}
        betrieb={
          betrieb
            ? {
                betrieb,
                betriebe,
                onSelect: setBetrieb,
                onAdd: () => setBetriebDialog({ open: true }),
                onEdit: () => setBetriebDialog({ open: true, betrieb }),
              }
            : undefined
        }
      />
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 md:px-6 md:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          <span data-privacy>{user.name}</span>
          {user.login ? (
            <span data-privacy> · @{user.login}</span>
          ) : null}
        </p>

        <section
          aria-label={`Steuerschätzung ${jahr}`}
          className="mt-6 rounded-md border"
        >
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">Erwartete Steuer {jahr}</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {mehrereBetriebe
                ? `Gewinn aller ${anzahlBetriebe} Betriebe zusammen`
                : "Gewinn dieses Jahres"}{" "}
              mal deinem Grenzsteuersatz. Solidaritätszuschlag,
              Kirchensteuer und weitere Einkünfte sind nicht enthalten.
            </p>
          </div>
          {loadError ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">{loadError}</p>
          ) : (
            <dl className="grid divide-y bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <Stat label={mehrereBetriebe ? "Gewinn / Verlust gesamt" : "Gewinn / Verlust"}>
                <span className={cn(totals.profitCents > 0 && "text-positive")}>
                  {formatEuroSigned(totals.profitCents)}
                </span>
              </Stat>
              <Stat label="Grenzsteuersatz">
                {marginalTaxRateBps == null ? "nicht hinterlegt" : formatTaxRate(marginalTaxRateBps)}
              </Stat>
              <Stat label="Erwartete Steuer" strong>
                {tax == null ? "–" : formatEuro(tax)}
              </Stat>
            </dl>
          )}
          {!loadError && totals.profitCents < 0 && (
            <p className="border-t px-4 py-3 text-xs text-muted-foreground">
              Bei einem Verlust wird keine Einkommensteuer angesetzt.
            </p>
          )}
        </section>

        <section aria-label="Einstellungen" className="mt-6 rounded-md border">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">Einstellungen</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Die Wohnadresse kann bei Fahrtkosten als Start oder Ziel gewählt werden.
            </p>
          </div>
          <SettingsForm
            key={`${homeAddress ?? ""}:${marginalTaxRateBps ?? ""}`}
            homeAddress={homeAddress}
            marginalTaxRateBps={marginalTaxRateBps}
          />
        </section>
      </main>
      <BetriebDialog
        open={betriebDialog.open}
        onOpenChange={(open) => setBetriebDialog((current) => ({ ...current, open }))}
        betrieb={betriebDialog.betrieb}
        canDelete={betriebe.length > 1}
        pending={saving}
        onSubmit={handleBetriebSubmit}
        onDelete={handleBetriebDelete}
      />
    </div>
  );
}

function Stat({
  label,
  strong,
  children,
}: {
  label: string;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3 sm:px-3">
      <dt className={cn("text-xs text-muted-foreground", strong && "font-medium text-foreground")}>
        {label}
      </dt>
      <dd
        data-privacy="strong"
        className={cn("num text-[13px]", strong && "text-[15px] font-semibold")}
      >
        {children}
      </dd>
    </div>
  );
}

function SettingsForm({
  homeAddress,
  marginalTaxRateBps,
}: {
  homeAddress: string | null;
  marginalTaxRateBps: number | null;
}) {
  const router = useRouter();
  const addressId = useId();
  const rateId = useId();
  const [address, setAddress] = useState(homeAddress ?? "");
  const [taxRate, setTaxRate] = useState(
    marginalTaxRateBps == null ? "" : centToInput(marginalTaxRateBps),
  );
  const [errors, setErrors] = useState<{ address?: string; taxRate?: string }>({});
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-4 px-4 py-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        void (async () => {
          try {
            const result = await saveProfileAction({ address, taxRate });
            if (!result.ok) {
              setErrors({
                address: result.fieldErrors?.address,
                taxRate: result.fieldErrors?.taxRate,
              });
              toast.error(result.error);
              return;
            }
            toast.success("Profil gespeichert");
            router.refresh();
          } catch {
            toast.error("Das Profil konnte nicht gespeichert werden.");
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor={addressId}>Wohnadresse</Label>
        <Input
          id={addressId}
          data-privacy
          value={address}
          onChange={(event) => {
            setAddress(event.target.value);
            setErrors((current) => ({ ...current, address: undefined }));
          }}
          placeholder="z. B. Heidelberg, Hauptstraße 1"
          autoComplete="street-address"
          disabled={pending}
          aria-invalid={Boolean(errors.address)}
        />
        {errors.address && (
          <p role="alert" className="text-xs text-destructive">
            {errors.address}
          </p>
        )}
      </div>
      <div className="grid max-w-xs gap-1.5">
        <Label htmlFor={rateId}>Grenzsteuersatz in %</Label>
        <Input
          id={rateId}
          data-privacy="strong"
          value={taxRate}
          onChange={(event) => {
            setTaxRate(event.target.value);
            setErrors((current) => ({ ...current, taxRate: undefined }));
          }}
          onBlur={() => {
            const parsed = parseTaxRateInput(taxRate);
            if (typeof parsed === "number") setTaxRate(centToInput(parsed));
          }}
          placeholder="z. B. 42"
          inputMode="decimal"
          autoComplete="off"
          disabled={pending}
          aria-invalid={Boolean(errors.taxRate)}
          className="num"
        />
        {errors.taxRate ? (
          <p role="alert" className="text-xs text-destructive">
            {errors.taxRate}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Leer lassen, um den Satz zu entfernen.
          </p>
        )}
      </div>
      <div>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Speichern…" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
