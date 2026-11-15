import { formatEuro, formatEuroSigned } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Totals({
  einnahmenCent,
  ausgabenCent,
}: {
  einnahmenCent: number;
  ausgabenCent: number;
}) {
  const ergebnis = einnahmenCent - ausgabenCent;

  return (
    <dl className="grid divide-y border-t border-border-strong bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <Cell label="Gesamte Einnahmen">{formatEuro(einnahmenCent)}</Cell>
      <Cell label="Gesamte Ausgaben">{formatEuro(ausgabenCent)}</Cell>
      <Cell label="Gewinn / Verlust" strong>
        <span className={cn(ergebnis > 0 && "text-positive")}>
          {formatEuroSigned(ergebnis)}
        </span>
      </Cell>
    </dl>
  );
}

function Cell({
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
      <dt
        className={cn(
          "text-xs text-muted-foreground",
          strong && "font-medium text-foreground",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "num text-[13px]",
          strong && "text-[15px] font-semibold",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
