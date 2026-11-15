import { Plus, ReceiptText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  gefiltert,
  jahr,
  onNeu,
  onReset,
}: {
  gefiltert: boolean;
  jahr: number;
  onNeu: () => void;
  onReset: () => void;
}) {
  const Icon = gefiltert ? Search : ReceiptText;
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex size-10 items-center justify-center rounded-md border bg-surface">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-medium">
        {gefiltert ? "Keine Treffer" : `Noch keine Buchungen in ${jahr}`}
      </p>
      <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">
        {gefiltert
          ? "Zu Suche und Filter passt keine Buchung."
          : "Erfasse die erste Einnahme oder Ausgabe für dieses Jahr."}
      </p>
      <div className="mt-5">
        {gefiltert ? (
          <Button onClick={onReset}>Filter zurücksetzen</Button>
        ) : (
          <Button variant="primary" onClick={onNeu}>
            <Plus /> Neue Buchung
          </Button>
        )}
      </div>
    </div>
  );
}
