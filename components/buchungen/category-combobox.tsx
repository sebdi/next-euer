"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KATEGORIEN, getKategorie } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryCombobox({
  value,
  onChange,
  allowAll = false,
  placeholder = "Kategorie wählen",
  className,
  ...props
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  /** Zeigt „Alle Kategorien“ als erste Option (für Filter) */
  allowAll?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? getKategorie(value) : undefined;

  const select = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={open}
        data-privacy
        className={cn(
          "inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-base transition-colors duration-150 hover:border-border-strong aria-invalid:border-destructive md:h-8 md:text-sm",
          className,
        )}
        {...props}
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.name : allowAll ? "Alle Kategorien" : placeholder}
        </span>
        <ChevronsUpDown
          className="size-3.5 shrink-0 text-subtle-foreground"
          aria-hidden
        />
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        <Command>
          <CommandInput placeholder="Kategorie suchen…" />
          <CommandList>
            <CommandEmpty>Keine Kategorie gefunden.</CommandEmpty>
            {allowAll && (
              <>
                <CommandItem value="Alle Kategorien" onSelect={() => select(null)}>
                  <span className="flex-1">Alle Kategorien</span>
                  {!value && <Check className="size-3.5" aria-hidden />}
                </CommandItem>
                <CommandSeparator />
              </>
            )}
            {KATEGORIEN.map((k) => (
              <CommandItem
                key={k.id}
                value={`${k.name} ${k.konto}`}
                onSelect={() => select(k.id)}
              >
                <span className="flex-1 truncate">{k.name}</span>
                {value === k.id && <Check className="size-3.5" aria-hidden />}
                <span className="num text-xs text-subtle-foreground">
                  {k.konto}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
