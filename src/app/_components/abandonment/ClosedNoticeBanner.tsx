import { formatYyyyMmDdKo } from "@/lib/abandonment";

interface Props {
  /** 법정 공고 종료일 `"YYYYMMDD"`. 없거나 형식이 깨졌으면 날짜 없이 안내만 띄운다. */
  noticeEdt: string | null | undefined;
  careNm: string | null | undefined;
  careTel: string | null | undefined;
}

/**
 * 공고 기간이 끝난 유기동물 상세에 띄우는 안내 배너.
 *
 * 배치 위치가 중요하다 — 뒤로가기 버튼 바로 아래, 공유 버튼보다 **위**다.
 * (1) 사용자가 보호소에 전화를 걸기 전에 반드시 지나치는 최상단이고,
 * (2) 공유 버튼 위여야 이미 끝난 공고를 그대로 퍼뜨리는 걸 억제한다.
 *
 * ⚠️ 문구 제약: 우리가 아는 사실은 **"공고 기간이 끝났다"** 뿐이다.
 *    "입양됐다" / "안락사됐다" 같은 단정은 절대 쓰지 않는다 — 공고 후에도 보호소가
 *    계속 데리고 있는 경우가 실제로 있고, 반대 단정도 마찬가지로 거짓이 된다.
 */
export default function ClosedNoticeBanner({ noticeEdt, careNm, careTel }: Props) {
  const endedOn = formatYyyyMmDdKo(noticeEdt);

  return (
    <div
      role="status"
      className="w-full border-l-4 border-amber-500 bg-amber-50 text-amber-900 px-4 py-3 rounded-r-md text-sm"
    >
      <div className="font-bold">⚠️ 공고 기간이 종료되었습니다</div>
      <p className="mt-1 leading-relaxed">
        {endedOn ? `공고 기간이 ${endedOn}에 끝났습니다. ` : "공고 기간이 이미 끝났습니다. "}
        보호소가 계속 보호 중일 수도, 입양·반환됐을 수도 있습니다.{" "}
        <strong>현재 상태는 보호소에 직접 확인해 주세요.</strong>
      </p>
      {(careNm || careTel) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {careNm && <span className="font-medium">{careNm}</span>}
          {careTel && (
            <a
              href={`tel:${careTel}`}
              className="inline-flex items-center rounded-md border border-amber-400 bg-white px-3 py-1 font-medium text-amber-900 hover:bg-amber-100"
            >
              📞 {careTel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
