"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { saveHomeAddressAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileDialog({
  open,
  homeAddress,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  homeAddress: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (homeAddress: string | null) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
          <DialogDescription>
            Die Wohnadresse kann bei Fahrtkosten als Start oder Ziel gewählt werden.
          </DialogDescription>
        </DialogHeader>
        <ProfileForm
          key={homeAddress ?? ""}
          homeAddress={homeAddress}
          onCancel={() => onOpenChange(false)}
          onSaved={(address) => {
            onSaved(address);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProfileForm({
  homeAddress,
  onCancel,
  onSaved,
}: {
  homeAddress: string | null;
  onCancel: () => void;
  onSaved: (homeAddress: string | null) => void;
}) {
  const uid = useId();
  const [address, setAddress] = useState(homeAddress ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex min-h-0 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        void (async () => {
          try {
            const result = await saveHomeAddressAction(address);
            if (!result.ok) {
              setError(result.fieldErrors?.address ?? result.error);
              return;
            }
            toast.success(
              result.data.homeAddress ? "Wohnadresse gespeichert" : "Wohnadresse entfernt",
            );
            onSaved(result.data.homeAddress);
          } catch {
            setError("Die Adresse konnte nicht gespeichert werden.");
          } finally {
            setPending(false);
          }
        })();
      }}
    >
      <div className="grid gap-1.5 px-4 py-4 md:px-5">
        <Label htmlFor={uid}>Wohnadresse</Label>
        <Input
          id={uid}
          data-privacy
          value={address}
          onChange={(event) => {
            setAddress(event.target.value);
            setError(null);
          }}
          placeholder="z. B. Heidelberg, Hauptstraße 1"
          autoComplete="street-address"
          disabled={pending}
          aria-invalid={Boolean(error)}
        />
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t bg-surface px-4 py-3 md:flex-row md:justify-end md:px-5 md:rounded-b-lg">
        <Button type="button" onClick={onCancel} disabled={pending}>
          Abbrechen
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Speichern…" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
