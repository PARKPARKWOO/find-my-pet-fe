"use client";

import { useEffect, useRef, useState } from "react";
import { PetListSkeleton } from "../skeleton/PetListSkeleton";
import LostCard from "../LostCard";
import Link from "next/link";
import apiClient from "@/lib/api";
import LostPagination from "../LostPagination";
import { ITEM_PER_PAGE } from "@/app/constant/constant";
import NearbyFilter, { type NearbySetting } from "./NearbyFilter";
import AdSlot from "../ads/AdSlot";
import AdFitSlot from "../ads/AdFitSlot";
import { clampPageToTotal } from "@/lib/pagination";
import { decideHomeSeedRequest, type HomeSeedGateState } from "@/lib/homeSeed";
import {
  getLostRequestKey,
  HOME_LOST_REQUEST_KEY,
  type HomeListSeed,
  type LostPetSummary,
} from "@/lib/homeFeed";

/** 홈 피드 카드 몇 장마다 1번 광고 슬롯 삽입. */
const AD_INTERVAL = 6;
/** AdFit 유닛이 설정돼 있으면 AdFit 우선, 없으면 AdSense fallback. */
const ADFIT_FEED_UNIT = process.env.NEXT_PUBLIC_ADFIT_UNIT_FEED;
const ADSENSE_FEED_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED;

export interface LostListProps {
  initialPage?: HomeListSeed<LostPetSummary>;
}

export default function LostList({ initialPage }: LostListProps) {
  const initialSeedValidatedRef = useRef(false);
  const initialSeedRef = useRef<HomeListSeed<LostPetSummary> | undefined>(undefined);
  if (!initialSeedValidatedRef.current) {
    initialSeedRef.current =
      initialPage?.requestKey === HOME_LOST_REQUEST_KEY ? initialPage : undefined;
    initialSeedValidatedRef.current = true;
  }

  const seedGateRef = useRef<HomeSeedGateState>({
    seededRequestKey: initialSeedRef.current?.requestKey ?? null,
    previousRequestKey: HOME_LOST_REQUEST_KEY,
  });
  const [lostPetList, setLostPetList] = useState(() => initialSeedRef.current?.data.contents ?? []);
  const [totalCount, setTotalCount] = useState(() => initialSeedRef.current?.data.totalCount ?? 0);
  const [isLoading, setIsLoading] = useState(() => !initialSeedRef.current);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [nearby, setNearby] = useState<NearbySetting>({ enabled: false });

  useEffect(() => {
    const requestKey = getLostRequestKey({ currentPage, pageSize: ITEM_PER_PAGE, nearby });
    const seedDecision = decideHomeSeedRequest(seedGateRef.current, {
      requestKey,
      retryRequested: reloadToken > 0,
    });
    seedGateRef.current = seedDecision.state;
    if (!seedDecision.shouldFetch) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let keepLoadingForRedirect = false;

    const getPosts = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        let nextContents: LostPetSummary[];
        let nextTotalCount: number;
        if (nearby.enabled) {
          const res = await apiClient.get(`/posts/nearby`, {
            params: {
              lat: nearby.lat,
              lng: nearby.lng,
              radiusKm: nearby.radiusKm,
              pageSize: ITEM_PER_PAGE,
              pageOffset: currentPage - 1,
            },
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          nextContents = res.data?.data?.contents ?? [];
          nextTotalCount = res.data?.data?.totalCount ?? 0;
        } else {
          const res = await apiClient.get(
            `/posts?pageSize=${ITEM_PER_PAGE}&pageOffset=${currentPage - 1}&orderBy=CREATED_AT_DESC`,
            { signal: controller.signal },
          );
          if (controller.signal.aborted) return;
          nextContents = res.data?.data?.contents ?? [];
          nextTotalCount = res.data?.data?.totalCount ?? 0;
        }

        const normalizedPage = clampPageToTotal(currentPage, nextTotalCount, ITEM_PER_PAGE);
        if (normalizedPage !== currentPage) {
          keepLoadingForRedirect = true;
          setCurrentPage(normalizedPage);
          return;
        }
        setLostPetList(nextContents);
        setTotalCount(nextTotalCount);
      } catch {
        if (controller.signal.aborted) return;
        setLostPetList([]);
        setTotalCount(0);
        setLoadError(true);
      } finally {
        if (!controller.signal.aborted && !keepLoadingForRedirect) setIsLoading(false);
      }
    };
    getPosts();

    return () => controller.abort();
  }, [currentPage, nearby, reloadToken]);

  return (
    <div className="w-full flex flex-col justify-center">
      <NearbyFilter
        value={nearby}
        onChange={(v) => {
          setCurrentPage(1);
          setNearby(v);
        }}
      />
      <div className="w-full grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
        {isLoading ? (
          <PetListSkeleton />
        ) : loadError ? (
          <div className="col-span-full py-10 text-center">
            <h3 className="text-lg font-semibold">목록을 불러오지 못했어요</h3>
            <p className="mt-2 text-sm text-content-muted">잠시 후 다시 시도해 주세요.</p>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="mt-4 rounded-md bg-action-primary px-4 py-2 text-sm text-content-inverse hover:bg-action-primary/90"
            >
              다시 시도
            </button>
          </div>
        ) : lostPetList.length === 0 ? (
          <div className="col-span-full py-10 text-center">
            <h3 className="text-lg font-semibold">지금 등록된 실종 소식이 없어요</h3>
            <p className="mt-2 text-sm text-gray-500">
              다행이에요. 반려동물을 잃어버리셨다면 바로 주변에 알려주세요.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-blue-600 underline">
              <Link href="/register">실종 소식 등록</Link>
              <Link href="/flyer">전단지 먼저 만들기</Link>
              <Link href="/guide">실종 대응 가이드</Link>
            </div>
          </div>
        ) : (
          lostPetList.flatMap((pet, idx) => {
            const node = (
              <Link href={`/lost/${pet.id}`} key={pet.id}>
                <LostCard {...pet} />
              </Link>
            );
            const shouldInjectAd =
              idx > 0 && (idx + 1) % AD_INTERVAL === 0 && idx !== lostPetList.length - 1;
            if (!shouldInjectAd) return [node];
            const adNode = ADFIT_FEED_UNIT ? (
              <AdFitSlot
                key={`ad-${idx}`}
                unit={ADFIT_FEED_UNIT}
                width={300}
                height={250}
                className="mx-auto"
              />
            ) : (
              <AdSlot
                key={`ad-${idx}`}
                slot={ADSENSE_FEED_SLOT ?? ""}
                format="fluid"
                minHeight={240}
              />
            );
            return [node, adNode];
          })
        )}
      </div>
      {!isLoading && !loadError && lostPetList.length > 0 && (
        <LostPagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalCount={totalCount}
        />
      )}
    </div>
  );
}
