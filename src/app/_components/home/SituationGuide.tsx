import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { FEATURED_GUIDES } from "@/lib/featuredGuides";

export function SituationGuide() {
  return (
    <section aria-labelledby="situation-guide-title" className="rounded-3xl bg-surface-canvas p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="situation-guide-title" className="text-xl font-bold tracking-tight text-content-primary sm:text-2xl">
          상황별 반려동물 안내
        </h2>
        <p className="text-sm text-content-muted">필요한 순간에 바로 찾아볼 수 있게 정리했어요.</p>
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {FEATURED_GUIDES.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="group flex h-full flex-col rounded-2xl bg-surface-raised p-5 shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
            >
              <span className="flex items-start justify-between gap-3">
                <strong className="text-base font-bold text-content-primary">{item.title}</strong>
                <ArrowUpRight
                  aria-hidden
                  className="size-4 shrink-0 text-content-muted/60 transition-colors group-hover:text-forest"
                />
              </span>
              <span className="mt-1.5 text-sm leading-6 text-content-secondary">{item.description}</span>
              <span className="mt-auto pt-3 text-sm font-semibold text-forest">{item.linkLabel}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
