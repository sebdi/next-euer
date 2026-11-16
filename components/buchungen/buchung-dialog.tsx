"use client";

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
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Buchung, BuchungInput } from "@/lib/types";
import { BuchungForm } from "./buchung-form";

/** Dialog auf dem Desktop, Drawer auf kleinen Bildschirmen */
export function BuchungDialog({
  open,
  pending,
  onOpenChange,
  buchung,
  onSubmit,
  onDelete,
  homeAddress,
}: {
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  buchung?: Buchung;
  onSubmit: (input: BuchungInput) => Promise<Record<string, string> | null>;
  onDelete?: () => void;
  homeAddress?: string | null;
}) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const title = buchung ? "Buchung bearbeiten" : "Neue Buchung";
  const description = buchung
    ? "Angaben der Buchung ändern."
    : "Einnahme oder Ausgabe erfassen.";

  const form = (
    <BuchungForm
      key={buchung?.id ?? "neu"}
      buchung={buchung}
      pending={pending}
      homeAddress={homeAddress}
      onSubmit={onSubmit}
      onCancel={() => onOpenChange(false)}
      onDelete={onDelete}
    />
  );

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
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
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
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
