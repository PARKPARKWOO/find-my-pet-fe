"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, PawPrint } from "lucide-react";
import { type FocusEvent, useEffect, useRef, useState } from "react";

import { formatMarqueeDate, type MarqueeItem } from "@/lib/homeFeed";

const STATUS_LABEL: Record<MarqueeItem["kind"], string> = {
  SEARCHING: "찾는 중",
  SEEN: "목격",
  PROTECTED: "보호 중",
};

const STATUS_CHIP_CLASS: Record<MarqueeItem["kind"], string> = {
  SEARCHING: "bg-state-searching/10 text-state-searching",
  SEEN: "bg-state-sighting/10 text-state-sighting",
  PROTECTED: "bg-forest/10 text-forest",
};

interface RailDimensions {
  sequenceWidth: number;
  viewportWidth: number;
  firstCardWidth: number;
}

interface OwnedTween {
  kill: () => void;
  pause: () => void;
  play: () => void;
}

export interface MarqueeRailProps {
  items: readonly MarqueeItem[];
}

export function MarqueeRail({ items }: MarqueeRailProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const originalSequenceRef = useRef<HTMLUListElement>(null);
  const firstCardRef = useRef<HTMLLIElement>(null);
  const tweenRef = useRef<OwnedTween | null>(null);
  const generationRef = useRef(0);
  const cleanupTweenRef = useRef<() => void>(() => undefined);
  const playbackRef = useRef<(isPaused: boolean) => void>(() => undefined);
  const [dimensions, setDimensions] = useState<RailDimensions | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [canLoop, setCanLoop] = useState(false);
  const [measurementReady, setMeasurementReady] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [pointerDown, setPointerDown] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const paused = hovered || focusWithin || pointerDown || userPaused;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const original = originalSequenceRef.current;
    const firstCard = firstCardRef.current;
    if (!viewport || !original || !firstCard) return;

    const measure = () => {
      const sequenceWidth = Math.round(original.scrollWidth);
      const viewportWidth = Math.round(viewport.clientWidth);
      const firstCardWidth = Math.round(firstCard.getBoundingClientRect().width);
      const next = { sequenceWidth, viewportWidth, firstCardWidth };

      setDimensions((previous) => {
        if (
          previous?.sequenceWidth === next.sequenceWidth &&
          previous.viewportWidth === next.viewportWidth &&
          previous.firstCardWidth === next.firstCardWidth
        ) {
          return previous;
        }
        return next;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(original);
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (
      !dimensions ||
      reducedMotion === null ||
      dimensions.firstCardWidth <= 0
    ) {
      setCanLoop(false);
      return;
    }
    const { sequenceWidth, viewportWidth, firstCardWidth } = dimensions;
    setCanLoop(
      !reducedMotion && sequenceWidth - viewportWidth >= firstCardWidth,
    );
    setMeasurementReady(true);
  }, [dimensions, reducedMotion]);

  useEffect(() => {
    const track = trackRef.current;
    cleanupTweenRef.current();
    cleanupTweenRef.current = () => undefined;
    playbackRef.current = () => undefined;
    tweenRef.current = null;

    const generation = ++generationRef.current;
    let cancelled = false;

    if (!track || !canLoop || !dimensions || dimensions.sequenceWidth <= 0) {
      track?.style.removeProperty("transform");
      track?.style.removeProperty("will-change");
      return () => {
        cancelled = true;
        generationRef.current += 1;
      };
    }

    void (async () => {
      const { gsap } = await import("gsap");
      if (cancelled || generation !== generationRef.current || !track.isConnected) return;

      gsap.set(track, { clearProps: "transform,willChange" });
      const duration = dimensions.sequenceWidth / 40;
      const tween = gsap.to(track, {
        xPercent: -50,
        duration,
        ease: "none",
        repeat: -1,
      });
      tweenRef.current = tween;

      const setPlayback = (isPaused: boolean) => {
        if (isPaused) {
          tweenRef.current?.pause();
          gsap.set(track, { clearProps: "willChange" });
          return;
        }
        gsap.set(track, { willChange: "transform" });
        tweenRef.current?.play();
      };
      playbackRef.current = setPlayback;
      setPlayback(pausedRef.current);

      const cleanupTween = () => {
        tweenRef.current?.kill();
        tweenRef.current = null;
        playbackRef.current = () => undefined;
        gsap.set(track, { clearProps: "transform,willChange" });
      };
      cleanupTweenRef.current = cleanupTween;
    })();

    return () => {
      cancelled = true;
      generationRef.current += 1;
      cleanupTweenRef.current();
      cleanupTweenRef.current = () => undefined;
    };
  }, [canLoop, dimensions]);

  useEffect(() => {
    playbackRef.current(paused);
  }, [paused]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const { currentTarget } = event;
    if (currentTarget.contains(event.relatedTarget as Node | null)) return;
    setFocusWithin(false);
  };

  // 포인터 캡처를 걸면 click 이 카드(Link)가 아니라 캡처한 컨테이너로 리타게팅되어
  // 상세 페이지 이동이 막힌다 — 뷰포트 밖에서 떼는 경우는 window 리스너로 해제한다.
  useEffect(() => {
    if (!pointerDown) return;

    const end = () => setPointerDown(false);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [pointerDown]);

  const renderItems = (duplicate: boolean) =>
    items.map((item, index) => {
      const formattedDate = formatMarqueeDate(item.occurredAt, item.dateFormat);
      const dateTime =
        formattedDate && item.occurredAt
          ? item.dateFormat === "yyyymmdd"
            ? `${item.occurredAt.slice(0, 4)}-${item.occurredAt.slice(4, 6)}-${item.occurredAt.slice(6, 8)}`
            : item.occurredAt.slice(0, 10)
          : null;

      return (
        <li
          key={duplicate ? `${item.key}-duplicate` : item.key}
          ref={!duplicate && index === 0 ? firstCardRef : undefined}
          className="w-80 shrink-0 snap-start"
        >
          <Link
            href={item.href}
            tabIndex={duplicate ? -1 : undefined}
            className="group flex h-full min-h-28 items-stretch gap-4 rounded-2xl border border-border bg-surface-raised p-4 shadow-raised transition-all duration-200 hover:-translate-y-0.5 hover:border-clay/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
          >
            <div className="relative size-20 shrink-0 self-center overflow-hidden rounded-xl bg-surface-canvas">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-content-muted/60">
                  <PawPrint aria-hidden className="size-7" />
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CHIP_CLASS[item.kind]}`}
                >
                  {STATUS_LABEL[item.kind]}
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="size-4 shrink-0 text-content-muted/50 transition-colors group-hover:text-accent-readable"
                />
              </div>
              <strong className="mt-2 line-clamp-1 text-base font-semibold text-content-primary">
                {item.title}
              </strong>
              {item.place ? (
                <span className="mt-1 line-clamp-1 text-sm text-content-secondary">{item.place}</span>
              ) : null}
              {dateTime && formattedDate ? (
                <time dateTime={dateTime} className="mt-auto pt-2 text-xs text-content-muted">
                  {formattedDate}
                </time>
              ) : null}
            </div>
          </Link>
        </li>
      );
    });

  return (
    <div className="mt-6">
      <div
        ref={viewportRef}
        data-native-scroll
        data-lenis-prevent
        data-marquee-viewport
        data-marquee-ready={measurementReady ? "true" : undefined}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setFocusWithin(true)}
        onBlurCapture={handleBlur}
        onPointerDown={() => setPointerDown(true)}
        className={canLoop ? "overflow-hidden" : "overflow-x-auto pb-3"}
      >
        <div ref={trackRef} data-marquee-track className="flex w-max gap-0">
          <ul
            ref={originalSequenceRef}
            data-marquee-sequence="original"
            className="w-max flex-none gap-4 pr-4 flex"
          >
            {renderItems(false)}
          </ul>
          {canLoop ? (
            <ul
              aria-hidden="true"
              data-marquee-sequence="duplicate"
              className="w-max flex-none gap-4 pr-4 flex"
            >
              {renderItems(true)}
            </ul>
          ) : null}
        </div>
      </div>
      {canLoop ? (
        <button
          type="button"
          aria-pressed={userPaused}
          className="mt-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface-raised px-4 text-sm font-semibold text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary"
          onClick={() => setUserPaused((value) => !value)}
        >
          {userPaused ? "소식 자동 이동 다시 재생" : "소식 자동 이동 멈추기"}
        </button>
      ) : null}
    </div>
  );
}
