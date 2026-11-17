"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Pencil, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { betriebArtLabel } from "@/lib/business-meta";
import type { Betrieb } from "@/lib/types";
import { cn } from "@/lib/utils";

export type BetriebSwitcherProps = {
  betrieb: Betrieb;
  betriebe: Betrieb[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: () => void;
};

/** Breadcrumb-Segment zur Wahl des Betriebs (ab md) */
export function BetriebSwitcher({
  betrieb,
  betriebe,
  onSelect,
  onAdd,
  onEdit,
}: BetriebSwitcherProps) {
  const [open, setOpen] = useState(false);
  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={`Betrieb: ${betrieb.name}`}
        className="inline-flex h-8 max-w-56 items-center gap-1.5 rounded-md border border-transparent px-2 text-[13px] font-medium transition-colors duration-150 hover:border-input data-[state=open]:border-input"
      >
        <span className="truncate">{betrieb.name}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <Command>
          {betriebe.length > 5 && <CommandInput placeholder="Betrieb suchen…" />}
          <CommandList>
            <CommandEmpty>Kein Betrieb gefunden.</CommandEmpty>
            {betriebe.map((b) => (
              <CommandItem
                key={b.id}
                value={`${b.name} ${b.id}`}
                onSelect={() => run(() => onSelect(b.id))}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{b.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {betriebArtLabel(b.art)}
                  </span>
                </span>
                {b.id === betrieb.id && <Check className="size-3.5" aria-hidden />}
              </CommandItem>
            ))}
            <CommandSeparator />
            <CommandItem value="__edit" onSelect={() => run(onEdit)}>
              <Pencil className="size-3.5 text-muted-foreground" aria-hidden />
              Betrieb bearbeiten
            </CommandItem>
            <CommandItem value="__add" onSelect={() => run(onAdd)}>
              <Plus className="size-3.5 text-muted-foreground" aria-hidden />
              Betrieb hinzufügen
            </CommandItem>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Ein Knopf „Betrieb · Jahr“ mit Drawer für Betrieb und Jahr (unter md) */
export function BetriebJahrMobile({
  betrieb,
  betriebe,
  onSelect,
  onAdd,
  onEdit,
  jahr,
  jahre,
  onJahrChange,
}: BetriebSwitcherProps & {
  jahr: number;
  jahre: number[];
  onJahrChange: (jahr: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Betrieb ${betrieb.name}, Jahr ${jahr}`}
        className="inline-flex h-10 min-w-0 items-center gap-1.5 rounded-md px-2 text-[13px] transition-colors duration-150 active:bg-accent"
      >
        <span className="truncate font-medium">{betrieb.name}</span>
        <span className="text-border-strong" aria-hidden>·</span>
        <span className="num shrink-0">{jahr}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Betrieb und Jahr</DrawerTitle>
            <DrawerDescription>Welche EÜR möchtest du sehen?</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto overscroll-contain px-4 pt-3 pb-6">
            <p className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">Betrieb</p>
            <ul className="divide-y rounded-md border">
              {betriebe.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => run(() => onSelect(b.id))}
                    aria-pressed={b.id === betrieb.id}
                    className="flex min-h-12 w-full items-center gap-3 px-3 text-left active:bg-surface"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{b.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {betriebArtLabel(b.art)}
                      </span>
                    </span>
                    {b.id === betrieb.id && <Check className="size-4" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => run(onEdit)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border text-sm active:bg-accent"
              >
                <Pencil className="size-3.5 text-muted-foreground" aria-hidden /> Bearbeiten
              </button>
              <button
                type="button"
                onClick={() => run(onAdd)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border text-sm active:bg-accent"
              >
                <Plus className="size-3.5 text-muted-foreground" aria-hidden /> Hinzufügen
              </button>
            </div>

            <p className="px-1 pt-5 pb-1.5 text-xs font-medium text-muted-foreground">Jahr</p>
            <div className="grid grid-cols-4 gap-2">
              {jahre.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => run(() => onJahrChange(j))}
                  aria-pressed={j === jahr}
                  className={cn(
                    "num h-10 rounded-md border text-sm transition-colors active:bg-accent",
                    j === jahr && "border-foreground bg-accent font-medium",
                  )}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
