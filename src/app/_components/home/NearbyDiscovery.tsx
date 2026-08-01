import Link from "next/link";

import HomeNearbyMap from "./HomeNearbyMap.client";

export function NearbyDiscovery() {
  return (
    <section aria-labelledby="nearby-discovery-title" className="border-y border-border px-4 py-12 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-readable">선택한 경우에만 위치를 확인해요</p>
          <h2 id="nearby-discovery-title" className="mt-2 font-editorial text-3xl font-semibold text-content-primary">
            가까운 곳부터 함께 살펴봐요
          </h2>
          <p className="mt-3 max-w-reading leading-7 text-content-secondary">
            현재 위치 사용에 동의하면 공개된 실종·목격 소식 가운데 가까운 항목을 조회해 보여드려요.
          </p>
        </div>
        <Link
          href="/abandonment/region"
          className="inline-flex min-h-11 items-center font-semibold text-action-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
        >
          지역별 보호 공고 보기
        </Link>
      </div>
      <div className="mt-8">
        <HomeNearbyMap />
      </div>
      <p className="mt-5 inline-flex min-h-11 items-center rounded-full border border-dashed border-border px-4 text-sm font-medium text-content-muted">
        수색그룹과 팀 지도 · 준비 중
      </p>
    </section>
  );
}
