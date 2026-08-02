"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AbandonmentCard from "../AbandonmentCard";
import { PetListSkeleton } from "../skeleton/PetListSkeleton";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AbandonmentPagination from "../AbandonmentPagination";
import apiClient from "@/lib/api";
import useIsLoginStore from "@/store/loginStore";
import { Bell, BellOff } from "lucide-react";
import {
  ANIMAL_TYPE_LABEL,
  ANIMAL_TYPES,
  parseAnimalTypeFilter,
  type AnimalTypeFilter,
} from "@/lib/animalType";
import {
  DEFAULT_NOTICE_STATUS,
  NOTICE_STATUS_LABEL,
  parseNoticeStatus,
  type NoticeStatusFilter,
} from "@/lib/abandonment";
import { clampPageToTotal, isCanonicalPageQuery } from "@/lib/pagination";
import {
  decideHomeSeedRequest,
  validateHomeListSeed,
  type HomeSeedGateState,
} from "@/lib/homeSeed";
import {
  getAbandonmentRequestKey,
  HOME_ABANDONMENT_REQUEST_KEY,
  type AbandonedAnimalSummary,
  type HomeListSeed,
} from "@/lib/homeFeed";

interface RegionItem {
  orgCd: string | null;
  orgdownNm: string | null;
  uprCd: string | null;
}

const PAGE_SIZE = 20;

/** 목록 필터의 URL 쿼리 키. 홈(`/`)에 그대로 붙는다 — 예: `/?type=DOG&status=CLOSED&page=2`. */
const QUERY_KEY = {
  type: "type",
  status: "status",
  sido: "sido",
  sigungu: "sigungu",
  page: "page",
} as const;

const NOTICE_STATUSES: NoticeStatusFilter[] = ["OPEN", "CLOSED", "ALL"];

export interface AbandonmentListProps {
  initialPage?: HomeListSeed<AbandonedAnimalSummary>;
}

