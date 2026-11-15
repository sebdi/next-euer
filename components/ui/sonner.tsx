"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-md !border !border-border !bg-popover !text-popover-foreground !shadow-sm !font-sans !text-[13px]",
          description: "!text-muted-foreground",
          actionButton:
            "!rounded-sm !bg-primary !text-primary-foreground !font-medium",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
