import * as React from "react";

import { cn } from "@/lib/utils";

export interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  surface?: "paper" | "raised" | "transparent";
}

const surfaceClasses = {
  paper: "bg-surface-paper",
  raised: "bg-surface-raised shadow-raised",
  transparent: "",
} as const;

const PageShell = React.forwardRef<HTMLDivElement, PageShellProps>(
  ({ className, surface = "paper", ...props }, ref) => (
    <div ref={ref} className={cn("min-h-dvh", surfaceClasses[surface], className)} {...props} />
  )
);
PageShell.displayName = "PageShell";

export { PageShell };
