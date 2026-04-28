import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BASE_URL } from "@/app/constant/api";
import { Button } from "@/app/_components/ui/button";
import { formatDate } from "@/lib/utils";
import AbandonmentMaps, { ShelterMap } from "./AbandonmentMaps";

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
}

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
      title: "보호중 동물 | 파인드마이펫",
      description: "전국 보호소 보호중 동물 정보",
      alternates: { canonical: url },
    };
  }
  const kind = pet.kindCd ?? "구조동물";
  const place = pet.happenPlace ?? pet.careAddr ?? "";
  const title = `${kind} - ${place} 보호중 | 파인드마이펫`;
  const sex =
    pet.sexCd === "M" ? "수컷" : pet.sexCd === "F" ? "암컷" : "성별 미상";
  const description =
    `${pet.careNm ?? "보호소"} 에서 보호중인 ${kind}. ${sex}, ${pet.age ?? "나이미상"}, ${pet.weight ?? "체중미상"}.` +
    ` 발견: ${place}, ${pet.happenDt ? formatDate(pet.happenDt) : ""}. ${pet.specialMark ?? ""}`.slice(
      0,
      160,
    );
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
        <h1 className="text-xl font-bold mb-2">보호중 정보를 찾을 수 없어요</h1>
        <p className="text-sm text-gray-500 mb-6">
          이미 입양·반환 등으로 보호 종료됐거나, 등록 전 단계일 수 있습니다.
        </p>
        <Link href="/">
          <Button>홈으로</Button>
        </Link>
      </div>
    );
  }

  const ldJson = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${pet.kindCd ?? "구조동물"} 보호중`,
    description: pet.specialMark ?? "",
    image: pet.popfile ? [pet.popfile] : [],
    inLanguage: "ko-KR",
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

        <div className="flex flex-col w-full h-full gap-10">
          <div className="flex w-full sm:justify-between sm:flex-row sm:items-start items-center flex-col gap-6">
            <div className="w-[300px] h-[300px] rounded-md relative bg-gray-100">
              {pet.filename ? (
                <Image
                  src={pet.filename}
                  layout="fill"
                  alt={`${pet.kindCd ?? "구조동물"} - ${pet.happenPlace ?? ""} 보호중`}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  사진 없음
                </div>
              )}
            </div>
            <div className="flex flex-col sm:h-full sm:justify-between sm:gap-0 gap-2">
              <Row label="품종" value={pet.kindCd} />
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
                <span>{pet.careTel ?? "-"}</span>
              </div>
              <div>
                <h3 className="font-bold text-xs text-gray-500">상태</h3>
                <span>{pet.processState ?? "-"}</span>
              </div>
            </div>
            {pet.careAddr && <ShelterMap careAddr={pet.careAddr} />}
          </div>

          <div className="border-t pt-6 text-center text-sm text-gray-600">
            <p className="mb-3">혹시 우리 강아지/고양이 같으신가요?</p>
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
