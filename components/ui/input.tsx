import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base text-foreground transition-colors duration-150 placeholder:text-subtle-foreground hover:border-border-strong focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive md:h-8 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
