"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Buchung } from "@/lib/types";

export function ConfirmDeleteDialog({
  buchung,
  pending,
  onOpenChange,
  onConfirm,
}: {
  buchung: Buchung | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={Boolean(buchung)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buchung löschen?</DialogTitle>
          <DialogDescription>
            {buchung
              ? `„${buchung.bezeichnung}“ wird endgültig entfernt.`
              : "Die Buchung wird endgültig entfernt."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 px-5 py-3 md:flex-row md:justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Löschen…" : "Löschen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
