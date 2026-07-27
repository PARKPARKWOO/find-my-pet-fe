"use client";

import { useCallback, useEffect, useState } from "react";
import AbandonmentCard from "../AbandonmentCard";
import { PetListSkeleton } from "../skeleton/PetListSkeleton";
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

export interface IPet {
  desertionNo: string;
  filename: string;
  happenDt: string;
  happenPlace: string;
  kindCd: string;
  colorCd?: string;
  age: string;
  weight: string;
  noticeNo: string;
  noticeSdt: string;
  noticeEdt: string;
  popfile: string;
  processState: string;
  sexCd: string;
  neuterYn?: string;
  specialMark: string;
  careNm: string;
  careTel: string;
  careAddr: string;
  orgNm?: string;
  chargeNm?: string;
  officetel?: string;
  /** 백엔드가 upkind 로 분류해 채운 값 (DOG/CAT/OTHER) */
  animalType?: "DOG" | "CAT" | "OTHER";
  /** 백엔드가 `closed_at` 기준으로 채우는 공고 종료 여부. 판정은 @/lib/abandonment 를 쓴다. */
  noticeClosed?: boolean;
  noticeClosedAt?: string | null;
}

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

function parsePage(raw: string | null): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export default function AbandonmentList() {
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
  const currentPage = parsePage(searchParams.get(QUERY_KEY.page));

  const [abandonmentPetList, setAbandonmentPetList] = useState<IPet[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
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
    if (!uprCd) {
      setSigunguList([]);
      return;
    }
    apiClient
      .get("/abandoned-animals/sigungu", { params: { uprCd } })
      .then((res) => setSigunguList(res.data?.data ?? []))
      .catch(() => setSigunguList([]));
  }, [uprCd]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
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
        });
        // 응답: { data: { contents: [...], hasNextPage, totalCount } }
        setAbandonmentPetList(data?.data?.contents ?? []);
        setTotalCount(data?.data?.totalCount ?? 0);
      } catch (e) {
        console.error("구조동물 조회 실패", e);
        setAbandonmentPetList([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, filter, noticeStatus, uprCd, orgCd]);

  const chipClass = (active: boolean) =>
    `px-4 py-2 text-sm rounded-full transition-colors ${
      active ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  const statusChipClass = (active: boolean) =>
    `px-3 py-1.5 text-xs rounded-full border transition-colors ${
      active
        ? "bg-gray-800 text-white border-gray-800"
        : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
    }`;

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <button
          className={chipClass(filter === "ALL")}
          onClick={() => applyFilter({ type: "" })}
        >
          전체
        </button>
        {ANIMAL_TYPES.map((type) => (
          <button
            key={type}
            className={chipClass(filter === type)}
            onClick={() => applyFilter({ type })}
          >
            {ANIMAL_TYPE_LABEL[type]}
          </button>
        ))}
      </div>

      {/* 공고 상태 필터 — 기본은 진행 중. "공고 종료" 는 이미 공고기간이 끝난 아이들이라
          현재 보호 여부를 보장하지 않는다는 안내를 함께 노출한다. */}
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <span className="text-xs text-gray-500">공고 상태</span>
        {NOTICE_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
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
          공고 기간이 끝난 아이가 포함돼 있습니다. 보호소가 계속 보호 중일 수도, 입양·반환됐을 수도
          있으니 현재 상태는 보호소에 직접 확인해 주세요.
        </p>
      )}

      {/* 지역 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={uprCd}
          onChange={(e) => applyFilter({ sido: e.target.value, sigungu: "" })}
          className="border rounded-md px-3 py-1.5 text-sm bg-white"
        >
          <option value="">전국</option>
          {sidoList.map((s) => (
            <option key={s.orgCd ?? ""} value={s.orgCd ?? ""}>
              {s.orgdownNm ?? "-"}
            </option>
          ))}
        </select>
        <select
          value={orgCd}
          onChange={(e) => applyFilter({ sigungu: e.target.value })}
          disabled={!uprCd || sigunguList.length === 0}
          className="border rounded-md px-3 py-1.5 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
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
            className="text-xs text-gray-500 hover:underline px-2"
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
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-white text-gray-700 hover:bg-gray-50"
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
        ) : (
          abandonmentPetList.map((pet: IPet) => (
            <div
              key={pet.desertionNo}
              onClick={() => {
                router.push(`/abandonment/${pet.desertionNo}`);
                localStorage.setItem("petInfo", JSON.stringify(pet));
              }}
            >
              <AbandonmentCard {...pet} key={pet.desertionNo} />
            </div>
          ))
        )}
      </div>

      {!isLoading && abandonmentPetList.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">
          조건에 맞는 공고가 없습니다. 필터를 넓혀 보세요.
        </p>
      )}

      <AbandonmentPagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => updateQuery({ page: page > 1 ? String(page) : "" })}
      />
    </div>
  );
}
