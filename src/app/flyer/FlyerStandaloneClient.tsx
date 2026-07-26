"use client";

import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FlyerPrintDialog, {
  DEFAULT_COMPOSITION,
  FlyerSheet,
  TEMPLATES,
  getDefaultFlyerCopy,
  getFlyerShareUrl,
  type FlyerSheetProps,
} from "@/app/_components/lost/FlyerPrintDialog";
import { cn } from "@/lib/utils";

const COMPACT_SHADOW =
  "shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]";
const PANEL_SHADOW =
  "shadow-[0px_0px_0px_1px_rgba(0,0,0,0.06),0px_1px_1px_-0.5px_rgba(0,0,0,0.06),0px_3px_3px_-1.5px_rgba(0,0,0,0.06),_0px_6px_6px_-3px_rgba(0,0,0,0.06),0px_12px_12px_-6px_rgba(0,0,0,0.06),0px_24px_24px_-12px_rgba(0,0,0,0.06)]";

/** A4(210mm) 를 96dpi css px 로 환산한 값 — 미리보기 scale 계산 기준. */
const A4_WIDTH_PX = 793.7;

/** 실종 직후 "가장 급한" 이 화면에서 새로고침 한 번에 입력이 날아가지 않도록 초안을 저장한다.
 * 사진(object URL)은 여기 포함하지 않는다 — 새로고침을 못 버티는 값을 저장해 봐야
 * 복원 시 깨진 이미지만 남기 때문에, 아예 이 목록에 넣지 않는 편이 "빈 드롭존으로 복원"을
 * 보장하는 가장 단순한 방법이다. */
const FLYER_DRAFT_STORAGE_KEY = "fmp:flyer:draft:v1";

interface FlyerDraft {
  title: string;
  place: string;
  time: string;
  phoneNum: string;
  gratuity: string;
  description: string;
}

