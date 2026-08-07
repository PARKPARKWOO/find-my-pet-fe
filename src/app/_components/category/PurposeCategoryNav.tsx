import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { MarqueeItem } from "@/lib/homeFeed";
import { HOME_PURPOSE_CATEGORIES } from "@/lib/purposeCategories";

export interface PurposeCategoryNavProps {
  /** "가족을 기다려요" 카드에 넣을 실제 보호 공고 썸네일 (최대 3장). */
  photoItems?: readonly MarqueeItem[];
  /** "집을 잃었어요" 카드에 넣을 실제 실종 소식 썸네일 (최대 3장). */
  lostPhotoItems?: readonly MarqueeItem[];
}

export function PurposeCategoryNav({ photoItems = [], lostPhotoItems = [] }: PurposeCategoryNavProps) {
  const availableCategories = HOME_PURPOSE_CATEGORIES.filter(
    (category) => category.availability === "available",
  );
  const plannedCategories = HOME_PURPOSE_CATEGORIES.filter(
    (category) => category.availability === "planned",
  );
  // 같은 사진을 공유하는 중복 게시글이 스트립에 복붙처럼 보이지 않게 썸네일 기준으로 dedupe.
  const uniqueByThumbnail = (items: readonly MarqueeItem[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (!item.thumbnail || seen.has(item.thumbnail)) return false;
      seen.add(item.thumbnail);
      return true;
    });
  };
  const photos = uniqueByThumbnail(photoItems).slice(0, 3);
  const lostPhotos = uniqueByThumbnail(lostPhotoItems).slice(0, 3);

  return (
    <nav aria-label="찾아보기 목적" className="w-full">
      <ul className="grid gap-4">
        {availableCategories.map((category) => {
          const isLost = category.id === "lost";

          if (isLost) {
            return (
              <li key={category.id}>
                <Link
                  href={category.href}
                  className="group block rounded-2xl bg-forest p-6 text-content-inverse shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:bg-forest-strong hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary focus-visible:ring-offset-2"
                >
                  <span className="flex items-center justify-between gap-4">
                    <span>
                      <span className="block text-lg font-bold sm:text-xl">{category.label}</span>
                      <span className="mt-1 block text-sm font-normal leading-6 text-content-inverse">
                        {category.description}
                      </span>
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </span>
                  {lostPhotos.length > 0 && (
                    <span className="mt-4 flex gap-2">
                      {lostPhotos.map((item) => (
                        <span
                          key={item.key}
                          className="relative aspect-square w-1/3 overflow-hidden rounded-xl bg-forest-strong ring-1 ring-white/25"
                        >
                          <Image
                            src={item.thumbnail as string}
                            alt=""
                            fill
                            sizes="140px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </span>
                      ))}
                    </span>
                  )}
                </Link>
              </li>
            );
          }

          return (
            <li key={category.id}>
              <Link
                href={category.href}
                className="group block rounded-2xl border border-border bg-surface-raised p-6 shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lifted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary focus-visible:ring-offset-2"
              >
                <span className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block text-lg font-bold text-content-primary sm:text-xl">
                      {category.label}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-content-secondary">
                      {category.description}
                    </span>
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-5 shrink-0 text-content-muted transition-all duration-200 group-hover:translate-x-1 group-hover:text-forest"
                  />
                </span>
                {photos.length > 0 && (
                  <span className="mt-4 flex gap-2">
                    {photos.map((item) => (
                      <span
                        key={item.key}
                        className="relative aspect-square w-1/3 overflow-hidden rounded-xl bg-surface-canvas"
                      >
                        <Image
                          src={item.thumbnail as string}
                          alt=""
                          fill
                          sizes="140px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </span>
                    ))}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-2">
        {plannedCategories.map((category) => (
          <li
            key={category.id}
            aria-label={`${category.label}: 준비 중`}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border bg-surface-canvas px-3 py-1.5 text-xs font-medium text-content-muted"
          >
            <span>{category.label}</span>
            <span aria-hidden="true">·</span>
            <span>준비 중</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
