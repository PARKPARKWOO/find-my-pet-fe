import { ADSENSE_PUBLISHER_ID } from "@/app/_components/ads/adsenseClient";

/**
 * `/ads.txt` — IAB Authorized Digital Sellers.
 *
 * 정적 파일(`public/ads.txt`)로 두지 않는 이유: 게시자 ID 가 환경변수라 승인 전후·프리뷰·프로덕션에서
 * 내용이 달라야 한다. 파일로 박아두면 아직 승인받지 않은 ID 가 프리뷰 도메인에도 그대로 노출된다.
 *
 * env 를 읽으므로 빌드 시점에 고정되지 않도록 동적 실행으로 둔다. 정적 생성되면 `ADS_TXT_EXTRA` 를
 * 바꿔도 재빌드 전까지 반영되지 않는다.
 */
export const dynamic = "force-dynamic";

/** AdSense 레코드의 인증기관 ID. Google 고정값이며 게시자마다 달라지지 않는다. */
const GOOGLE_TAG_ID = "f08c47fec0942fa0";

/**
 * 다른 판매자(예: 카카오 AdFit)가 요구하는 레코드를 코드 수정 없이 추가하기 위한 통로.
 * 개행으로 구분한다. `#` 로 시작하는 주석 줄도 그대로 통과시킨다.
 */
function extraLines(): string[] {
  return (process.env.ADS_TXT_EXTRA ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function GET() {
  const lines: string[] = [];

  if (ADSENSE_PUBLISHER_ID) {
    lines.push(`google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, ${GOOGLE_TAG_ID}`);
  }

  // 같은 레코드가 두 번 들어가면 크롤러가 파일 전체를 형식 오류로 볼 수 있어 중복을 제거한다.
  for (const line of extraLines()) {
    if (!lines.includes(line)) lines.push(line);
  }

  // 빈 200 을 내면 안 된다. 크롤러는 "빈 ads.txt = 승인된 판매자 없음" 으로 읽고 이 도메인의
  // 광고 인벤토리를 전부 미승인으로 처리한다 — 파일이 아예 없는 것보다 나쁘다.
  if (lines.length === 0) {
    return new Response("Not Found", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=300",
      },
    });
  }

  return new Response(`${lines.join("\n")}\n`, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // 광고 크롤러는 하루 단위로 재수집한다. 게시자 ID 를 바꾼 뒤 반영이 하루씩 밀리면 곤란하므로
      // 엣지 캐시는 1시간만 잡고 그 뒤로는 백그라운드 갱신에 맡긴다.
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
