"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Etwas ist schiefgelaufen
      </h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Die Seite konnte nicht geladen werden. Finanzdaten werden nicht
        angezeigt.
      </p>
      <Button variant="primary" className="mt-6 w-fit" onClick={reset}>
        Erneut versuchen
      </Button>
    </div>
  );
}
