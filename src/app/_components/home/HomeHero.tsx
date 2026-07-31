import { PurposeCategoryNav } from "@/app/_components/category/PurposeCategoryNav";

import { SituationGuide } from "./SituationGuide";

export function HomeHero() {
  return (
    <section className="grid gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start lg:px-8 lg:py-16">
      <div className="space-y-7">
        <div>
          <p className="text-sm font-semibold tracking-wide text-clay">이웃과 잇는 반려동물 소식</p>
          <h1 className="mt-3 max-w-2xl font-editorial text-4xl font-semibold leading-tight tracking-tight text-content-primary sm:text-5xl">다시 만나는 길을, 동네와 함께.</h1>
          <p className="mt-5 max-w-reading text-base leading-7 text-content-secondary sm:text-lg">
            실종 소식과 보호 공고를 한곳에서 살펴보고, 지금 필요한 다음 행동을 차분히 확인해요.
          </p>
        </div>
        <PurposeCategoryNav />
      </div>
      <SituationGuide />
    </section>
  );
}
