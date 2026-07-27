import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BASE_URL } from "@/app/constant/api";
import { Button } from "@/app/_components/ui/button";
import { formatDate } from "@/lib/utils";
import { formatYyyyMmDdKo, happenDtToDate, isNoticeClosed } from "@/lib/abandonment";
import { formatKindLabel } from "@/lib/animalType";
import AbandonmentMaps, { ShelterMap } from "./AbandonmentMaps";
import ShareButtons from "@/app/_components/share/ShareButtons";
import ClosedNoticeBanner from "@/app/_components/abandonment/ClosedNoticeBanner";

const SITE_DOMAIN = "https://findmypet.platformholder.site";

interface AbandonedPet {
  desertionNo: string;
  filename: string | null;
  popfile: string | null;
  kindCd: string | null;
  sexCd: string | null;
  age: string | null;
  weight: string | null;
  specialMark: string | null;
  happenPlace: string | null;
  happenDt: string | null;
  careNm: string | null;
  careTel: string | null;
  careAddr: string | null;
  processState: string | null;
  noticeNo: string | null;
  noticeSdt: string | null;
  noticeEdt: string | null;
  animalType: string | null;
  orgNm?: string | null;
  /** 백엔드가 `closed_at` 기준으로 채우는 공고 종료 여부 (mirror 경로에서만 채워진다). */
  noticeClosed?: boolean | null;
  noticeClosedAt?: string | null;
}

/**
 * 공고가 종료돼도 이 엔드포인트는 **200 을 반환한다** (백엔드가 `closed_at` 을 필터하지 않는다).
 * 이미 색인·공유된 URL 을 404 로 만들지 않기 위한 의도된 동작이고, 그래서 종료 안내 배너를
 * 띄울 페이지가 실제로 살아 있다.
 */
