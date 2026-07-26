"use client";

import { useMemo, useRef, useState } from "react";
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

export type FlyerTemplate = "URGENT" | "WARM" | "MINIMAL";

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
};

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

export default function FlyerPrintDialog(props: Props) {
  const printRef = useRef<HTMLDivElement | null>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${props.title} - 전단지`,
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
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>📱 전단지 QR 만들기</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 mb-2">
          A4 한 장 전단지로 출력됩니다. 아래 텍스트는 자유롭게 수정한 다음 인쇄하실 수 있어요.
        </p>

        {/* 템플릿 선택 */}
        <div className="mb-3">
          <p className="text-xs text-gray-600 mb-1">템플릿</p>
          <div className="flex gap-2">
            {(Object.keys(TEMPLATES) as FlyerTemplate[]).map((key) => {
              const t = TEMPLATES[key];
              const active = template === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTemplate(key)}
                  className={`flex-1 text-left p-2 rounded border text-xs ${
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

        {/* 프리뷰: A4(210mm ≈ 794px) 가 다이얼로그보다 넓으므로 scale 로 축소.
            transform 은 인쇄 시 react-to-print 의 iframe 에 영향 없음. */}
        <div
          className="rounded-md bg-muted/40 overflow-auto shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]"
          style={{ maxHeight: "60vh", padding: "12px" }}
        >
          <div
            style={{
              width: "calc(210mm * 0.6)",
              height: "calc(297mm * 0.6)",
              margin: "0 auto",
              overflow: "hidden",
            }}
          >
            <div
              ref={printRef}
              style={{
                transform: "scale(0.6)",
                transformOrigin: "top left",
                width: "210mm",
              }}
            >
              <FlyerSheet
                {...props}
                title={title}
                description={description}
                banner={banner}
                headline={headline}
                subHeadline={subHeadline}
                shareUrl={shareUrl}
                theme={TEMPLATES[template]}
              />
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

  return (
    <div
      data-testid="flyer-sheet"
      className="bg-white text-black mx-auto flex flex-col"
      style={{
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        padding: "8mm",
        border: t.frame,
      }}
    >
      {/* 1. 사진 — 시트 높이의 절반 가까이. 낯선 사람은 글이 아니라 사진으로 알아본다. */}
      <div
        className="relative w-full flex-shrink-0 overflow-hidden"
        style={{ height: "120mm", borderRadius: "6px", border: t.photoBorder }}
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

      {/* 2. 무슨 상황인지 — 헤드라인 + 부제목을 한 덩어리로, 제목은 그 아래 한 줄. */}
      <div className="mb-2 mt-3 text-center">
        <h1
          className="font-extrabold"
          style={{ color: t.primary, fontSize: "32px", lineHeight: 1.15 }}
        >
          {props.headline}
        </h1>
        <p className="mt-1 text-gray-700" style={{ fontSize: "15px" }}>
          {props.subHeadline}
        </p>
      </div>

      {props.title?.trim() && (
        <h2
          className="mb-2 text-center font-bold"
          style={{
            fontSize: "21px",
            lineHeight: 1.3,
            padding: "2.5mm 0",
            borderTop: `2px solid ${t.titleBorder}`,
            borderBottom: `2px solid ${t.titleBorder}`,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {props.title}
        </h2>
      )}

      {/* 3. 전화번호 — 헤드라인 다음으로 시트에서 가장 큰 글자. 흑백 인쇄에서도 또렷하도록
          어두운 배경 + 흰 글자 대비를 쓴다. */}
      <div
        className="mb-2 text-center"
        style={{ backgroundColor: t.phoneBg, color: t.phoneText, borderRadius: "8px", padding: "3mm 0" }}
      >
        <p className="tracking-widest" style={{ fontSize: "11px" }}>
          연락처
        </p>
        <p className="mt-1 font-extrabold tracking-wide" style={{ fontSize: "30px" }}>
          {formatPhone(props.phoneNum)}
        </p>
      </div>

      {/* 4. 사례금 */}
      {showReward && (
        <div
          className="mb-2 flex items-center justify-between"
          style={{ backgroundColor: t.rewardBg, border: t.rewardBorder, borderRadius: "8px", padding: "2.5mm 4mm" }}
        >
          <span className="font-semibold" style={{ color: t.rewardLabelText, fontSize: "13px" }}>
            사례금 · 결정적 제보 시
          </span>
          <span className="font-extrabold" style={{ color: t.rewardText, fontSize: "24px" }}>
            {rewardLabel}
          </span>
        </div>
      )}

      {/* 5. 장소 · 실종 시각 — 박스 그리드가 아니라 조용한 한 줄(최대 2줄로 제한해 아주 긴
          주소가 들어와도 QR 이 시트 밖으로 밀려나지 않게 한다). */}
      {placeTimeLine && (
        <p
          className="mb-2 text-gray-600"
          style={{
            fontSize: "13px",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {placeTimeLine}
        </p>
      )}

      {/* 6. 특징 · 메모 */}
      {props.description?.trim() && (
        <div className="mb-2">
          <p
            className="mb-1 font-bold"
            style={{ color: t.descLabel, letterSpacing: "0.12em", fontSize: "11px" }}
          >
            특징 · 메모
          </p>
          <p
            className="whitespace-pre-wrap pl-3"
            style={{
              borderLeft: t.descLine,
              fontSize: "13px",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {props.description}
          </p>
        </div>
      )}

      {/* 7. QR — 항상 시트 맨 아래에 붙는다(짧은 내용이어도 QR 이 붕 뜨지 않도록). */}
      <div className="mt-auto">
        <div
          className="flex items-center justify-between gap-4"
          style={{ borderTop: "2px solid #D1D5DB", paddingTop: "4mm" }}
        >
          <div className="flex-1" style={{ fontSize: "13px" }}>
            <p className="mb-1 font-bold" style={{ fontSize: "14px" }}>
              {props.postId ? "QR 로 상세 정보 확인" : "QR 로 목격 제보하기"}
            </p>
            <p className="leading-relaxed text-gray-700">
              {props.postId ? (
                <>
                  사진을 더 보거나 오픈채팅·전화로
                  <br />
                  바로 제보할 수 있어요.
                </>
              ) : (
                <>
                  제보 오픈채팅으로 연결돼요.
                  <br />
                  전화가 어려우면 여기로 알려 주세요.
                </>
              )}
            </p>
            <p className="mt-1 break-all text-gray-400" style={{ fontSize: "10px" }}>
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
        <p className="mt-2 text-center text-gray-400" style={{ fontSize: "9px" }}>
          파인드마이펫 · findmypet.platformholder.site
        </p>
      </div>
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
