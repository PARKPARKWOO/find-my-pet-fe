import { MarqueeRail } from "@/components/patterns/MarqueeRail.client";
import type { MarqueeItem } from "@/lib/homeFeed";

export interface LatestPetMarqueeProps {
  items: readonly MarqueeItem[];
}

export function LatestPetMarquee({ items }: LatestPetMarqueeProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="latest-pet-news-title" className="bg-surface-canvas px-4 py-10 lg:px-8">
      <h2 id="latest-pet-news-title" className="font-editorial text-2xl font-semibold text-content-primary">
        새로 이어지는 소식
      </h2>
      <p className="mt-2 text-sm leading-6 text-content-secondary">
        찾고 있는 소식과 보호소 공고를 한눈에 살펴보세요.
      </p>
      <MarqueeRail items={items} />
    </section>
  );
}
