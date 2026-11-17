"use client";

import { useId, useState } from "react";
import { RadioGroup } from "radix-ui";
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
import { Hint } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";
import { BETRIEB_ARTEN } from "@/lib/business-meta";
import type { Betrieb, BetriebArt } from "@/lib/types";

export type BetriebFormValues = { name: string; art: BetriebArt };

/** Betrieb anlegen oder bearbeiten. Dialog auf dem Desktop, Drawer auf dem Telefon. */
export function BetriebDialog({
  open,
  onOpenChange,
  betrieb,
  canDelete,
  pending,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ohne Betrieb wird ein neuer angelegt */
  betrieb?: Betrieb;
  /** Löschen anbieten (nicht beim letzten Betrieb) */
  canDelete?: boolean;
  pending?: boolean;
  onSubmit: (values: BetriebFormValues) => Promise<Record<string, string> | null>;
  onDelete?: () => void;
}) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const title = betrieb ? "Betrieb bearbeiten" : "Betrieb hinzufügen";
  const description = betrieb
    ? "Name und Art dieser EÜR ändern."
    : "Jeder Betrieb hat eine eigene EÜR mit eigenen Buchungen.";

  const form = (
    <BetriebForm
      key={betrieb?.id ?? "neu"}
      betrieb={betrieb}
      canDelete={canDelete}
      pending={pending}
      onSubmit={onSubmit}
      onDelete={onDelete}
      onCancel={() => onOpenChange(false)}
    />
  );

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {form}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        {form}
      </DrawerContent>
    </Drawer>
  );
}

function BetriebForm({
  betrieb,
  canDelete,
  pending,
  onSubmit,
  onDelete,
  onCancel,
}: {
  betrieb?: Betrieb;
  canDelete?: boolean;
  pending?: boolean;
  onSubmit: (values: BetriebFormValues) => Promise<Record<string, string> | null>;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const [name, setName] = useState(betrieb?.name ?? "");
  const [art, setArt] = useState<BetriebArt>(betrieb?.art ?? "freiberuflich");
  const [error, setError] = useState<string | undefined>();
  const belegt = (betrieb?.anzahlBuchungen ?? 0) > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Name fehlt.");
      document.getElementById(`${uid}-name`)?.focus();
      return;
    }
    const errors = await onSubmit({ name: name.trim(), art });
    if (errors) setError(errors.name ?? errors.art);
  };

  const deleteButton = (
    <Button
      type="button"
      variant="destructive"
      onClick={onDelete}
      disabled={pending || belegt}
    >
      Löschen
    </Button>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col">
      <div className="grid gap-4 px-4 py-4 md:px-5">
        <div className="grid gap-1.5">
          <Label htmlFor={`${uid}-name`}>Name</Label>
          <Input
            id={`${uid}-name`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(undefined);
            }}
            placeholder="z. B. Beratung oder Onlineshop"
            autoComplete="off"
            autoFocus={!betrieb}
            maxLength={60}
            disabled={pending}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${uid}-error` : undefined}
          />
          {error && (
            <p id={`${uid}-error`} role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label id={`${uid}-art`}>Art</Label>
          <RadioGroup.Root
            aria-labelledby={`${uid}-art`}
            value={art}
            onValueChange={(v) => setArt(v as BetriebArt)}
            disabled={pending}
            className="grid grid-cols-2 gap-0.5 rounded-md border bg-surface p-0.5"
          >
            {BETRIEB_ARTEN.map(({ value, label }) => (
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
      </div>

      <div className="flex flex-col-reverse gap-2 border-t bg-surface px-4 py-3 md:flex-row md:items-center md:rounded-b-lg md:px-5">
        {betrieb && canDelete && onDelete &&
          (belegt ? (
            <Hint label="Nur Betriebe ohne Buchungen können gelöscht werden">
              <span tabIndex={0} className="inline-flex">
                {deleteButton}
              </span>
            </Hint>
          ) : (
            deleteButton
          ))}
        <Button type="button" onClick={onCancel} className="md:ml-auto" disabled={pending}>
          Abbrechen
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Speichern…" : betrieb ? "Speichern" : "Hinzufügen"}
        </Button>
      </div>
    </form>
  );
}
