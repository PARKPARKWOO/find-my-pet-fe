/**
 * AdSense 게시자 ID 를 한 곳에서만 읽는다.
 *
 * 로더 스크립트(`AdSenseScript`), 광고 슬롯(`AdSlot`), `/ads.txt` 가 각자 env 이름을 들고 있으면
 * 하나만 설정됐을 때 "스크립트는 뜨는데 슬롯은 placeholder", "ads.txt 는 비었는데 광고는 로드"
 * 같은 상태가 조용히 만들어진다. AdSense 심사에서 이런 불일치는 그대로 감점이다.
 *
 * `NEXT_PUBLIC_ADSENSE_CLIENT` 가 정식 이름이고, `NEXT_PUBLIC_ADSENSE_CLIENT_ID` 는 먼저 쓰이던
 * 이름이라 이미 배포 환경에 값이 들어가 있을 수 있어 fallback 으로만 남긴다.
 *
 * NEXT_PUBLIC_ 값은 빌드 시점에 문자열로 치환되므로 반드시 `process.env.X` 형태로 직접 써야 한다.
 * 동적 접근(`process.env[name]`)은 치환되지 않아 undefined 가 된다.
 */
// `??` 가 아니라 `||` 인 이유: env 는 "없음"이 아니라 **빈 문자열**로 오는 경우가 흔하다.
// .env.example 을 복사하면 `NEXT_PUBLIC_ADSENSE_CLIENT=` 가 그대로 따라오고, Vercel 대시보드에
// ID 발급 전 키만 미리 만들어 둬도 빈 값이 된다. `??` 는 빈 문자열을 통과시켜 버려서 fallback 이
// 존재하는데도 AdSense 가 통째로 꺼진다 — 에러도 경고도 없이.
const RAW =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "";

/** `ca-pub-XXXXXXXXXXXXXXXX`. 미설정이면 빈 문자열이 아니라 undefined 로 돌려 분기를 강제한다. */
export const ADSENSE_CLIENT: string | undefined = RAW.trim() || undefined;

/**
 * ads.txt 레코드에 쓰는 게시자 ID(`pub-...`).
 *
 * 스크립트 파라미터는 `ca-pub-` 접두사를 쓰지만 ads.txt 는 `pub-` 만 받는다. 접두사를 그대로 두면
 * 형식 오류로 레코드 전체가 무시되므로 여기서 벗겨낸다.
 */
export const ADSENSE_PUBLISHER_ID: string | undefined = ADSENSE_CLIENT?.replace(/^ca-/, "");
