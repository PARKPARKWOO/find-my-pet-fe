import Link from "next/link";

import HomeNearbyMap from "./HomeNearbyMap.client";

export function NearbyDiscovery() {
  return (
    <section aria-labelledby="nearby-discovery-title" className="py-12 lg:py-16">
      <div className="mx-auto w-full max-w-page px-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="nearby-discovery-title" className="text-xl font-bold tracking-tight text-content-primary sm:text-2xl">
              가까운 곳부터 함께 살펴봐요
            </h2>
            <p className="mt-1.5 max-w-reading text-sm leading-6 text-content-secondary sm:text-base sm:leading-7">
              위치 사용에 동의한 경우에만, 공개된 실종·목격 소식 가운데 가까운 항목을 보여드려요.
            </p>
          </div>
          <Link
            href="/abandonment/region"
            className="inline-flex min-h-11 shrink-0 items-center font-semibold text-forest underline underline-offset-4 hover:text-forest-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
          >
            지역별 보호 공고 보기
          </Link>
        </div>
        <div className="mt-7">
          <HomeNearbyMap />
        </div>
        <p className="mt-5 inline-flex min-h-11 items-center rounded-full border border-dashed border-border px-4 text-sm font-medium text-content-muted">
          수색그룹과 팀 지도 · 준비 중
        </p>
      </div>
    </section>
  );
}
