"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FlyerPrintDialog from "@/app/_components/lost/FlyerPrintDialog";

/**
 * 게시글 없이 전단지만 만드는 화면.
 *
 * 왜 따로 두는가: 실종 직후 가장 급한 일은 동네에 전단지를 붙이는 것인데, 기존에는 회원가입 →
 * 로그인 → 게시글 등록을 마쳐야 전단지 인쇄 화면에 닿을 수 있었다. 그 사이 시간이 가장 아깝다.
 * 이 화면은 로그인도, 게시글도, 서버 저장도 요구하지 않는다 — 입력한 내용은 브라우저 안에서만
 * 쓰이고 인쇄/PDF 로 나간다.
 *
 * 게시글이 있는 경우의 전단지(실종 상세 → 전단지 만들기)는 QR 이 상세 페이지로 가서 사진과
 * 목격 제보를 더 보여줄 수 있으므로 그쪽이 여전히 낫다. 이 화면은 그 전 단계를 메운다.
 *
 * 사진은 서버에 올리지 않고 `URL.createObjectURL` 로 미리보기만 만든다. 저장이 목적이 아니라
 * 인쇄가 목적이고, 업로드를 넣는 순간 로그인과 용량 제한이 다시 따라붙는다.
 */
export default function FlyerStandaloneClient() {
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [time, setTime] = useState("");
  const [phoneNum, setPhoneNum] = useState("");
  const [gratuity, setGratuity] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined);

  const ready = title.trim().length > 0 && phoneNum.trim().length > 0;

  function onPickPhoto(file: File | undefined) {
    if (!file) return;
    if (thumbnail) URL.revokeObjectURL(thumbnail);
    setThumbnail(URL.createObjectURL(file));
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">전단지 만들기</h1>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
        게시글을 올리지 않아도 바로 만들 수 있어요. 입력한 내용은 저장되지 않고 인쇄에만 쓰여요.
        <br />
        전단지의 QR 은 제보 오픈채팅으로 연결됩니다.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="flyer-title">
            제목 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="flyer-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 갈색 푸들 몽이를 찾습니다"
          />
        </div>

        <div>
          <Label htmlFor="flyer-phone">
            연락처 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="flyer-phone"
            value={phoneNum}
            onChange={(e) => setPhoneNum(e.target.value)}
            placeholder="010-0000-0000"
            inputMode="tel"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="flyer-place">실종 장소</Label>
            <Input
              id="flyer-place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="서울 강남구 역삼동"
            />
          </div>
          <div>
            <Label htmlFor="flyer-time">실종 시각</Label>
            <Input
              id="flyer-time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="2026년 7월 26일 오후 3시쯤"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="flyer-gratuity">사례금 (원)</Label>
          <Input
            id="flyer-gratuity"
            value={gratuity}
            onChange={(e) => setGratuity(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="없으면 비워 두세요"
            inputMode="numeric"
          />
        </div>

        <div>
          <Label htmlFor="flyer-desc">특징 · 상세 설명</Label>
          <Textarea
            id="flyer-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="겁이 많아 부르면 숨어요. 목에 파란 목줄을 하고 있어요."
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="flyer-photo">사진</Label>
          <Input
            id="flyer-photo"
            type="file"
            accept="image/*"
            onChange={(e) => onPickPhoto(e.target.files?.[0])}
          />
          {thumbnail && (
            <div className="mt-2">
              <Image
                src={thumbnail}
                alt="전단지에 들어갈 사진 미리보기"
                width={128}
                height={128}
                unoptimized
                className="h-32 w-32 rounded object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <FlyerPrintDialog
          title={title.trim()}
          description={description.trim()}
          phoneNum={phoneNum.trim()}
          place={place.trim()}
          time={time.trim()}
          thumbnail={thumbnail}
          gratuity={Number(gratuity) || 0}
          missingAnimalStatus="SEARCHING"
        >
          <Button className="w-full" disabled={!ready}>
            전단지 미리보기 · 인쇄
          </Button>
        </FlyerPrintDialog>
        {!ready && (
          <p className="mt-2 text-xs text-gray-500">제목과 연락처를 입력하면 만들 수 있어요.</p>
        )}
      </div>
    </div>
  );
}
