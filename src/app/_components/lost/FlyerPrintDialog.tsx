"use client";

import { useRef } from "react";
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

  return (
    <Dialog>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>📱 전단지 QR 만들기</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 mb-2">
          A4 한 장 전단지로 출력됩니다. QR 은 스마트폰 카메라로 스캔하면 바로 이 실종 게시글로 연결됩니다.
        </p>

        <div className="border rounded overflow-auto">
          <div ref={printRef}>
            <FlyerSheet {...props} shareUrl={shareUrl} />
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

/** 실제 인쇄 대상 레이아웃 — A4 기준, 멀리서도 눈에 띄도록 강한 대비. */
const FlyerSheet = (props: Props & { shareUrl: string }) => {
  const isSeen = props.missingAnimalStatus === "SEEN";
  const headline = isSeen ? "이 아이를 본 적 있나요?" : "가족을 찾습니다";
  const subHeadline = isSeen ? "목격 정보를 알려 주세요" : "도움이 절실합니다";
  const showReward = props.gratuity > 0;
  const rewardLabel = showReward
    ? parseGratuityValue(props.gratuity, props.missingAnimalStatus)
    : null;

  return (
    <div
      className="bg-white text-black mx-auto relative"
      style={{
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        padding: "16mm",
        border: "8px double #B91C1C",
      }}
    >
      {/* HEADER — 강한 빨간 배너 */}
      <div className="text-center mb-6">
        <div
          className="inline-block px-6 py-2 mb-3"
          style={{ backgroundColor: "#B91C1C", color: "#fff", letterSpacing: "0.15em" }}
        >
          <span className="text-sm font-bold">URGENT · LOST PET</span>
        </div>
        <h1
          className="text-5xl font-extrabold mb-2"
          style={{ color: "#B91C1C", lineHeight: 1.1 }}
        >
          🐾 {headline}
        </h1>
        <p className="text-lg text-gray-700">{subHeadline}</p>
      </div>

      {/* TITLE */}
      <h2 className="text-3xl font-bold text-center mb-6 border-y-2 border-gray-900 py-3">
        {props.title}
      </h2>

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
                border: "4px solid #111827",
                borderRadius: "4px",
              }}
            />
          ) : (
            <div
              className="flex items-center justify-center text-gray-400"
              style={{ width: "260px", height: "260px", border: "4px solid #111827", borderRadius: "4px" }}
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
              backgroundColor: "#FEF3C7",
              border: "3px solid #B45309",
              borderRadius: "8px",
            }}
          >
            <span className="text-sm font-semibold" style={{ color: "#92400E" }}>
              사례금
            </span>
            <span
              className="text-3xl font-extrabold mt-1 text-center"
              style={{ color: "#B45309", lineHeight: 1.1 }}
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

      {/* PHONE — 멀리서도 보이게 큼지막하게 */}
      <div
        className="text-center py-4 mb-6"
        style={{ backgroundColor: "#111827", color: "#fff", borderRadius: "8px" }}
      >
        <p className="text-sm tracking-widest mb-1">📞 연락처</p>
        <p className="text-4xl font-extrabold tracking-wide">{formatPhone(props.phoneNum)}</p>
      </div>

      {/* DESCRIPTION */}
      {props.description?.trim() && (
        <div className="mb-6">
          <p
            className="text-xs font-bold mb-2"
            style={{ color: "#B91C1C", letterSpacing: "0.15em" }}
          >
            특징 · 메모
          </p>
          <p
            className="text-base whitespace-pre-wrap leading-relaxed pl-3"
            style={{ borderLeft: "3px solid #B91C1C" }}
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
            padding: "8px",
            backgroundColor: "#fff",
            border: "2px solid #111827",
            borderRadius: "4px",
          }}
        >
          <QRCodeSVG value={props.shareUrl} size={140} includeMargin={false} />
        </div>
      </div>

      {/* FOOTER */}
      <p className="text-center text-xs text-gray-400 mt-6">
        🐶 파인드마이펫 · findmypet.platformholder.site
      </p>
    </div>
  );
};

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