function parsePage(raw: string | null): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export default function AbandonmentList({ initialPage }: AbandonmentListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * 필터 상태의 단일 출처는 **URL 쿼리**다(로컬 useState 아님).
   *
   * 예전에는 전부 useState 라 딥링크·공유·뒤로가기가 불가능했고, 필터를 하나 추가할 때마다
   * `setCurrentPage(1)` 을 각 onClick 에 복붙해야 했다. URL 로 올리면 페이지 리셋도
   * {@link updateQuery} 한 곳에서 처리된다.
   */
  const filter: AnimalTypeFilter = parseAnimalTypeFilter(searchParams.get(QUERY_KEY.type));
  const noticeStatus: NoticeStatusFilter = parseNoticeStatus(searchParams.get(QUERY_KEY.status));
  const uprCd = searchParams.get(QUERY_KEY.sido) ?? ""; // 시도 코드
  const orgCd = searchParams.get(QUERY_KEY.sigungu) ?? ""; // 시군구 코드
  const rawPage = searchParams.get(QUERY_KEY.page);
  const currentPage = parsePage(rawPage);
  const currentRequestKey = getAbandonmentRequestKey({
    noticeStatus,
    animalType: filter,
    uprCd,
    orgCd,
    currentPage,
    pageSize: PAGE_SIZE,
  });
  const initialSeedValidatedRef = useRef(false);
  const initialSeedRef = useRef<HomeListSeed<AbandonedAnimalSummary> | undefined>(undefined);
  if (!initialSeedValidatedRef.current) {
    initialSeedRef.current = validateHomeListSeed(initialPage, {
      isCanonicalRequest: isCanonicalPageQuery(rawPage, currentPage),
      expectedRequestKey: HOME_ABANDONMENT_REQUEST_KEY,
      currentRequestKey,
    });
    initialSeedValidatedRef.current = true;
  }
  const seedGateRef = useRef<HomeSeedGateState>({
    seededRequestKey: initialSeedRef.current?.requestKey ?? null,
    previousRequestKey: HOME_ABANDONMENT_REQUEST_KEY,
  });

  const [abandonmentPetList, setAbandonmentPetList] = useState(
    () => initialSeedRef.current?.data.contents ?? [],
  );
  const [totalCount, setTotalCount] = useState(() => initialSeedRef.current?.data.totalCount ?? 0);
  const [isLoading, setIsLoading] = useState(() => !initialSeedRef.current);
  const [loadError, setLoadError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [sidoList, setSidoList] = useState<RegionItem[]>([]);
  const [sigunguList, setSigunguList] = useState<RegionItem[]>([]);
  const isLogin = useIsLoginStore((s) => s.isLogin);
  const [subscriptions, setSubscriptions] = useState<
    Array<{ id: string; uprCd: string; orgCd: string | null; animalType: string | null }>
  >([]);
  const [subBusy, setSubBusy] = useState(false);

  /**
   * 쿼리 일부만 갱신한다. 값이 빈 문자열/기본값이면 키를 지워 URL 을 짧게 유지한다.
   *
   * `replace` 가 아니라 `push` 를 쓰는 이유: 필터를 바꾼 뒤 뒤로가기를 누르면 **이전 필터로
   * 돌아가는 것**이 사용자가 기대하는 동작이다. replace 면 뒤로가기가 페이지를 통째로 벗어난다.
   * 스크롤은 유지한다(필터는 목록 위에 있어 맨 위로 튀면 오히려 방해).
   */
  const updateQuery = useCallback(
    (patch: Partial<Record<keyof typeof QUERY_KEY, string>>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        const queryKey = QUERY_KEY[key as keyof typeof QUERY_KEY];
        if (!value) next.delete(queryKey);
        else next.set(queryKey, value);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /** 필터를 건드리면 항상 1페이지로. 3페이지를 보던 중 필터를 바꿔 빈 화면이 뜨는 걸 막는다. */
  const applyFilter = useCallback(
    (patch: Partial<Record<keyof typeof QUERY_KEY, string>>) => {
      updateQuery({ ...patch, page: "" });
    },
    [updateQuery],
  );

  const replacePage = useCallback(
    (page: number) => {
      const next = new URLSearchParams(searchParams.toString());
      if (page <= 1) next.delete(QUERY_KEY.page);
      else next.set(QUERY_KEY.page, String(page));
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const reloadSubscriptions = () => {
    if (!isLogin) {
      setSubscriptions([]);
      return;
    }
    apiClient
      .get("/me/abandoned-subscriptions")
      .then((res) => setSubscriptions(res.data?.data ?? []))
      .catch(() => setSubscriptions([]));
  };

  useEffect(reloadSubscriptions, [isLogin]);

  const currentAnimalType = filter === "ALL" ? null : filter;
  const matchedSub = subscriptions.find(
    (s) =>
      s.uprCd === uprCd &&
      (s.orgCd ?? null) === (orgCd || null) &&
      (s.animalType ?? null) === currentAnimalType,
  );

  const toggleSubscribe = async () => {
    if (!isLogin || subBusy || !uprCd) return;
    setSubBusy(true);
    try {
      if (matchedSub) {
        await apiClient.delete(`/me/abandoned-subscriptions/${matchedSub.id}`);
      } else {
        await apiClient.post("/me/abandoned-subscriptions", {
          uprCd,
          orgCd: orgCd || null,
          animalType: currentAnimalType,
        });
      }
      reloadSubscriptions();
    } finally {
      setSubBusy(false);
    }
  };

  // 시도 목록 1회 로드
  useEffect(() => {
    apiClient
      .get("/abandoned-animals/sido")
      .then((res) => setSidoList(res.data?.data ?? []))
      .catch(() => setSidoList([]));
  }, []);

  // 시도 변경 시 시군구 목록 갱신.
  // 시군구 초기화는 시도 select 의 onChange 에서 하지 여기서 하지 않는다 —
  // 여기서 지우면 `?sido=..&sigungu=..` 로 들어온 공유 링크가 마운트 직후 시군구를 잃는다.
  useEffect(() => {
    const controller = new AbortController();
    if (!uprCd) {
      setSigunguList([]);
      return () => controller.abort();
    }
    setSigunguList([]);
    apiClient
      .get("/abandoned-animals/sigungu", {
        params: { uprCd },
        signal: controller.signal,
      })
      .then((res) => {
        if (!controller.signal.aborted) setSigunguList(res.data?.data ?? []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSigunguList([]);
      });

    return () => controller.abort();
  }, [uprCd]);

  useEffect(() => {
    if (!isCanonicalPageQuery(rawPage, currentPage)) {
      replacePage(currentPage);
      return;
    }

    const seedDecision = decideHomeSeedRequest(seedGateRef.current, {
      requestKey: currentRequestKey,
      retryRequested: reloadToken > 0,
    });
    seedGateRef.current = seedDecision.state;
    if (!seedDecision.shouldFetch) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let keepLoadingForRedirect = false;

    const fetchData = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const { data } = await apiClient.get("/abandoned-animals", {
          params: {
            pageNo: currentPage,
            numOfRows: PAGE_SIZE,
            // 백엔드 기본값도 OPEN 이지만 명시해서 보낸다 — 기본값이 바뀌어도 화면 필터와 어긋나지 않게.
            noticeStatus,
            ...(filter !== "ALL" ? { animalType: filter } : {}),
            ...(uprCd ? { uprCd } : {}),
            ...(orgCd ? { orgCd } : {}),
          },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        // 응답: { data: { contents: [...], hasNextPage, totalCount } }
        const nextTotalCount = data?.data?.totalCount ?? 0;
        const normalizedPage = clampPageToTotal(currentPage, nextTotalCount, PAGE_SIZE);
        if (normalizedPage !== currentPage) {
          keepLoadingForRedirect = true;
          replacePage(normalizedPage);
          return;
        }
        setAbandonmentPetList(data?.data?.contents ?? []);
        setTotalCount(nextTotalCount);
      } catch (e) {
        if (controller.signal.aborted) return;
        console.error("구조동물 조회 실패", e);
        setAbandonmentPetList([]);
        setTotalCount(0);
        setLoadError(true);
      } finally {
        if (!controller.signal.aborted && !keepLoadingForRedirect) setIsLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [
    currentPage,
    currentRequestKey,
    filter,
    noticeStatus,
    orgCd,
    rawPage,
    reloadToken,
    replacePage,
    uprCd,
  ]);

  const chipClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-full border transition-colors ${
      active
        ? "border-transparent bg-action-primary text-content-inverse"
        : "border-border bg-surface-raised text-content-secondary hover:border-clay/60 hover:text-content-primary"
    }`;

  const statusChipClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
      active
        ? "bg-surface-inverse text-content-inverse border-surface-inverse"
        : "bg-surface-raised text-content-secondary border-border hover:border-clay/60"
    }`;

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <button
          type="button"
          aria-pressed={filter === "ALL"}
          className={chipClass(filter === "ALL")}
          onClick={() => applyFilter({ type: "" })}
        >
          전체
        </button>
        {ANIMAL_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            aria-pressed={filter === type}
            className={chipClass(filter === type)}
            onClick={() => applyFilter({ type })}
          >
            {ANIMAL_TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      {/* 공고 상태 필터 — 기본은 OPEN. CLOSED 는 백엔드의 공고 상태이며
          동물의 현재 보호·입양·반환 상태를 단정하지 않는다. */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <span className="text-xs text-content-muted">공고 상태</span>
        {NOTICE_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={noticeStatus === status}
            className={statusChipClass(noticeStatus === status)}
            onClick={() =>
              applyFilter({ status: status === DEFAULT_NOTICE_STATUS ? "" : status })
            }
          >
            {NOTICE_STATUS_LABEL[status]}
          </button>
        ))}
      </div>

      {noticeStatus !== "OPEN" && (
        <p className="mb-3 text-xs text-amber-800 bg-amber-50 border-l-4 border-amber-400 rounded-r-md px-3 py-2">
          종료된 공고가 포함될 수 있습니다. 현재 보호·입양·반환 상태는 이 공고만으로 알 수 없으니
          보호소에 직접 확인해 주세요.
        </p>
      )}

      {/* 지역 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          aria-label="시도 선택"
          value={uprCd}
          onChange={(e) => applyFilter({ sido: e.target.value, sigungu: "" })}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-surface-raised"
        >
          <option value="">전국</option>
          {sidoList.map((s) => (
            <option key={s.orgCd ?? ""} value={s.orgCd ?? ""}>
              {s.orgdownNm ?? "-"}
            </option>
          ))}
        </select>
        <select
          aria-label="시군구 선택"
          value={orgCd}
          onChange={(e) => applyFilter({ sigungu: e.target.value })}
          disabled={!uprCd || sigunguList.length === 0}
          className="border border-border rounded-md px-3 py-1.5 text-sm bg-surface-raised disabled:bg-surface-canvas disabled:text-content-muted"
        >
          <option value="">시군구 전체</option>
          {sigunguList.map((s) => (
            <option key={s.orgCd ?? ""} value={s.orgCd ?? ""}>
              {s.orgdownNm ?? "-"}
            </option>
          ))}
        </select>
        {(uprCd || orgCd) && (
          <button
            type="button"
            onClick={() => applyFilter({ sido: "", sigungu: "" })}
            className="text-xs text-content-muted hover:underline px-2"
          >
            지역 해제
          </button>
        )}
        {uprCd && (
          <button
            type="button"
            onClick={toggleSubscribe}
            disabled={!isLogin || subBusy}
            className={`text-xs px-3 py-1.5 rounded-md border flex items-center gap-1 ${
              matchedSub
                ? "bg-forest/10 text-forest border-forest/40"
                : "bg-surface-raised text-content-secondary border-border hover:border-clay/60"
            } disabled:opacity-50`}
            title={!isLogin ? "로그인 후 사용 가능" : matchedSub ? "알림 해제" : "이 지역 신규 등록 시 알림 받기"}
          >
            {matchedSub ? <Bell size={14} /> : <BellOff size={14} />}
            {matchedSub ? "알림 받는 중" : "이 지역 알림 받기"}
          </button>
        )}
      </div>

      <div className="w-full grid lg:grid-cols-4 md:grid-cols-3 xs:grid-cols-2 grid-cols-1 gap-6">
        {isLoading ? (
          <PetListSkeleton />
        ) : loadError ? (
          <div className="col-span-full py-10 text-center">
            <h3 className="text-lg font-semibold">보호 동물 정보를 불러오지 못했어요</h3>
            <p className="mt-2 text-sm text-content-muted">잠시 후 다시 시도해 주세요.</p>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="mt-4 rounded-md bg-action-primary px-4 py-2 text-sm text-content-inverse hover:bg-action-primary/90"
            >
              다시 시도
            </button>
          </div>
        ) : (
          abandonmentPetList.map((pet) => (
            <Link
              key={pet.desertionNo}
              href={`/abandonment/${pet.desertionNo}`}
              className="block h-full"
            >
              <AbandonmentCard {...pet} />
            </Link>
          ))
        )}
      </div>

      {!isLoading && !loadError && abandonmentPetList.length === 0 && (
        <p className="py-10 text-center text-sm text-content-muted">
          조건에 맞는 공고가 없습니다. 필터를 넓혀 보세요.
        </p>
      )}

      {!isLoading && !loadError && abandonmentPetList.length > 0 && (
        <AbandonmentPagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={(page) => updateQuery({ page: page > 1 ? String(page) : "" })}
        />
      )}
    </div>
  );
}
