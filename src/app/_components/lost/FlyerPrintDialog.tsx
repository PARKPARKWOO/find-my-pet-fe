"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ImageOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { formatDateToKorean, parseGratuityValue } from "@/lib/utils";
import FlyerBlockComposer from "@/app/_components/lost/FlyerBlockComposer";

export interface Props {
  /**
   * 실종 게시글 id. 게시글 없이 전단지만 만드는 경우(/flyer)에는 없다 —
   * 그때 QR 은 서비스 제보 오픈채팅으로 간다.
   */
  postId?: string;
  title: string;
  description: string;
  phoneNum: string;
  place: string;
  time: string;
  thumbnail?: string;
  gratuity: number;
  missingAnimalStatus: "SEARCHING" | "FOUND" | "SEEN";
  children: React.ReactNode; // trigger
}

/**
 * 게시글 없이 만든 전단지의 QR 목적지 — Find-My-Pet 제보 오픈채팅.
 * 게시글이 있으면 그 상세 페이지가 더 많은 정보를 주므로 이 값은 쓰이지 않는다.
 */
export const REPORT_OPEN_CHAT_URL = "https://open.kakao.com/o/pReqeQFi";

/**
 * 템플릿은 취향이 아니라 **붙일 장소와 인쇄 조건**으로 나뉜다.
 *
 * 전단지는 화면이 아니라 종이로 소비된다. 전봇대냐 아파트 게시판이냐, 컬러 프린터냐 흑백
 * 복사기냐에 따라 잘 보이는 배색이 다르다. 그래서 각 템플릿의 caption 에 "어디에 쓰는 것인지"를
 * 적는다 — 색 이름만 나열하면 고를 근거가 없다.
 *
 * 배경은 어느 템플릿이든 흰 종이 그대로다. 전면을 색으로 채우면 잉크가 많이 들고, 사례금·전화번호
 * 같은 검은 글자의 대비가 오히려 떨어진다. 색은 테두리·배너·강조에만 쓴다.
 */
/**
 * 용지 크기.
 *
 * 시트는 A4(210×297mm) 기준으로 **한 번만** 조판하고, 다른 용지는 균일 축소/확대로 만든다.
 * 용지마다 mm 상수를 따로 잡지 않는 이유는 넘침 방지 보장 때문이다 — {@link compositionFits} 의
 * `오버헤드 53 + 사진 60 + 블록 135 ≤ 297` 부등식은 양변에 같은 수를 곱해도 그대로 성립하므로,
 * 균일 배율이면 어떤 용지에서도 **자동으로** 안 깨진다. 상수를 용지별로 다시 잡으면 그 보장이
 * 용지 수만큼 갈라지고, 하나만 틀려도 인쇄물이 잘린다.
 *
 * ISO 규격(A·B 계열)은 전부 1:√2 라 가로세로 비율이 같아 이 방식이 정확히 맞아떨어진다.
 * Letter 만 비율이 달라(0.773) 세로 기준으로 맞추고 좌우에 여백이 남는다.
 */
export type PaperSize = "A3" | "B4" | "A4" | "B5" | "A5" | "LETTER";

export interface PaperConfig {
  label: string;
  /** 용도 안내. 크기 숫자만 보여주면 무엇을 골라야 할지 알 수 없다. */
  caption: string;
  widthMm: number;
  heightMm: number;
  /** `@page { size: ... }` 에 쓰는 CSS 키워드. */
  cssSize: string;
}

export const PAPERS: Record<PaperSize, PaperConfig> = {
  A3: { label: "A3", caption: "가장 큼 · 게시판·전봇대", widthMm: 297, heightMm: 420, cssSize: "A3" },
  B4: { label: "B4", caption: "A4보다 큼 · 눈에 잘 띔", widthMm: 250, heightMm: 353, cssSize: "B4" },
  A4: { label: "A4", caption: "표준 · 대부분의 프린터", widthMm: 210, heightMm: 297, cssSize: "A4" },
  B5: { label: "B5", caption: "손에 나눠주기 좋은 크기", widthMm: 176, heightMm: 250, cssSize: "B5" },
  A5: { label: "A5", caption: "가장 작음 · 우편함·전단 배포", widthMm: 148, heightMm: 210, cssSize: "A5" },
  LETTER: { label: "Letter", caption: "미국 규격 · 좌우 여백 생김", widthMm: 215.9, heightMm: 279.4, cssSize: "letter" },
};

/** 다이얼로그 안에서 시트를 보여줄 때만 쓰는 화면용 축소율. 인쇄물과는 무관하다. */
const PREVIEW_SCALE = 0.6;

/** A4 조판을 이 용지에 앉히는 배율. 가로·세로 중 **더 빡빡한 쪽**을 따라야 어느 축으로도 안 넘친다. */
export function paperScale(paper: PaperConfig): number {
  return Math.min(paper.widthMm / 210, paper.heightMm / 297);
}

/**
 * A4 조판을 목표 용지에 앉히는 액자.
 *
 * 바깥 div 가 실제 용지 크기를 차지하고 `overflow: hidden` 으로 자른다 — transform 은 레이아웃
 * 박스를 바꾸지 않아서, 이 액자가 없으면 축소해도 원래 210×297mm 자리를 그대로 먹어 인쇄 시
 * 빈 두 번째 장이 딸려 나온다.
 */
