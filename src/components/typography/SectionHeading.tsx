import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionHeadingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}

const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  ({ className, eyebrow, title, description, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-3", className)} {...props}>
      {eyebrow ? <p className="text-sm font-medium text-content-secondary">{eyebrow}</p> : null}
      <h2 className="font-editorial text-2xl font-semibold tracking-tight text-content-primary sm:text-3xl">
        {title}
      </h2>
      {description ? <p className="max-w-reading text-content-secondary">{description}</p> : null}
    </div>
  )
);
SectionHeading.displayName = "SectionHeading";

export { SectionHeading };
