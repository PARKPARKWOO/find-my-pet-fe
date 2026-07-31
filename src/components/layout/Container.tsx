import * as React from "react";

import { cn } from "@/lib/utils";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "page" | "reading";
}

const sizeClasses = {
  page: "max-w-page",
  reading: "max-w-reading",
} as const;

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "page", ...props }, ref) => (
    <div ref={ref} className={cn("mx-auto w-full", sizeClasses[size], className)} {...props} />
  )
);
Container.displayName = "Container";

export { Container };