export function PaperFrame({
  paper,
  children,
}: {
  paper: PaperConfig;
  children: React.ReactNode;
}) {
  const scale = paperScale(paper);
  // Letter 처럼 비율이 다른 용지에서 조판이 왼쪽으로 쏠리지 않게 남는 폭을 반씩 나눈다.
  const sideMm = (paper.widthMm - 210 * scale) / 2;
  return (
    <div
      style={{
        width: `${paper.widthMm}mm`,
        height: `${paper.heightMm}mm`,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: "210mm",
          height: "297mm",
          marginLeft: `${sideMm}mm`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export type FlyerTemplate =
  | "URGENT"
  | "WARM"
  | "NIGHT"
  | "FOREST"
  | "MINIMAL"
  | "COPY";

export interface ThemeConfig {
  label: string;
  caption: string;
  /** A4 sheet 외곽 테두리 css */
  frame: string;
  /** 헤드라인/배너/포인트 컬러 */
  primary: string;
  /** 배너 박스 배경 */
  bannerBg: string;
  bannerText: string;
  /** 사진 프레임 테두리 */
  photoBorder: string;
  /** 사례금 박스 */
  rewardBg: string;
  rewardBorder: string;
  rewardText: string;
  rewardLabelText: string;
  /** 전화번호 박스 */
  phoneBg: string;
  phoneText: string;
  /** 제목 상하 강조선 색 */
  titleBorder: string;
  /** description 좌측 보더 */
  descLine: string;
  /** description 라벨 글자색 */
  descLabel: string;
  /** QR 박스 테두리 */
  qrBorder: string;
}

export const TEMPLATES: Record<FlyerTemplate, ThemeConfig> = {
  URGENT: {
    label: "URGENT",
    caption: "강한 빨강 · 멀리서도 눈에 띔",
    frame: "8px double #B91C1C",
    primary: "#B91C1C",
    bannerBg: "#B91C1C",
    bannerText: "#fff",
    photoBorder: "4px solid #111827",
    rewardBg: "#FEF3C7",
    rewardBorder: "3px solid #B45309",
    rewardText: "#B45309",
    rewardLabelText: "#92400E",
    phoneBg: "#111827",
    phoneText: "#fff",
    titleBorder: "#111827",
    descLine: "3px solid #B91C1C",
    descLabel: "#B91C1C",
    qrBorder: "2px solid #111827",
  },
  WARM: {
    label: "WARM",
    caption: "따뜻한 톤 · 감성적 호소",
    frame: "6px solid #F59E0B",
    primary: "#B45309",
    bannerBg: "#F59E0B",
    bannerText: "#7C2D12",
    photoBorder: "4px solid #B45309",
    rewardBg: "#FFEDD5",
    rewardBorder: "3px solid #C2410C",
    rewardText: "#9A3412",
    rewardLabelText: "#7C2D12",
    phoneBg: "#7C2D12",
    phoneText: "#FEF3C7",
    titleBorder: "#B45309",
    descLine: "3px solid #F59E0B",
    descLabel: "#B45309",
    qrBorder: "2px solid #B45309",
  },
  // 가로등·지하주차장처럼 조도가 낮은 곳. 남색은 어두운 배경 앞에서도 형태가 살고, 노란 배너는
  // 흰 종이 위에서 가장 멀리서 읽히는 조합 중 하나다(도로 표지판이 이 대비를 쓴다).
  NIGHT: {
    label: "NIGHT",
    caption: "남색+노랑 · 어두운 곳·가로등 아래",
    frame: "8px solid #1E3A8A",
    primary: "#1E3A8A",
    bannerBg: "#FACC15",
    bannerText: "#1E3A8A",
    photoBorder: "4px solid #1E3A8A",
    rewardBg: "#FEF9C3",
    rewardBorder: "3px solid #1E3A8A",
    rewardText: "#1E3A8A",
    rewardLabelText: "#1E40AF",
    phoneBg: "#1E3A8A",
    phoneText: "#FACC15",
    titleBorder: "#1E3A8A",
    descLine: "3px solid #FACC15",
    descLabel: "#1E3A8A",
    qrBorder: "2px solid #1E3A8A",
  },
  // 공원·산책로·동물병원 게시판. 경고색이 부담스러운 자리에서 오래 붙여두기 좋다.
  FOREST: {
    label: "FOREST",
    caption: "초록 · 공원·산책로·동물병원 게시판",
    frame: "6px solid #15803D",
    primary: "#15803D",
    bannerBg: "#15803D",
    bannerText: "#F0FDF4",
    photoBorder: "4px solid #166534",
    rewardBg: "#DCFCE7",
    rewardBorder: "3px solid #15803D",
    rewardText: "#14532D",
    rewardLabelText: "#166534",
    phoneBg: "#14532D",
    phoneText: "#F0FDF4",
    titleBorder: "#15803D",
    descLine: "3px solid #15803D",
    descLabel: "#15803D",
    qrBorder: "2px solid #15803D",
  },
  MINIMAL: {
    label: "MINIMAL",
    caption: "흑백 · 잉크 절약 · 빠른 인쇄",
    frame: "2px solid #111827",
    primary: "#111827",
    bannerBg: "#111827",
    bannerText: "#fff",
    photoBorder: "2px solid #111827",
    rewardBg: "#fff",
    rewardBorder: "2px solid #111827",
    rewardText: "#111827",
    rewardLabelText: "#374151",
    phoneBg: "#111827",
    phoneText: "#fff",
    titleBorder: "#111827",
    descLine: "2px solid #111827",
    descLabel: "#111827",
    qrBorder: "2px solid #111827",
  },
  // 흑백 복사기로 수십 장 뽑을 때. MINIMAL 과 색은 같지만 선을 굵게 잡는다 — 복사를 거치면
  // 얇은 선과 회색이 먼저 뭉개져서, 원본에서 멀쩡하던 전단지가 복사본에서 흐려진다.
  COPY: {
    label: "COPY",
    caption: "굵은 흑백 · 복사기로 여러 장 뽑을 때",
    frame: "10px solid #000",
    primary: "#000",
    bannerBg: "#000",
    bannerText: "#fff",
    photoBorder: "6px solid #000",
    rewardBg: "#fff",
    rewardBorder: "5px solid #000",
    rewardText: "#000",
    rewardLabelText: "#000",
    phoneBg: "#000",
    phoneText: "#fff",
    titleBorder: "#000",
    descLine: "5px solid #000",
    descLabel: "#000",
    qrBorder: "3px solid #000",
  },
};

/* ------------------------------------------------------------------ */
/* 블록 구성 — 사용자가 어떤 블록을 넣고 어떤 순서로 배치할지 고른다.               */
/* ------------------------------------------------------------------ */

/** 시트를 구성하는 블록 단위. 배너/헤드라인/부제목은 템플릿 정체성이라 구성 대상이 아니다. */
export type FlyerBlockId =
  | "photo"
  | "title"
  | "contact"
  | "reward"
  | "placeTime"
  | "description"
  | "qr";

/** 항상 켜져 있어야 하는 블록과 그 이유 — 체크박스를 비활성 + 이유 문구로 보여준다. */
export const ALWAYS_ON_BLOCKS: Partial<Record<FlyerBlockId, string>> = {
  title: "이름 없는 전단지는 알아볼 수 없어요",
  contact: "연락할 방법이 없으면 제보를 받을 수 없어요",
};

export const BLOCK_LABELS: Record<FlyerBlockId, string> = {
  photo: "사진",
  title: "제목",
  contact: "연락처",
  reward: "사례금",
  placeTime: "실종 장소·시각",
  description: "특징",
  qr: "QR",
};

/** photo 를 제외한, 사용자가 순서를 바꿀 수 있는 "중간 영역" 기본 순서. */
export const MIDDLE_BLOCKS: FlyerBlockId[] = [
  "title",
  "contact",
  "reward",
  "placeTime",
  "description",
  "qr",
];

export interface FlyerComposition {
  enabled: Record<FlyerBlockId, boolean>;
  /** MIDDLE_BLOCKS 의 순열 — photo 는 남는 공간을 흡수하는 유일한 유연 블록이라
   * 항상 맨 위에 고정하고 여기(순서 대상)에는 포함하지 않는다. */
  order: FlyerBlockId[];
}

export const DEFAULT_COMPOSITION: FlyerComposition = {
  enabled: {
    photo: true,
    title: true,
    contact: true,
    reward: true,
    placeTime: true,
    description: true,
    qr: true,
  },
  order: [...MIDDLE_BLOCKS],
};

/**
 * "절대로 깨지면 안 됨" 을 측정이 아니라 구조로 보장하기 위한 산수.
 *
 * 시트는 297mm 고정 높이 + overflow:hidden 인 flex column 이고, 사진 블록만
 * flex: 1 1 auto 로 남는 공간을 흡수한다(최소 PHOTO_FLOOR_MM 은 유지). 나머지 블록은
 * flex: 0 0 auto + line-clamp 로 상한이 걸려 있어 "최악의 경우 높이(mm)" 를 미리 알 수
 * 있다 — 아래 상수가 그 값이다. (96dpi 기준 1px = 0.2646mm 로, 각 블록 JSX 의 실제
 * padding/line-height/line-clamp 값에서 역산한 뒤 올림했다 — FlyerSheet 의 스타일과
 * 반드시 같이 바뀌어야 한다.)
 *
 *   제목(2줄 clamp)        ≈ 22.6mm → 24mm
 *   연락처(1줄 clamp)      ≈ 21.4mm → 23mm
 *   사례금(1줄 clamp)      ≈ 15.7mm → 17mm
 *   장소·시각(1줄 clamp)   ≈  6.9mm →  8mm
 *   특징(3줄 clamp)        ≈ 22.1mm → 23mm
 *   QR + 하단 브랜딩 문구  ≈ 38.3mm → 40mm
 *
 * 구성 대상이 아니라 항상 켜져 있는 헤드라인+부제목(각 2줄/1줄 clamp) ≈ 31.8mm → 32mm 와
 * 시트 padding(8mm×2) + 최악 템플릿 테두리(URGENT 8px×2 ≈ 4.2mm→5mm)를 더한 값이
 * PERMANENT_OVERHEAD_MM 이다.
 */
export const BLOCK_HEIGHT_MM: Record<Exclude<FlyerBlockId, "photo">, number> = {
  title: 24,
  contact: 23,
  reward: 17,
  placeTime: 8,
  description: 23,
  qr: 40,
};

/** 사진 블록이 아무리 눌려도 이 아래로는 줄어들지 않는 최소 높이. */
export const PHOTO_FLOOR_MM = 60;

/** padding(8mm×2) + 최악 템플릿 테두리(≈4.2mm→5mm) + 항상 켜진 헤드라인 블록(≈32mm). */
export const PERMANENT_OVERHEAD_MM = 16 + 5 + 32;

const SHEET_HEIGHT_MM = 297;

/**
 * 주어진 조합(사진 on/off + 중간 블록 on/off)이 297mm 안에 들어가는지 계산한다.
 * DOM 을 재는 게 아니라 위 상수들의 산수이므로 폰트 로딩·긴 CJK 문자열·프린터 DPI 와
 * 무관하게 항상 같은 답을 낸다 — "측정 후 경고"가 아니라 "애초에 불가능한 조합을 못 만들게" 하는
 * 축.
 */
export function compositionFits(enabled: Record<FlyerBlockId, boolean>): boolean {
  const fixedSum = MIDDLE_BLOCKS.reduce(
    (sum, id) => sum + (enabled[id] ? BLOCK_HEIGHT_MM[id as Exclude<FlyerBlockId, "photo">] : 0),
    0,
  );
  const overhead = PERMANENT_OVERHEAD_MM + (enabled.photo ? PHOTO_FLOOR_MM : 0);
  return fixedSum + overhead <= SHEET_HEIGHT_MM;
}

/** enabled 를 유지한 채 blockId 만 켰을 때도 여전히 들어가는지 — 토글 활성화 가능 여부에 쓴다. */
export function canToggleBlock(
  enabled: Record<FlyerBlockId, boolean>,
  blockId: FlyerBlockId,
): boolean {
  if (enabled[blockId]) return true; // 끄는 것은 항상 허용 — 공간이 늘어날 뿐이다.
  return compositionFits({ ...enabled, [blockId]: true });
}

/** localStorage 에서 복원한 값이 최신 블록 목록과 어긋나 있어도 항상 유효한 구성으로 만든다. */
export function sanitizeComposition(input: unknown): FlyerComposition {
  const fallback = DEFAULT_COMPOSITION;
  if (!input || typeof input !== "object") return fallback;
  const candidate = input as Partial<FlyerComposition>;

  const enabled: Record<FlyerBlockId, boolean> = { ...fallback.enabled };
  if (candidate.enabled && typeof candidate.enabled === "object") {
    (Object.keys(enabled) as FlyerBlockId[]).forEach((id) => {
      const v = (candidate.enabled as Record<string, unknown>)[id];
      if (typeof v === "boolean") enabled[id] = v;
    });
  }
  // 항상 켜진 블록은 저장된 값과 무관하게 강제로 켠다.
  (Object.keys(ALWAYS_ON_BLOCKS) as FlyerBlockId[]).forEach((id) => {
    enabled[id] = true;
  });

  const savedOrder = Array.isArray(candidate.order) ? candidate.order : [];
  const known = new Set(MIDDLE_BLOCKS);
  const seen = new Set<FlyerBlockId>();
  const deduped: FlyerBlockId[] = [];
  savedOrder.forEach((id) => {
    if (known.has(id as FlyerBlockId) && !seen.has(id as FlyerBlockId)) {
      seen.add(id as FlyerBlockId);
      deduped.push(id as FlyerBlockId);
    }
  });
  const missing = MIDDLE_BLOCKS.filter((id) => !seen.has(id));

  return { enabled, order: [...deduped, ...missing] };
}

/**
 * 헤드라인/배너/부제목 기본 카피 — missingAnimalStatus 에 따라 갈린다.
 * 다이얼로그(FlyerPrintDialog) 와 게시글 없는 상시 미리보기(/flyer) 가 같은 기본값을
 * 쓰도록 export 해서 문구가 두 곳에서 따로 굳어(drift) 지 않게 한다.
 */
export function getDefaultFlyerCopy(
  missingAnimalStatus: Props["missingAnimalStatus"],
  title: string,
  description: string,
) {
  const isSeen = missingAnimalStatus === "SEEN";
  return {
    banner: isSeen ? "긴급 · 목격 제보 요청" : "긴급 · 실종 동물",
    headline: isSeen ? "이 아이를 본 적 있나요?" : "가족을 찾습니다",
    subHeadline: isSeen ? "목격 정보를 알려 주세요" : "도움이 절실합니다",
    title,
    description,
  };
}

/** 게시글이 있으면 상세로, 없으면 제보 오픈채팅으로 보낸다. */
export function getFlyerShareUrl(postId: string | undefined): string {
  return postId
    ? typeof window !== "undefined"
      ? `${window.location.origin}/lost/${postId}`
      : `/lost/${postId}`
    : REPORT_OPEN_CHAT_URL;
}

/** 블록 구성은 게시글/사진과 달리 "이 사람이 전단지를 어떻게 짜는지" 취향에 가까워
 * postId 유무와 무관하게 하나의 키로 공유해서 저장한다. */
const FLYER_COMPOSITION_STORAGE_KEY = "fmp:flyer:composition:v1";

export default function FlyerPrintDialog(props: Props) {
  const printRef = useRef<HTMLDivElement | null>(null);
  const [paper, setPaper] = useState<PaperSize>("A4");
  const paperConfig = PAPERS[paper];
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${props.title} - 전단지`,
    // @page 로 실제 용지를 지정하지 않으면 브라우저 기본값(대개 A4)에 맞춰 축소·확대돼서
    // 화면에서 고른 크기와 나오는 종이가 어긋난다. margin: 0 은 시트가 이미 8mm padding 을
    // 갖고 있어 이중 여백을 막기 위한 것.
    pageStyle: `@page { size: ${paperConfig.cssSize}; margin: 0; } @media print { body { margin: 0; } }`,
  });

  // 게시글이 있으면 상세로, 없으면 제보 오픈채팅으로 보낸다. 게시글 없는 전단지는 QR 이 가리킬
  // 상세 페이지 자체가 없으므로, 주운 사람이 곧바로 연락할 수 있는 창구가 유일하게 의미 있는 목적지다.
  const shareUrl = getFlyerShareUrl(props.postId);

  // 한글 기본 카피 — 사용자가 입력 필드로 자유 편집 가능
  const defaults = useMemo(
    () => getDefaultFlyerCopy(props.missingAnimalStatus, props.title, props.description),
    [props.missingAnimalStatus, props.title, props.description],
  );

  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState(defaults.banner);
  const [headline, setHeadline] = useState(defaults.headline);
  const [subHeadline, setSubHeadline] = useState(defaults.subHeadline);
  const [title, setTitle] = useState(defaults.title);
  const [description, setDescription] = useState(defaults.description);
  const [template, setTemplate] = useState<FlyerTemplate>("URGENT");

  // 블록 구성(어떤 블록을 넣고 어떤 순서로 보일지) — 사진은 절대 여기 저장하지 않는다
  // (object URL 은 새로고침을 못 버틴다). 기본값은 항상 "전체 켜짐"이라 게시글 기반
  // 흐름에서도, 게시글 없는 흐름에서도 처음엔 완전한 전단지가 보인다.
  const [composition, setComposition] = useState<FlyerComposition>(DEFAULT_COMPOSITION);
  const [compositionRestored, setCompositionRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FLYER_COMPOSITION_STORAGE_KEY);
      if (raw) setComposition(sanitizeComposition(JSON.parse(raw)));
    } catch {
      // 손상된 값은 무시하고 기본 구성(전체 켜짐)을 쓴다.
    } finally {
      setCompositionRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!compositionRestored) return;
    try {
      localStorage.setItem(FLYER_COMPOSITION_STORAGE_KEY, JSON.stringify(composition));
    } catch {
      // 저장 공간이 없거나 프라이빗 모드면 조용히 무시 — 구성 자체는 세션 동안 계속 동작한다.
    }
  }, [composition, compositionRestored]);

  const reset = () => {
    setBanner(defaults.banner);
    setHeadline(defaults.headline);
    setSubHeadline(defaults.subHeadline);
    setTitle(defaults.title);
    setDescription(defaults.description);
  };

  // 트리거(children)는 이 컴포넌트가 마운트되자마자 화면에 있지만, 그 시점의 title/description 은
  // 아직 비어 있을 수 있다(특히 게시글 없이 바로 쓰는 /flyer). useState 초기값은 마운트 시점 한
  // 번만 반영되므로, 그대로 두면 다이얼로그를 열었을 때 사용자가 그 사이 입력한 내용이 아니라
  // 마운트 당시의 빈 값이 인쇄물에 남는다. 다이얼로그를 "열 때마다" 최신 props 로 다시 맞춘다.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      {/*
        `max-h` + `overflow-y-auto` 가 없으면 다이얼로그를 아예 쓸 수 없다.
        shadcn DialogContent 는 `fixed top-1/2 -translate-y-1/2` 로 화면 중앙에 고정된다. 내용이
        뷰포트보다 길어지면 위아래로 똑같이 삐져나가는데, `fixed` 라서 페이지 스크롤로는 닿지 않는다.
        여기 내용은 템플릿 선택 + 구성 편집기 + 입력 6개 + 미리보기(60vh) + 버튼이라 노트북에서도
        넘긴다 — 그 결과 하단 인쇄 버튼에 손이 닿지 않아 "창이 떴는데 아무것도 못 하는" 상태가 됐다.
        `dvh` 인 이유: 모바일 브라우저 주소창이 접히면 `vh` 는 갱신되지 않아 잘린 채로 남는다.
      */}
      <DialogContent className="max-w-4xl max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📱 전단지 QR 만들기</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 mb-2">
          A4 한 장 전단지로 출력됩니다. 아래 텍스트는 자유롭게 수정한 다음 인쇄하실 수 있어요.
        </p>

        {/* 용지 선택 — 조판은 A4 하나로 하고 균일 배율로 앉히므로, 어느 걸 골라도 넘치지 않는다. */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">용지</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(PAPERS) as PaperSize[]).map((key) => {
              const p = PAPERS[key];
              const active = paper === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPaper(key)}
                  aria-pressed={active}
                  className={`text-left p-2 rounded border text-xs transition-colors ${
                    active ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="font-bold">{p.label}</span>
                  <span className="ml-1.5 text-[10px] text-gray-400">
                    {Math.round(p.widthMm)}×{Math.round(p.heightMm)}mm
                  </span>
                  <p className="text-[10px] text-gray-500 mt-0.5">{p.caption}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 템플릿 선택 */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">템플릿</p>
          {/* flex-1 한 줄이 아니라 그리드인 이유: 템플릿이 6개라 한 줄에 밀어 넣으면 caption 이
              한 글자씩 끊긴다. caption 은 "어디에 붙일 것인가"를 알려주는 유일한 단서라 잘리면 안 된다. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(TEMPLATES) as FlyerTemplate[]).map((key) => {
              const t = TEMPLATES[key];
              const active = template === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTemplate(key)}
                  aria-pressed={active}
                  className={`text-left p-2 rounded border text-xs transition-colors ${
                    active ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: t.primary }}
                  />
                  <span className="font-bold">{t.label}</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">{t.caption}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 블록 구성 — 어떤 블록을 넣고 어떤 순서로 보일지. 체크박스 + 위/아래 버튼만 쓰는
            이유와 297mm 산수는 FlyerBlockComposer/compositionFits 주석 참고. */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">구성</p>
          <FlyerBlockComposer composition={composition} onChange={setComposition} />
        </div>

        {/* 편집 폼 — 카피 / 제목 / 설명 직접 수정 */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <FieldInput label="상단 배너" value={banner} onChange={setBanner} />
          <FieldInput label="부제목" value={subHeadline} onChange={setSubHeadline} />
          <FieldInput label="헤드라인" value={headline} onChange={setHeadline} />
          <FieldInput label="제목" value={title} onChange={setTitle} />
          <div className="col-span-2">
            <label className="block text-xs text-gray-600 mb-1">특징 · 메모</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border rounded px-2 py-1 text-sm resize-y"
            />
          </div>
          <div className="col-span-2 flex justify-end">
            <button
              type="button"
              onClick={reset}
              className="text-xs text-gray-500 hover:underline"
            >
              ↺ 기본 문구로 되돌리기
            </button>
          </div>
        </div>

        {/* 프리뷰: 실제 용지(A3면 297mm)가 다이얼로그보다 넓으므로 화면용으로 한 번 더 축소한다.
            이 축소는 바깥 div 가 맡고 printRef 는 그 **안쪽** 에 둔다 — react-to-print 는 대상
            노드를 cloneNode 로 복제하므로 인라인 style 이 그대로 따라가고, printRef 에 화면용
            scale 이 걸려 있으면 인쇄물까지 같이 줄어 종이 왼쪽 위에 작게 찍힌다. */}
        <div
          className="rounded-md bg-muted/40 overflow-auto shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
          style={{ maxHeight: "60vh", padding: "12px" }}
        >
          <div
            style={{
              width: `calc(${paperConfig.widthMm}mm * ${PREVIEW_SCALE})`,
              height: `calc(${paperConfig.heightMm}mm * ${PREVIEW_SCALE})`,
              margin: "0 auto",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
                width: `${paperConfig.widthMm}mm`,
              }}
            >
              <div ref={printRef}>
                <PaperFrame paper={paperConfig}>
                <FlyerSheet
                  {...props}
                  title={title}
                  description={description}
                  banner={banner}
                  headline={headline}
                  subHeadline={subHeadline}
                  shareUrl={shareUrl}
                  theme={TEMPLATES[template]}
                  composition={composition}
                />
                </PaperFrame>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(shareUrl)}>
            링크 복사
          </Button>
          <Button onClick={() => handlePrint()}>🖨️ 인쇄 / PDF 저장</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** FlyerSheet 가 실제로 쓰는 콘텐츠 필드 — 다이얼로그 트리거용 children 은 제외. */
export type FlyerSheetContentProps = Omit<Props, "children">;

export interface FlyerSheetProps extends FlyerSheetContentProps {
  shareUrl: string;
  banner: string;
  headline: string;
  subHeadline: string;
  theme: ThemeConfig;
  composition: FlyerComposition;
}

/**
 * 실제 인쇄 대상 레이아웃 — A4 기준, theme 에 따라 색상 변형.
 *
 * /flyer 의 실시간 미리보기와 다이얼로그의 인쇄 대상이 반드시 이 컴포넌트 하나를 공유한다 —
 * 별도의 "닮은꼴" 미리보기를 만들면 미리보기와 실제 인쇄물이 어긋날 수 있기 때문.
 *
 * 3m 밖에서 2초 안에 읽는 사람을 기준으로 순서를 짰다: 사진 → 무슨 상황인지 → 전화번호 →
 * 사례금 → 장소·시각 → 특징 → QR. 이모지는 인쇄물에서 멀리서 보면 뭉개지고 흑백 인쇄에 약해
 * 화면 UI 와 달리 여기서는 쓰지 않는다.
 */
export const FlyerSheet = (props: FlyerSheetProps) => {
  const showReward = props.gratuity > 0;
  const rewardLabel = showReward
    ? parseGratuityValue(props.gratuity, props.missingAnimalStatus)
    : null;
  const t = props.theme;
  const placeTimeLine = buildPlaceTimeLine(props.place, props.time);
  const { enabled, order } = props.composition;

  /** line-clamp N — 입력 길이가 얼마든 이 블록의 높이 상한을 못 넘게 막는다.
   * "측정 후 줄이기"가 아니라 "애초에 그 이상 자라지 못하게" 하는 쪽. */
  const clamp = (lines: number): CSSProperties => ({
    display: "-webkit-box",
    WebkitLineClamp: lines,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    wordBreak: "break-word",
  });

  // 각 블록은 flex: 0 0 auto(Tailwind flex-none) 로 고정 — 사진(flex: 1 1 auto)만 유연하다.
  // BLOCK_HEIGHT_MM/compositionFits 의 산수가 바로 이 clamp 값들에서 나온 것이라, 여길
  // 고치면 그 상수도 같이 고쳐야 한다.
  const blockNodes: Partial<Record<FlyerBlockId, ReactNode>> = {
    title: props.title?.trim() ? (
      <h2
        key="title"
        className="mb-2 flex-none text-center font-bold"
        style={{
          fontSize: "21px",
          lineHeight: 1.3,
          padding: "2.5mm 0",
          borderTop: `2px solid ${t.titleBorder}`,
          borderBottom: `2px solid ${t.titleBorder}`,
          ...clamp(2),
        }}
      >
        {props.title}
      </h2>
    ) : null,

    contact: (
      <div
        key="contact"
        className="mb-2 flex-none text-center"
        style={{
          backgroundColor: t.phoneBg,
          color: t.phoneText,
          borderRadius: "8px",
          padding: "3mm 0",
        }}
      >
        <p className="tracking-widest" style={{ fontSize: "11px", lineHeight: 1.2, ...clamp(1) }}>
          연락처
        </p>
        <p
          className="mt-1 font-extrabold tracking-wide"
          style={{ fontSize: "30px", lineHeight: 1.1, ...clamp(1) }}
        >
          {formatPhone(props.phoneNum)}
        </p>
      </div>
    ),

    reward: showReward ? (
      <div
        key="reward"
        className="mb-2 flex flex-none items-center justify-between gap-3"
        style={{
          backgroundColor: t.rewardBg,
          border: t.rewardBorder,
          borderRadius: "8px",
          padding: "2.5mm 4mm",
        }}
      >
        <span
          className="font-semibold"
          style={{ color: t.rewardLabelText, fontSize: "13px", lineHeight: 1.2, ...clamp(1) }}
        >
          사례금 · 결정적 제보 시
        </span>
        <span
          className="shrink-0 font-extrabold"
          style={{ color: t.rewardText, fontSize: "24px", lineHeight: 1.1, ...clamp(1) }}
        >
          {rewardLabel}
        </span>
      </div>
    ) : null,

    // 아주 긴 주소가 들어와도 1줄 clamp 라 QR 이 시트 밖으로 밀려나지 않는다.
    placeTime: placeTimeLine ? (
      <p
        key="placeTime"
        className="mb-2 flex-none text-gray-600"
        style={{ fontSize: "13px", lineHeight: 1.4, ...clamp(1) }}
      >
        {placeTimeLine}
      </p>
    ) : null,

    description: props.description?.trim() ? (
      <div key="description" className="mb-2 flex-none">
        <p
          className="mb-1 font-bold"
          style={{
            color: t.descLabel,
            letterSpacing: "0.12em",
            fontSize: "11px",
            lineHeight: 1.2,
            ...clamp(1),
          }}
        >
          특징 · 메모
        </p>
        <p
          className="whitespace-pre-wrap pl-3"
          style={{ borderLeft: t.descLine, fontSize: "13px", lineHeight: 1.5, ...clamp(3) }}
        >
          {props.description}
        </p>
      </div>
    ) : null,

    qr: (
      <div key="qr" className="flex-none">
        <div
          className="flex items-center justify-between gap-4"
          style={{ borderTop: "2px solid #D1D5DB", paddingTop: "4mm" }}
        >
          <div className="min-w-0 flex-1" style={{ fontSize: "13px" }}>
            <p className="mb-1 font-bold" style={{ fontSize: "14px", lineHeight: 1.3, ...clamp(1) }}>
              {props.postId ? "QR 로 상세 정보 확인" : "QR 로 목격 제보하기"}
            </p>
            <p className="leading-relaxed text-gray-700" style={clamp(2)}>
              {props.postId
                ? "사진을 더 보거나 오픈채팅·전화로 바로 제보할 수 있어요."
                : "제보 오픈채팅으로 연결돼요. 전화가 어려우면 여기로 알려 주세요."}
            </p>
            <p
              className="mt-1 break-all text-gray-400"
              style={{ fontSize: "10px", lineHeight: 1.3, ...clamp(1) }}
            >
              {props.shareUrl}
            </p>
          </div>
          <div
            style={{
              flexShrink: 0,
              padding: "6px",
              backgroundColor: "#fff",
              border: t.qrBorder,
              borderRadius: "4px",
              // SVG 가 자식으로 들어갈 때 baseline 공백 제거
              lineHeight: 0,
            }}
          >
            <QRCodeSVG value={props.shareUrl} size={92} level="M" includeMargin style={{ display: "block" }} />
          </div>
        </div>

        {/* FOOTER */}
        <p
          className="mt-2 text-center text-gray-400"
          style={{ fontSize: "9px", lineHeight: 1.3, ...clamp(1) }}
        >
          파인드마이펫 · findmypet.platformholder.site
        </p>
      </div>
    ),
  };

  return (
    <div
      data-testid="flyer-sheet"
      className="bg-white text-black mx-auto flex flex-col overflow-hidden"
      style={{
        width: "210mm",
        height: "297mm",
        boxSizing: "border-box",
        padding: "8mm",
        border: t.frame,
      }}
    >
      {/* 1. 사진 — 유일한 유연 블록. flex: 1 1 auto 로 남는 공간을 전부 흡수하고, 다른
          블록이 켜질수록 스스로 줄어든다(최소 PHOTO_FLOOR_MM=60mm 은 항상 유지). 사진이
          없어도(파일을 아직 안 골랐어도) 자리 자체는 그대로 지켜 구도가 튀지 않게 한다. */}
      {enabled.photo && (
        <div
          className="relative w-full overflow-hidden"
          style={{
            flex: "1 1 auto",
            minHeight: `${PHOTO_FLOOR_MM}mm`,
            borderRadius: "6px",
            border: t.photoBorder,
          }}
        >
          <span
            className="absolute left-0 top-0 z-10 font-bold"
            style={{
              backgroundColor: t.bannerBg,
              color: t.bannerText,
              letterSpacing: "0.12em",
              fontSize: "11px",
              padding: "2.5mm 5mm",
              borderBottomRightRadius: "6px",
            }}
          >
            {props.banner}
          </span>
          {props.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.thumbnail}
              alt={props.title || "실종동물 사진"}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-2"
              style={{ backgroundColor: "#F3F4F6", color: "#9CA3AF" }}
            >
              <ImageOff size={48} strokeWidth={1.5} />
              <span className="text-sm font-medium">사진 없음</span>
            </div>
          )}
        </div>
      )}

      {/* 2. 무슨 상황인지 — 구성 대상이 아니라 항상 켜져 있다(템플릿 정체성의 일부). 자유
          입력 텍스트라 여기도 line-clamp 로 상한을 건다. */}
      <div className="mb-2 mt-3 flex-none text-center">
        <h1
          className="font-extrabold"
          style={{ color: t.primary, fontSize: "32px", lineHeight: 1.15, ...clamp(2) }}
        >
          {props.headline}
        </h1>
        <p className="mt-1 text-gray-700" style={{ fontSize: "15px", lineHeight: 1.4, ...clamp(1) }}>
          {props.subHeadline}
        </p>
      </div>

      {/* 3~7. 나머지 블록 — 사용자가 고른 순서 그대로 렌더링한다. 프리뷰와 인쇄가 이 컴포넌트
          하나를 공유하므로 여기서 갈리는 순서가 곧 인쇄되는 순서다. */}
      {order.map((id) => (enabled[id] ? blockNodes[id] : null))}
    </div>
  );
};

/**
 * 실종 시각 입력값을 사람이 읽을 수 있는 형태로 바꾼다.
 *
 * 게시글 기반 전단지의 time 은 ISO 날짜 문자열이라 formatDateToKorean 이 그대로 통하지만,
 * 게시글 없이 만드는 /flyer 는 "2026년 7월 26일 오후 3시쯤" 같은 자유 텍스트를 그대로 받는다.
 * new Date(...) 가 못 읽는 값이면 "Invalid Date" 를 찍는 대신 입력한 텍스트를 그대로 쓴다.
 */
function formatFlyerTime(raw: string): string {
  const trimmed = raw?.trim();
  if (!trimmed) return "";
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return formatDateToKorean(trimmed);
  return trimmed;
}

/** 장소·실종 시각을 한 줄로 합친다. 둘 다 비어 있으면 아예 렌더링하지 않는다. */
function buildPlaceTimeLine(place: string, time: string): string {
  const parts: string[] = [];
  if (place?.trim()) parts.push(`장소 ${place.trim()}`);
  const formattedTime = formatFlyerTime(time ?? "");
  if (formattedTime) parts.push(`시각 ${formattedTime}`);
  return parts.join("   ·   ");
}

/** 다이얼로그 편집용 입력 — 라벨 + input. */
const FieldInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <label className="block text-xs text-gray-600 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded px-2 py-1 text-sm"
    />
  </div>
);

/** 010XXXXXXXX → 010-XXXX-XXXX */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
}
