import { Skeleton } from "@/components/ui/skeleton";

const WIDTHS = ["w-40", "w-56", "w-32", "w-48", "w-36", "w-52", "w-44", "w-28"];

export function BuchungenSkeleton() {
  return (
    <div aria-busy="true" aria-label="Buchungen werden geladen">
      <div className="hidden h-9 border-b bg-surface md:block" />
      {WIDTHS.map((w, i) => (
        <div
          key={i}
          className="flex h-14 items-center gap-4 border-b px-4 md:h-10 md:px-3"
        >
          <Skeleton className="hidden h-4 w-24 md:block" />
          <Skeleton className="hidden h-4 w-10 md:block" />
          <Skeleton className={`h-4 ${w} max-w-[50%]`} />
          <Skeleton className="ml-auto h-4 w-20" />
        </div>
      ))}
      <div className="h-11 bg-surface" />
    </div>
  );
}
