import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { FEATURED_GUIDES } from "@/lib/featuredGuides";

export function SituationGuide() {
  return (
    <section aria-labelledby="situation-guide-title" className="rounded-3xl bg-forest p-6 text-content-inverse sm:p-8">
      <p className="text-sm font-medium text-content-inverse/70">필요한 순간에 확인하세요</p>
      <h2 id="situation-guide-title" className="mt-2 font-editorial text-2xl font-semibold">
        상황별 반려동물 안내
      </h2>
      <ul className="mt-6 divide-y divide-white/15">
        {FEATURED_GUIDES.map((item) => (
          <li key={item.id} className="py-4 first:pt-0 last:pb-0">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm leading-6 text-content-inverse/75">{item.description}</p>
            <Link
              href={item.href}
              className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold underline decoration-white/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {item.linkLabel}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