async function fetchByDesertionNo(no: string): Promise<AbandonedPet | null> {
  try {
    const res = await fetch(`${BASE_URL}/abandoned-animals/${encodeURIComponent(no)}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as AbandonedPet) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { detail: string };
}): Promise<Metadata> {
  const pet = await fetchByDesertionNo(params.detail);
  const url = `${SITE_DOMAIN}/abandonment/${params.detail}`;
  if (!pet) {
    return {
      title: "보호 공고 | 파인드마이펫",
      description: "전국 보호소 유기동물 보호 공고 정보",
      alternates: { canonical: url },
      // 존재하지 않는/내려간 공고 — 색인 제외 (검색 품질 신호 보호)
      robots: { index: false, follow: true },
    };
  }
  /**
   * 공고 기간이 끝난 페이지는 noindex 로 검색 유입을 끊는다. 단 URL 은 200 + follow 로 살려둔다 —
   * 이미 색인된 2만여 건을 404 로 만들면 외부 링크·SNS 공유·북마크가 전부 깨지고, 얻는 건
   * "색인 제거가 조금 빠르다" 뿐인데 그건 noindex 로도 된다.
   *
   * canonical 은 self 유지. 개체 상세 → 지역 목록은 등가 콘텐츠가 아니라서 canonical 을 옮기면
   * 무시되거나(최선) noindex 가 대상 페이지로 번질 위험이 있다. self-canonical + noindex 가
   * 서로 모순 없는 유일한 조합이다.
   */
  const closed = isNoticeClosed(pet);
  const kind = formatKindLabel(pet.kindCd) ?? "구조동물";
  const place = pet.happenPlace ?? pet.careAddr ?? "";
  const endedOn = formatYyyyMmDdKo(pet.noticeEdt);
  const title = closed
    ? `${kind} - ${place} 공고 종료 | 파인드마이펫`
    : `${kind} - ${place} 보호중 | 파인드마이펫`;
  const sex =
    pet.sexCd === "M" ? "수컷" : pet.sexCd === "F" ? "암컷" : "성별 미상";
  const description = closed
    ? (
        `${pet.careNm ?? "보호소"} 공고가 ${endedOn ? `${endedOn}에 ` : ""}종료된 ${kind}. ` +
        `현재 상태는 보호소에 직접 확인이 필요합니다. ${sex}, ${pet.age ?? "나이미상"}.` +
        ` 발견: ${place}, ${pet.happenDt ? formatDate(pet.happenDt) : ""}.`
      ).slice(0, 160)
    : (
        `${pet.careNm ?? "보호소"} 에서 보호중인 ${kind}. ${sex}, ${pet.age ?? "나이미상"}, ${pet.weight ?? "체중미상"}.` +
        ` 발견: ${place}, ${pet.happenDt ? formatDate(pet.happenDt) : ""}. ${pet.specialMark ?? ""}`
      ).slice(0, 160);
  const ogImage = pet.popfile ?? pet.filename;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "파인드마이펫",
      locale: "ko_KR",
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: kind }]
        : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    ...(closed ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function AbandonmentDetailPage({
  params,
}: {
  params: { detail: string };
}) {
  const pet = await fetchByDesertionNo(params.detail);

  if (!pet) {
    return (
      <div className="w-full max-w-2xl mx-auto py-20 text-center">
        <h1 className="text-xl font-bold mb-2">공고 정보를 찾을 수 없어요</h1>
        <p className="text-sm text-gray-500 mb-6">
          이미 보관 기간이 지나 내려갔거나, 등록 전 단계일 수 있습니다.
        </p>
        <Link href="/">
          <Button>홈으로</Button>
        </Link>
      </div>
    );
  }

  const closed = isNoticeClosed(pet);
  const kind = formatKindLabel(pet.kindCd) ?? "구조동물";
  const endedOn = formatYyyyMmDdKo(pet.noticeEdt);
  const noticeStart = happenDtToDate(pet.noticeSdt) ?? happenDtToDate(pet.happenDt);
  const noticeEnd = happenDtToDate(pet.noticeEdt);

  /**
   * 상태를 지어내지 않는다. 우리가 아는 건 공고기간(`noticeSdt`~`noticeEdt`)뿐이므로
   * schema.org `Article.expires`("콘텐츠가 만료돼 더 이상 유효하지 않은 날짜")로만 표현한다.
   * headline 에 "보호중" 을 무조건 박아 넣던 예전 코드는 종료된 공고에 현재형 사실을 단언했다.
   */
  const ldJson = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: closed ? `${kind} 보호 공고 (공고 종료)` : `${kind} 보호중`,
    description: pet.specialMark ?? "",
    image: pet.popfile ? [pet.popfile] : [],
    inLanguage: "ko-KR",
    ...(noticeStart ? { datePublished: noticeStart.toISOString() } : {}),
    ...(noticeEnd ? { expires: noticeEnd.toISOString() } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />
      <div className="w-full h-full mb-[100px]">
        <div className="w-full flex justify-between mb-[50px]">
          <Link href="/">
            <Button size="icon">
              <ArrowLeft />
            </Button>
          </Link>
        </div>

        {closed && (
          <div className="mb-4">
            <ClosedNoticeBanner
              noticeEdt={pet.noticeEdt}
              processState={pet.processState}
              careNm={pet.careNm}
              careTel={pet.careTel}
            />
          </div>
        )}

        <div className="mb-4">
          <ShareButtons
            contentType="ABANDONED"
            title={
              closed
                ? `${kind} — ${pet.careNm ?? "보호소"} 공고 종료`
                : `${kind} — ${pet.careNm ?? "보호소"}에서 보호중`
            }
            description={`발견: ${pet.happenPlace ?? ""}${pet.happenDt ? ` (${formatDate(pet.happenDt)})` : ""}. ${pet.specialMark ?? ""}`}
            url={`${SITE_DOMAIN}/abandonment/${params.detail}`}
            imageUrl={pet.popfile ?? pet.filename}
          />
        </div>

        <div className="flex flex-col w-full h-full gap-10">
          <div className="flex w-full sm:justify-between sm:flex-row sm:items-start items-center flex-col gap-6">
            <div className="w-[300px] h-[300px] rounded-md relative bg-gray-100">
              {pet.filename ? (
                <Image
                  src={pet.filename}
                  layout="fill"
                  alt={`${kind} - ${pet.happenPlace ?? ""} ${closed ? "공고 종료" : "보호중"}`}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  사진 없음
                </div>
              )}
            </div>
            <div className="flex flex-col sm:h-full sm:justify-between sm:gap-0 gap-2">
              <Row label="품종" value={kind} />
              <Row label="성별" value={pet.sexCd} />
              <Row label="나이" value={pet.age} />
              <Row label="체중" value={pet.weight} />
            </div>
          </div>

          {pet.specialMark && (
            <div className="w-full bg-blue-100 rounded-md flex justify-start items-center px-4 py-2 text-sm">
              💡 {pet.specialMark}
            </div>
          )}

          <div className="w-full flex flex-col bg-gray-100 rounded-md p-3">
            <h2 className="font-bold mb-2">📍 발견 정보</h2>
            <div className="grid grid-cols-2 w-full gap-4 text-sm">
              <div>
                <h3 className="font-bold text-xs text-gray-500">발견 위치</h3>
                <span>{pet.happenPlace ?? "-"}</span>
              </div>
              <div>
                <h3 className="font-bold text-xs text-gray-500">발견 일시</h3>
                <span>{pet.happenDt ? formatDate(pet.happenDt) : "-"}</span>
              </div>
            </div>
            {pet.happenPlace && <AbandonmentMaps happenPlace={pet.happenPlace} careAddr={pet.careAddr ?? ""} />}
          </div>

          <div className="w-full flex flex-col bg-gray-100 rounded-md p-3">
            <h2 className="font-bold mb-2">📍 보호소 정보</h2>
            <div className="grid grid-cols-2 w-full gap-4 text-sm">
              <div>
                <h3 className="font-bold text-xs text-gray-500">보호소</h3>
                <span>{pet.careNm ?? "-"}</span>
              </div>
              <div>
                <h3 className="font-bold text-xs text-gray-500">주소</h3>
                <span>{pet.careAddr ?? "-"}</span>
              </div>
              <div>
                <h3 className="font-bold text-xs text-gray-500">연락처</h3>
                {pet.careTel ? (
                  <a href={`tel:${pet.careTel}`} className="underline">
                    {pet.careTel}
                  </a>
                ) : (
                  <span>-</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-xs text-gray-500">상태</h3>
                {/* 공공데이터 원본값은 위조하지 않고 그대로 둔다. 다만 이 값은 상류가 갱신을
                    멈춰 "보호중" 으로 얼어붙어 있으므로, 우리가 확실히 아는 사실(공고 기간 종료)을
                    보조 표기로 덧붙여 오해를 막는다. */}
                <span>{pet.processState ?? "-"}</span>
                {closed && (
                  <span className="block text-xs text-amber-700">
                    공고 기간 종료{endedOn ? ` (${endedOn})` : ""} · 현재 상태는 보호소 확인 필요
                  </span>
                )}
              </div>
            </div>
            {pet.careAddr && <ShelterMap careAddr={pet.careAddr} />}
          </div>

          <div className="border-t pt-6 text-center text-sm text-gray-600">
            {/* "강아지/고양이" 로 한정하면 그 외 반려동물 공고가 배제된다. */}
            <p className="mb-3">혹시 우리 아이 같으신가요?</p>
            <Link href="/register">
              <Button>실종 게시글 작성하기</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between items-center w-[300px]">
      <span>{label}</span>
      <div className="w-[250px] h-[50px] rounded-md bg-gray-100 flex justify-center items-center px-2 text-sm">
        {value ?? "-"}
      </div>
    </div>
  );
}
