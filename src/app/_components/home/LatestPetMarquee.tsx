import Link from "next/link";

import { formatMarqueeDate, type MarqueeItem } from "@/lib/homeFeed";

const STATUS_LABEL: Record<MarqueeItem["kind"], string> = {
  SEARCHING: "찾는 중",
  SEEN: "목격",
  PROTECTED: "보호 중",
};

export interface LatestPetMarqueeProps {
  items: readonly MarqueeItem[];
}

export function LatestPetMarquee({ items }: LatestPetMarqueeProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="latest-pet-title" className="bg-surface-canvas px-4 py-10 lg:px-8">
      <h2 id="latest-pet-title" className="font-editorial text-2xl font-semibold text-content-primary">
        새로 이어지는 소식
      </h2>
      <p className="mt-2 text-sm leading-6 text-content-secondary">
        공개된 실종 소식과 보호 공고의 최신 항목을 함께 보여드려요.
      </p>
      <ul className="mt-6 flex snap-x gap-3 overflow-x-auto pb-3">
        {items.map((item) => {
          const formattedDate = formatMarqueeDate(item.occurredAt, item.dateFormat);
          return (
            <li key={item.key} className="w-72 shrink-0 snap-start">
              <Link
                href={item.href}
                className="flex min-h-40 h-full flex-col rounded-2xl border border-border bg-surface-raised p-5 shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
              >
                <span className="text-xs font-semibold text-clay">{STATUS_LABEL[item.kind]}</span>
                <strong className="mt-3 line-clamp-2 text-base text-content-primary">{item.title}</strong>
                {item.place ? <span className="mt-2 text-sm text-content-secondary">{item.place}</span> : null}
                {formattedDate && (
                  item.occurredAt ? (
                    <time dateTime={item.occurredAt} className="mt-auto pt-4 text-xs text-content-muted">
                      {formattedDate}
                    </time>
                  ) : null
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
