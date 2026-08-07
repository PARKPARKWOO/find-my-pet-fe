import { MarqueeRail } from "@/components/patterns/MarqueeRail.client";
import type { MarqueeItem } from "@/lib/homeFeed";

export interface LatestPetMarqueeProps {
  items: readonly MarqueeItem[];
}

export function LatestPetMarquee({ items }: LatestPetMarqueeProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="latest-pet-news-title" className="bg-surface-canvas py-12 lg:py-16">
      <div className="mx-auto w-full max-w-page px-4 md:px-6">
        <h2 id="latest-pet-news-title" className="text-xl font-bold tracking-tight text-content-primary sm:text-2xl">
          새로 이어지는 소식
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-content-secondary">
          찾고 있는 소식과 보호소 공고를 한눈에 살펴보세요.
        </p>
        <MarqueeRail items={items} />
      </div>
    </section>
  );
}
