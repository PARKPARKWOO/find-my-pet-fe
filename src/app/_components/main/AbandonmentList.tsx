"use client";

import { useEffect, useState } from "react";
import AbandonmentCard from "../AbandonmentCard";
import { PetListSkeleton } from "../skeleton/PetListSkeleton";
import { useRouter } from "next/navigation";
import AbandonmentPagination from "../AbandonmentPagination";
import apiClient from "@/lib/api";
import useIsLoginStore from "@/store/loginStore";
import { Bell, BellOff } from "lucide-react";

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
}

type AnimalFilter = "ALL" | "DOG" | "CAT";

interface RegionItem {
  orgCd: string | null;
  orgdownNm: string | null;
  uprCd: string | null;
}

export default function AbandonmentList() {
  const router = useRouter();
  const [abandonmentPetList, setAbandonmentPetList] = useState<IPet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<AnimalFilter>("ALL");
  const [sidoList, setSidoList] = useState<RegionItem[]>([]);
  const [sigunguList, setSigunguList] = useState<RegionItem[]>([]);
  const [uprCd, setUprCd] = useState<string>(""); // 시도 코드
  const [orgCd, setOrgCd] = useState<string>(""); // 시군구 코드
  const isLogin = useIsLoginStore((s) => s.isLogin);
  const [subscriptions, setSubscriptions] = useState<Array<{ id: string; uprCd: string; orgCd: string | null; animalType: string | null }>>([]);
  const [subBusy, setSubBusy] = useState(false);

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

  // 시도 변경 시 시군구 목록 갱신
  useEffect(() => {
    if (!uprCd) {
      setSigunguList([]);
      setOrgCd("");
      return;
    }
    apiClient
      .get("/abandoned-animals/sigungu", { params: { uprCd } })
      .then((res) => setSigunguList(res.data?.data ?? []))
      .catch(() => setSigunguList([]));
    setOrgCd("");
  }, [uprCd]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data } = await apiClient.get("/abandoned-animals", {
          params: {
            pageNo: currentPage,
            numOfRows: 20,
            ...(filter !== "ALL" ? { animalType: filter } : {}),
            ...(uprCd ? { uprCd } : {}),
            ...(orgCd ? { orgCd } : {}),
          },
        });
        // 응답: { data: { contents: [...], hasNextPage, totalCount } }
        setAbandonmentPetList(data?.data?.contents ?? []);
      } catch (e) {
        console.error("구조동물 조회 실패", e);
        setAbandonmentPetList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, filter, uprCd, orgCd]);

  const tabClass = (key: AnimalFilter) =>
    `px-4 py-2 text-sm rounded-full transition-colors ${
      filter === key
        ? "bg-blue-500 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <button className={tabClass("ALL")} onClick={() => { setFilter("ALL"); setCurrentPage(1); }}>
          전체
        </button>
        <button className={tabClass("DOG")} onClick={() => { setFilter("DOG"); setCurrentPage(1); }}>
          개
        </button>
        <button className={tabClass("CAT")} onClick={() => { setFilter("CAT"); setCurrentPage(1); }}>
          고양이
        </button>
      </div>

      {/* 지역 필터 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={uprCd}
          onChange={(e) => {
            setUprCd(e.target.value);
            setCurrentPage(1);
          }}
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
          onChange={(e) => {
            setOrgCd(e.target.value);
            setCurrentPage(1);
          }}
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
            onClick={() => {
              setUprCd("");
              setOrgCd("");
              setCurrentPage(1);
            }}
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
      <AbandonmentPagination currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}
