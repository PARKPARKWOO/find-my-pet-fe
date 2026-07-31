import Link from "next/link";

import { HOME_PURPOSE_CATEGORIES } from "@/lib/purposeCategories";

export function PurposeCategoryNav() {
  const availableCategories = HOME_PURPOSE_CATEGORIES.filter(
    (category) => category.availability === "available",
  );
  const plannedCategories = HOME_PURPOSE_CATEGORIES.filter(
    (category) => category.availability === "planned",
  );

  return (
    <nav aria-label="찾아보기 목적" className="w-full">
      <ul className="grid gap-3 sm:grid-cols-2">
        {availableCategories.map((category) => (
          <li key={category.id}>
            <Link
              href={category.href}
              className="flex min-h-32 flex-col justify-between rounded-2xl border border-border bg-surface-raised p-5 text-content-primary shadow-raised transition-colors hover:border-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary focus-visible:ring-offset-2"
            >
              <span className="font-editorial text-lg font-semibold">{category.label}</span>
              <span className="mt-3 text-sm leading-6 text-content-secondary">
                {category.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {plannedCategories.map((category) => (
          <li
            key={category.id}
            aria-label={`${category.label}: 준비 중`}
            className="rounded-xl border border-dashed border-border bg-surface-canvas p-4 text-content-muted"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-content-secondary">{category.label}</span>
              <span className="shrink-0 rounded-full bg-waiting/15 px-2 py-1 text-xs font-medium text-content-secondary">
                준비 중
              </span>
            </div>
            <p className="mt-2 text-xs leading-5">{category.description}</p>
          </li>
        ))}
      </ul>
    </nav>
  );
}
