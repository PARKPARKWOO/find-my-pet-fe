import { formatYyyyMmDdKo } from "@/lib/abandonment";

interface Props {
  /** 법정 공고 종료일 `"YYYYMMDD"`. 없거나 형식이 깨졌으면 날짜 없이 안내만 띄운다. */
  noticeEdt: string | null | undefined;
  /** 상류 `processState`. `"종료(자연사)"` 처럼 괄호에 사유가 붙어 온다. */
  processState: string | null | undefined;
  careNm: string | null | undefined;
  careTel: string | null | undefined;
}

/** `"종료(자연사)"` → `"자연사"`. 종료가 아니거나 괄호가 없으면 null. */
function endedReason(processState: string | null | undefined): string | null {
  if (!processState?.startsWith("종료")) return null;
  return processState.match(/\(([^)]+)\)/)?.[1]?.trim() || null;
}

type Tone = "good" | "sad";

/**
 * 상류가 확정한 사유별 문구.
 *
 * 여기 있는 값들은 **상류가 그렇다고 말한 사실**이므로 그대로 전해도 된다.
 */
const REASON_COPY: Record<string, { title: string; body: string; tone: Tone }> = {
  입양: {
    title: "가족을 만났어요",
    body: "이 아이는 입양되어 보호가 종료되었습니다.",
    tone: "good",
  },
  반환: {
    title: "보호자에게 돌아갔어요",
    body: "이 아이는 원래 보호자를 찾아 돌아갔습니다.",
    tone: "good",
  },
  기증: {
    title: "새 보금자리로 갔어요",
    body: "이 아이는 기증되어 보호가 종료되었습니다.",
    tone: "good",
  },
  자연사: {
    title: "무지개다리를 건넜어요",
    body: "안타깝게도 보호 중 세상을 떠났습니다.",
    tone: "sad",
  },
  안락사: {
    title: "보호가 종료되었습니다",
    body: "안타깝게도 이 아이는 세상을 떠났습니다.",
    tone: "sad",
  },
};

/**
 * 백엔드가 CLOSED 로 판정한 유기동물 상세에 띄우는 안내.
 *
 * 배치 위치가 중요하다 — 뒤로가기 버튼 바로 아래, 공유 버튼보다 **위**다.
 * (1) 사용자가 보호소에 전화를 걸기 전에 반드시 지나치는 최상단이고,
 * (2) 공유 버튼 위여야 이미 끝난 공고를 그대로 퍼뜨리는 걸 억제한다.
 *
 * ## 아는 것과 모르는 것을 섞지 않는다
 *
 * 종전에는 어느 쪽이든 "공고 기간이 종료되었습니다" 하나로 뭉갰다. 그러면 **양방향으로 다 틀린다.**
 *  - 자연사한 아이에게 아직 남은 공고 기간을 이유로 댄다 — 실제로 `441393202600958` 은 공고가
 *    8/6 까지인데 7/27 에 `종료(자연사)` 로 닫혔고, 배너는 "공고 기간이 끝났다" 고 말했다.
 *  - 반대로 종료 사유가 없는 아이에게는 상태를 아는 척하게 된다.
 *
 * 그래서 `processState` 가 `종료(사유)` 면 그 사유를 그대로 전하고, 사유를 모르면
 * **추측하지 않고 보호소 확인으로 넘긴다.** 공고 후에도 보호소가 계속 데리고
 * 있는 경우가 실제로 있어, "입양됐다" 도 "안락사됐다" 도 똑같이 거짓이 될 수 있다.
 */
export default function ClosedNoticeBanner({
  noticeEdt,
  processState,
  careNm,
  careTel,
}: Props) {
  const reason = endedReason(processState);
  const known = reason ? REASON_COPY[reason] : undefined;
  const endedOn = formatYyyyMmDdKo(noticeEdt);

  // 사유는 아는데 우리가 문구를 준비하지 않은 값(상류 신규 코드 등)이면 지어내지 말고 그대로 보여준다.
  const title =
    known?.title ?? (reason ? `보호가 종료되었습니다 (${reason})` : "공고가 종료되었습니다");

  const palette =
    known?.tone === "good"
      ? "border-forest/40 bg-forest/10 text-forest-strong"
      : known?.tone === "sad"
        ? "border-border bg-surface-canvas text-content-secondary"
        : "border-waiting/40 bg-waiting/10 text-waiting";

  return (
    <div role="status" className={`w-full rounded-xl border px-4 py-3 text-sm ${palette}`}>
      <div className="font-bold">
        {title}
      </div>
      <p className="mt-1 leading-relaxed">
        {known ? (
          known.body
        ) : reason ? (
          "이 아이의 보호가 종료되었습니다."
        ) : (
          <>
            이 공고는 종료되었거나 더 이상 제공되지 않습니다.{" "}
            {endedOn ? `표시된 공고 종료일은 ${endedOn}입니다. ` : ""}
            <strong>현재 상태는 보호소에 직접 확인해 주세요.</strong>
          </>
        )}
      </p>
      {/* 사유를 아는 경우에도 연락처는 남긴다 — 입양·반환이면 문의할 일이 있고, 자연사·안락사면
          확인하고 싶은 사람이 있다. 다만 "확인해 주세요" 로 떠밀지는 않는다. */}
      {(careNm || careTel) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {careNm && <span className="font-medium">{careNm}</span>}
          {careTel && (
            <a
              href={`tel:${careTel}`}
              className="inline-flex items-center rounded-md border border-current bg-surface-raised px-3 py-1 font-medium hover:opacity-80"
            >
              {careTel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
