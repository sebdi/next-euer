"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn("flex flex-col overflow-hidden", className)}
      {...props}
    />
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b px-3">
      <Search className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
      <CommandPrimitive.Input
        className={cn(
          "h-10 w-full bg-transparent text-base outline-none placeholder:text-subtle-foreground md:h-9 md:text-sm",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      className={cn("max-h-64 overflow-y-auto overscroll-contain p-1", className)}
      {...props}
    />
  );
}

function CommandEmpty(
  props: React.ComponentProps<typeof CommandPrimitive.Empty>,
) {
  return (
    <CommandPrimitive.Empty
      className="px-2 py-5 text-center text-[13px] text-muted-foreground"
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex min-h-10 cursor-default items-center gap-2 rounded-sm px-2 text-sm outline-none select-none data-[selected=true]:bg-accent md:min-h-8",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator() {
  return <CommandPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />;
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandSeparator,
};
