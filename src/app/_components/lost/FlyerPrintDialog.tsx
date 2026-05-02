"use client";

import { useMemo, useRef, useState } from "react";
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

interface Props {
  postId: string;
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

type FlyerTemplate = "URGENT" | "WARM" | "MINIMAL";

interface ThemeConfig {
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

const TEMPLATES: Record<FlyerTemplate, ThemeConfig> = {
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

export default function FlyerPrintDialog(props: Props) {
  const printRef = useRef<HTMLDivElement | null>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${props.title} - 전단지`,
  });

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lost/${props.postId}`
      : `/lost/${props.postId}`;

  // 한글 기본 카피 — 사용자가 입력 필드로 자유 편집 가능
  const isSeen = props.missingAnimalStatus === "SEEN";
  const defaults = useMemo(
    () => ({
      banner: isSeen ? "긴급 · 목격 제보 요청" : "긴급 · 실종 동물",
      headline: isSeen ? "이 아이를 본 적 있나요?" : "가족을 찾습니다",
      subHeadline: isSeen ? "목격 정보를 알려 주세요" : "도움이 절실합니다",
      title: props.title,
      description: props.description,
    }),
    [isSeen, props.title, props.description],
  );

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

  return (
    <Dialog>
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
          className="border rounded bg-gray-100 overflow-auto"
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

/** 실제 인쇄 대상 레이아웃 — A4 기준, theme 에 따라 색상 변형. */
const FlyerSheet = (
  props: Props & {
    shareUrl: string;
    banner: string;
    headline: string;
    subHeadline: string;
    theme: ThemeConfig;
  },
) => {
  const showReward = props.gratuity > 0;
  const rewardLabel = showReward
    ? parseGratuityValue(props.gratuity, props.missingAnimalStatus)
    : null;
  const t = props.theme;

  return (
    <div
      className="bg-white text-black mx-auto relative"
      style={{
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        padding: "16mm",
        border: t.frame,
      }}
    >
      {/* HEADER */}
      <div className="text-center mb-6">
        <div
          className="inline-block px-6 py-2 mb-3"
          style={{ backgroundColor: t.bannerBg, color: t.bannerText, letterSpacing: "0.15em" }}
        >
          <span className="text-sm font-bold">{props.banner}</span>
        </div>
        <h1
          className="text-5xl font-extrabold mb-2"
          style={{ color: t.primary, lineHeight: 1.1 }}
        >
          🐾 {props.headline}
        </h1>
        <p className="text-lg text-gray-700">{props.subHeadline}</p>
      </div>

      {/* TITLE */}
      {props.title?.trim() && (
        <h2
          className="text-3xl font-bold text-center mb-6 py-3"
          style={{ borderTop: `2px solid ${t.titleBorder}`, borderBottom: `2px solid ${t.titleBorder}` }}
        >
          {props.title}
        </h2>
      )}

      {/* PHOTO + REWARD */}
      <div className="flex gap-6 mb-6">
        <div className="flex-1 flex justify-center">
          {props.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.thumbnail}
              alt={props.title}
              style={{
                width: "100%",
                maxWidth: "260px",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                border: t.photoBorder,
                borderRadius: "4px",
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center text-gray-400"
              style={{ width: "260px", height: "260px", border: t.photoBorder, borderRadius: "4px" }}
            >
              사진 없음
            </div>
          )}
        </div>
        {showReward && (
          <div
            className="flex flex-col items-center justify-center px-4"
            style={{
              minWidth: "150px",
              backgroundColor: t.rewardBg,
              border: t.rewardBorder,
              borderRadius: "8px",
            }}
          >
            <span className="text-sm font-semibold" style={{ color: t.rewardLabelText }}>
              사례금
            </span>
            <span
              className="text-3xl font-extrabold mt-1 text-center"
              style={{ color: t.rewardText, lineHeight: 1.1 }}
            >
              {rewardLabel}
            </span>
            <span className="text-xs mt-2 text-gray-600 text-center">
              결정적 제보 시
            </span>
          </div>
        )}
      </div>

      {/* INFO GRID */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <InfoBox label="📍 실종 장소">{props.place}</InfoBox>
        <InfoBox label="🕒 실종 시간">{formatDateToKorean(props.time)}</InfoBox>
      </div>

      {/* PHONE */}
      <div
        className="text-center py-4 mb-6"
        style={{ backgroundColor: t.phoneBg, color: t.phoneText, borderRadius: "8px" }}
      >
        <p className="text-sm tracking-widest mb-1">📞 연락처</p>
        <p className="text-4xl font-extrabold tracking-wide">{formatPhone(props.phoneNum)}</p>
      </div>

      {/* DESCRIPTION */}
      {props.description?.trim() && (
        <div className="mb-6">
          <p
            className="text-xs font-bold mb-2"
            style={{ color: t.descLabel, letterSpacing: "0.15em" }}
          >
            특징 · 메모
          </p>
          <p
            className="text-base whitespace-pre-wrap leading-relaxed pl-3"
            style={{ borderLeft: t.descLine }}
          >
            {props.description}
          </p>
        </div>
      )}

      {/* QR */}
      <div className="border-t-2 border-gray-300 pt-5 flex items-center justify-between gap-6">
        <div className="text-sm flex-1">
          <p className="font-bold text-base mb-1">📱 QR 로 상세 정보 확인</p>
          <p className="text-gray-700 leading-relaxed">
            사진을 더 보거나 오픈채팅·전화로
            <br />
            바로 제보할 수 있어요.
          </p>
          <p className="text-xs text-gray-400 mt-2 break-all">{props.shareUrl}</p>
        </div>
        <div
          style={{
            flexShrink: 0,
            padding: "8px",
            backgroundColor: "#fff",
            border: t.qrBorder,
            borderRadius: "4px",
            // SVG 가 자식으로 들어갈 때 baseline 공백 제거
            lineHeight: 0,
          }}
        >
          <QRCodeSVG
            value={props.shareUrl}
            size={140}
            level="M"
            includeMargin={true}
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* FOOTER */}
      <p className="text-center text-xs text-gray-400 mt-6">
        🐶 파인드마이펫 · findmypet.platformholder.site
      </p>
    </div>
  );
};

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

/** 인쇄용 강조 박스 — 라벨 + 값. */
const InfoBox = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div
    className="px-4 py-3"
    style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "6px" }}
  >
    <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
    <p className="text-base font-semibold leading-tight">{children}</p>
  </div>
);

/** 010XXXXXXXX → 010-XXXX-XXXX */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
}