/**
 * 게시글 없이 전단지만 만드는 화면.
 *
 * 왜 따로 두는가: 실종 직후 가장 급한 일은 동네에 전단지를 붙이는 것인데, 기존에는 회원가입 →
 * 로그인 → 게시글 등록을 마쳐야 전단지 인쇄 화면에 닿을 수 있었다. 그 사이 시간이 가장 아깝다.
 * 이 화면은 로그인도, 게시글도, 서버 저장도 요구하지 않는다 — 입력한 내용은 브라우저 안에서만
 * 쓰이고 인쇄/PDF 로 나간다.
 *
 * 이 페이지의 주인공은 인쇄물이지 화면 UI 가 아니다. 그래서 타이핑하는 대로 바로 갱신되는
 * 실제 인쇄 시트(FlyerSheet) 미리보기를 항상 보여주고, 데스크톱에서는 폼 왼쪽 · 미리보기
 * 오른쪽(스티키) 두 칸으로, 모바일에서는 한 칸으로 쌓이며 미리보기가 인쇄 버튼 바로 위에 온다.
 *
 * 미리보기는 다이얼로그(FlyerPrintDialog) 안의 인쇄 대상과 같은 FlyerSheet 컴포넌트를 그대로
 * 쓴다 — 따로 닮은꼴 레이아웃을 만들면 미리보기와 실제 인쇄물이 어긋날 수 있기 때문이다.
 * 템플릿 선택과 배너/헤드라인 문구 편집은 인쇄 버튼을 누른 뒤 다이얼로그에서 계속 할 수 있다.
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
  const [photoError, setPhotoError] = useState<string | null>(null);

  // 컴포넌트가 사라질 때 마지막으로 만든 object URL 을 반드시 해제한다(교체 시점의 해제는
  // onPickPhoto/onRemovePhoto 가 그때그때 처리하므로, 여기서는 "마지막 한 개"만 신경 쓰면 된다).
  const thumbnailRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    thumbnailRef.current = thumbnail;
  }, [thumbnail]);
  useEffect(() => {
    return () => {
      if (thumbnailRef.current) URL.revokeObjectURL(thumbnailRef.current);
    };
  }, []);

  // 마운트 시 초안 복원, 이후 변경될 때마다 저장. thumbnail 은 절대 다루지 않는다 — 그래서
  // 복원 시에도 항상 빈 드롭존으로 시작하고, 깨진 이미지가 나타날 여지 자체가 없다.
  const [draftRestored, setDraftRestored] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FLYER_DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<FlyerDraft>;
        if (typeof parsed.title === "string") setTitle(parsed.title);
        if (typeof parsed.place === "string") setPlace(parsed.place);
        if (typeof parsed.time === "string") setTime(parsed.time);
        if (typeof parsed.phoneNum === "string") setPhoneNum(parsed.phoneNum);
        if (typeof parsed.gratuity === "string") setGratuity(parsed.gratuity);
        if (typeof parsed.description === "string") setDescription(parsed.description);
      }
    } catch {
      // 손상된 값은 무시하고 빈 폼으로 시작한다.
    } finally {
      setDraftRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!draftRestored) return;
    const draft: FlyerDraft = { title, place, time, phoneNum, gratuity, description };
    try {
      localStorage.setItem(FLYER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // 저장 공간이 없거나 프라이빗 모드면 조용히 무시 — 화면의 입력 자체는 그대로 유지된다.
    }
  }, [draftRestored, title, place, time, phoneNum, gratuity, description]);

  const missingTitle = title.trim().length === 0;
  const missingPhone = phoneNum.trim().length === 0;
  const ready = !missingTitle && !missingPhone;
  const missingFieldsLabel = [missingTitle && "제목", missingPhone && "연락처"]
    .filter((v): v is string => Boolean(v))
    .join(" · ");

  function onPickPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      setPhotoError("이미지 파일만 올릴 수 있어요.");
      return;
    }
    setPhotoError(null);
    if (thumbnail) URL.revokeObjectURL(thumbnail);
    setThumbnail(URL.createObjectURL(file));
  }

  function onRemovePhoto() {
    if (thumbnail) URL.revokeObjectURL(thumbnail);
    setThumbnail(undefined);
    setPhotoError(null);
  }

  const gratuityNumber = Number(gratuity) || 0;
  const copy = getDefaultFlyerCopy("SEARCHING", title.trim(), description.trim());
  const sheetProps: FlyerSheetProps = {
    title: title.trim(),
    description: description.trim(),
    phoneNum: phoneNum.trim(),
    place: place.trim(),
    time: time.trim(),
    thumbnail,
    gratuity: gratuityNumber,
    missingAnimalStatus: "SEARCHING",
    shareUrl: getFlyerShareUrl(undefined),
    banner: copy.banner,
    headline: copy.headline,
    subHeadline: copy.subHeadline,
    theme: TEMPLATES.URGENT,
    // 이 화면의 미리보기는 실제 구성 편집기가 아니라 인쇄 다이얼로그로 넘어가기 전 "감"만
    // 잡는 용도라 항상 전체 켜짐 기본 구성을 쓴다 — 실제 구성 편집은 다이얼로그 안에서 한다.
    composition: DEFAULT_COMPOSITION,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">전단지 만들기</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        게시글을 올리지 않아도 바로 만들 수 있어요. 입력한 내용은 저장되지 않고 인쇄에만 쓰여요.
        오른쪽 미리보기가 실제 인쇄될 모습 그대로예요.
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
        {/* 폼 — 꼭 필요한 것 / 있으면 좋은 것 두 블록으로 나눠 무엇부터 채워야 하는지 분명하게 */}
        <div className="space-y-6">
          <FormSection
            title="꼭 필요한 것"
            description="사진, 제목, 연락처 — 이 세 가지만 있으면 전단지를 만들 수 있어요."
          >
            <PhotoDropzone
              photoUrl={thumbnail}
              error={photoError}
              onSelect={onPickPhoto}
              onRemove={onRemovePhoto}
            />

            <div>
              <Label htmlFor="flyer-title">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="flyer-title"
                className="mt-1.5 h-11"
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
                className="mt-1.5 h-11"
                value={phoneNum}
                onChange={(e) => setPhoneNum(e.target.value)}
                placeholder="010-0000-0000"
                inputMode="tel"
              />
            </div>
          </FormSection>

          <FormSection
            title="있으면 좋은 것"
            description="장소, 실종 시각, 사례금, 특징 — 없어도 만들 수 있고 나중에 채워도 돼요."
            optional
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="flyer-place">실종 장소</Label>
                <Input
                  id="flyer-place"
                  className="mt-1.5 h-11"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="서울 강남구 역삼동"
                />
              </div>
              <div>
                <Label htmlFor="flyer-time">실종 시각</Label>
                <Input
                  id="flyer-time"
                  className="mt-1.5 h-11"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="2026년 7월 26일 오후 3시쯤"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="flyer-gratuity">사례금 (만원 단위)</Label>
              <Input
                id="flyer-gratuity"
                className="mt-1.5 h-11"
                value={gratuity}
                onChange={(e) => setGratuity(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="없으면 비워 두세요 · 예) 50 = 50만원"
                inputMode="numeric"
              />
            </div>

            <div>
              <Label htmlFor="flyer-desc">특징 · 상세 설명</Label>
              <Textarea
                id="flyer-desc"
                className="mt-1.5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="겁이 많아 부르면 숨어요. 목에 파란 목줄을 하고 있어요."
                rows={4}
              />
            </div>
          </FormSection>
        </div>

        {/* 미리보기 — 데스크톱에서는 스티키로 오른쪽에 항상 보이고, 모바일에서는 폼 다음,
            인쇄 버튼 바로 위에 한 칸으로 쌓인다. */}
        <aside className="mt-8 lg:sticky lg:top-6 lg:mt-0">
          <FlyerPreviewPanel sheetProps={sheetProps} />

          <div className="mt-4">
            <FlyerPrintDialog
              title={title.trim()}
              description={description.trim()}
              phoneNum={phoneNum.trim()}
              place={place.trim()}
              time={time.trim()}
              thumbnail={thumbnail}
              gratuity={gratuityNumber}
              missingAnimalStatus="SEARCHING"
            >
              <Button className="h-12 w-full text-base font-semibold" disabled={!ready}>
                전단지 인쇄하기
              </Button>
            </FlyerPrintDialog>
            <p role="status" aria-live="polite" className="mt-2 text-center text-xs text-gray-500">
              {ready
                ? "인쇄 버튼을 누르면 템플릿을 고르고 바로 인쇄할 수 있어요."
                : `다음을 입력해야 인쇄할 수 있어요: ${missingFieldsLabel}`}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** 폼 그룹 — "꼭 필요한 것" / "있으면 좋은 것" 두 블록의 공통 카드 껍데기. */
function FormSection({
  title,
  description,
  optional,
  children,
}: {
  title: string;
  description: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-lg bg-white p-5", COMPACT_SHADOW)}>
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {optional && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
            선택
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-gray-500">{description}</p>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/**
 * 사진 드롭존 — 가장 중요한 입력이라 맨 위, 클릭·드래그앤드롭·키보드(Enter/Space) 모두 지원.
 * 사진이 있으면 미리보기 + 바꾸기/삭제 버튼으로 바뀐다.
 */
function PhotoDropzone({
  photoUrl,
  error,
  onSelect,
  onRemove,
}: {
  photoUrl: string | undefined;
  error: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onSelect(file);
  };

  return (
    <div>
      <Label id="flyer-photo-label" htmlFor="flyer-photo-input">
        사진 <span className="text-red-500">*</span>
      </Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "mt-1.5 flex min-h-[176px] w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          dragActive ? "border-ring bg-accent" : "border-input bg-background",
          !photoUrl && "cursor-pointer hover:bg-accent/50",
        )}
        // 사진이 없을 때만 이 박스 자체가 클릭/키보드 타깃이 되는 하나의 버튼이다.
        // 사진이 있을 때는 아래 실제 <button> 두 개(바꾸기/삭제)가 각각의 타깃이라
        // 바깥 div 까지 role="button" 으로 이중 처리하지 않는다(중첩 인터랙티브 요소 방지).
        {...(!photoUrl
          ? {
              role: "button" as const,
              tabIndex: 0,
              "aria-labelledby": "flyer-photo-label",
              onClick: openPicker,
              onKeyDown: handleKeyDown,
            }
          : {})}
      >
        {photoUrl ? (
          <div className="flex flex-col items-center gap-3">
            <Image
              src={photoUrl}
              alt="전단지에 들어갈 사진 미리보기"
              width={140}
              height={140}
              unoptimized
              className={cn("h-[140px] w-[140px] rounded-md object-cover", COMPACT_SHADOW)}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-11" onClick={openPicker}>
                사진 바꾸기
              </Button>
              <Button type="button" variant="outline" className="h-11" onClick={onRemove}>
                <X className="mr-1 h-4 w-4" aria-hidden />
                삭제
              </Button>
            </div>
          </div>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium text-gray-700">
              사진을 끌어다 놓거나 클릭해서 선택하세요
            </p>
            <p className="text-xs text-gray-500">멀리서도 알아볼 수 있는 사진일수록 좋아요</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        id="flyer-photo-input"
        type="file"
        accept="image/*"
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * 실시간 인쇄 미리보기 — 실제 인쇄 시트(FlyerSheet)를 CSS transform: scale() 로 축소해서 보여준다.
 * 별도 레이아웃을 새로 만들지 않기 때문에 미리보기와 인쇄물이 어긋날 수 없다.
 *
 * A4 원본 너비(210mm)는 컨테이너보다 항상 넓으므로, 실제 렌더된 컨테이너 너비를 측정해
 * scale 을 구한다 — 폼 컬럼 너비가 반응형으로 바뀌어도 미리보기가 항상 꽉 차게.
 */
function FlyerPreviewPanel({ sheetProps }: { sheetProps: FlyerSheetProps }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      if (width > 0) setScale(Math.min(width / A4_WIDTH_PX, 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className={cn("relative w-full overflow-hidden rounded-md bg-muted/40", PANEL_SHADOW)}
      style={{ aspectRatio: "210 / 297" }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: "210mm" }}>
        <FlyerSheet {...sheetProps} />
      </div>
    </div>
  );
}
