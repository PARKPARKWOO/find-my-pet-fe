import type { ReactNode } from "react";

import { PurposeCategoryNav } from "@/app/_components/category/PurposeCategoryNav";
import type { MarqueeItem } from "@/lib/homeFeed";

import { SituationGuide } from "./SituationGuide";

export interface HomeHeroProps {
  /** 목적 카드에 보여줄 실제 보호 공고 썸네일 (실데이터, 최대 3장). */
  photoItems?: readonly MarqueeItem[];
  /** 집을 잃었어요 카드에 보여줄 실제 실종 소식 썸네일 (실데이터, 최대 3장). */
  lostPhotoItems?: readonly MarqueeItem[];
  /** 좌측 컬럼에 들어갈 검색 슬롯 — 임포트 경계를 늘리지 않기 위해 조합으로 받는다. */
  children?: ReactNode;
}

export function HomeHero({ photoItems = [], lostPhotoItems = [], children }: HomeHeroProps) {
  return (
    <section className="mx-auto w-full max-w-page px-4 pt-10 md:px-6 lg:pt-16">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-center lg:gap-14">
        <div>
          <h1 className="max-w-xl break-keep text-balance text-[2rem] font-extrabold leading-[1.18] tracking-[-0.03em] text-content-primary sm:text-5xl sm:leading-[1.15]">다시 만나는 길을, 동네와 함께.</h1>
          <p className="mt-4 max-w-lg break-keep text-base leading-7 text-content-secondary sm:text-lg">
            실종 소식과 전국 보호소 공고를 한곳에서 보고, 지금 필요한 행동을 바로 시작하세요.
          </p>
          {children ? <div className="mt-7 max-w-xl">{children}</div> : null}
        </div>
        <PurposeCategoryNav photoItems={photoItems} lostPhotoItems={lostPhotoItems} />
      </div>
      <div className="mt-14 lg:mt-20">
        <SituationGuide />
      </div>
    </section>
  );
}
