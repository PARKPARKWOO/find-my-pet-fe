"use client";

import { useEffect, useState } from "react";
import { Copy, Link as LinkIcon, Share2 } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { useToast } from "@/hooks/use-toast";

/**
 * 상세 페이지 공유 버튼 세트.
 * - 카카오톡: Kakao JS SDK 공유 (지도와 동일한 NEXT_PUBLIC_KAKAO_JS_API_KEY 사용)
 * - 공유하기: Web Share API — 모바일 시스템 공유 시트 (당근·인스타 등 설치 앱 전부)
 * - 링크 복사
 * - 당근 문구 복사: 당근은 공유 API 가 없어 동네생활 붙여넣기용 본문을 복사해준다 (daangnText 전달 시 노출)
 */
interface ShareButtonsProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string | null;
  daangnText?: string;
}

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js";

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (settings: Record<string, unknown>) => void;
      };
    };
  }
}

let kakaoLoading: Promise<void> | null = null;

function loadKakaoSdk(): Promise<void> {
  if (window.Kakao) return Promise.resolve();
  if (kakaoLoading) return kakaoLoading;
  kakaoLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      kakaoLoading = null;
      reject(new Error("kakao sdk load failed"));
    };
    document.head.appendChild(script);
  });
  return kakaoLoading;
}

export default function ShareButtons({
  title,
  description,
  url,
  imageUrl,
  daangnText,
}: ShareButtonsProps) {
  const { toast } = useToast();
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  async function copy(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ description: successMessage });
    } catch {
      toast({ description: "복사에 실패했어요. 주소창의 링크를 직접 복사해주세요." });
    }
  }

  async function shareKakao() {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_API_KEY;
    if (!appKey) {
      copy(url, "링크를 복사했어요.");
      return;
    }
    try {
      await loadKakaoSdk();
      const kakao = window.Kakao!;
      if (!kakao.isInitialized()) kakao.init(appKey);
      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description: description.slice(0, 100),
          imageUrl: imageUrl || "https://findmypet.platformholder.site/og.jpg",
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          { title: "자세히 보기", link: { mobileWebUrl: url, webUrl: url } },
        ],
      });
    } catch {
      // SDK 로드/도메인 미등록 등 실패 시 링크 복사로 우아하게 후퇴
      copy(url, "카카오톡 공유가 불가해 링크를 복사했어요.");
    }
  }

  async function shareNative() {
    try {
      await navigator.share({ title, text: `${title}\n${description.slice(0, 80)}`, url });
    } catch {
      // 사용자가 시트를 닫은 경우 — 아무것도 안 함
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={shareKakao}
        className="flex items-center gap-1.5"
        aria-label="카카오톡으로 공유"
      >
        {/* 카카오 말풍선 심볼 */}
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
          <path
            fill="currentColor"
            d="M12 3C6.9 3 2.8 6.2 2.8 10.1c0 2.5 1.7 4.7 4.2 6l-.9 3.4c-.1.3.3.6.6.4l4-2.7c.4 0 .9.1 1.3.1 5.1 0 9.2-3.2 9.2-7.1S17.1 3 12 3z"
          />
        </svg>
        카카오톡
      </Button>
      {canNativeShare && (
        <Button
          variant="outline"
          size="sm"
          onClick={shareNative}
          className="flex items-center gap-1.5"
          aria-label="다른 앱으로 공유 (당근, 문자 등)"
        >
          <Share2 size={15} />
          공유
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => copy(url, "링크를 복사했어요.")}
        className="flex items-center gap-1.5"
      >
        <LinkIcon size={15} />
        링크 복사
      </Button>
      {daangnText && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            copy(
              daangnText,
              "당근 동네생활용 문구를 복사했어요. 당근 앱 > 동네생활에 붙여넣어 주세요.",
            )
          }
          className="flex items-center gap-1.5"
        >
          <Copy size={15} />
          당근용 문구
        </Button>
      )}
    </div>
  );
}
