"use client";

import { useEffect, useRef } from "react";

interface RuntimeContext {
  revert: () => void;
}

interface RuntimeTrigger {
  kill: () => void;
}

export function HomeMotionRuntime() {
  const generationRef = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let activeCleanup: () => void = () => undefined;

    const stopActiveRuntime = () => {
      generationRef.current += 1;
      activeCleanup();
      activeCleanup = () => undefined;
    };

    const initialize = async () => {
      const root = document.querySelector<HTMLElement>("[data-home-motion-root]");
      if (!root || mediaQuery.matches || disposed) return;

      const generation = ++generationRef.current;
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed || mediaQuery.matches || generation !== generationRef.current) return;

      let context: RuntimeContext | null = null;
      const ownedTriggers: RuntimeTrigger[] = [];

      try {
        gsap.registerPlugin(ScrollTrigger);
        const lenis = new Lenis({
          autoRaf: false,
          anchors: true,
          prevent: (node) =>
            node instanceof HTMLElement && node.closest("[data-native-scroll]") !== null,
        });
        const onLenisScroll = () => ScrollTrigger.update();
        const update = (time: number) => lenis.raf(time * 1000);
        let cleaned = false;

        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;
          gsap.ticker.remove(update);
          lenis.off("scroll", onLenisScroll);
          if (context) context.revert();
          for (const trigger of ownedTriggers) trigger.kill();
          document.documentElement.removeAttribute("data-home-motion");
          lenis.destroy();
          context = null;
          ownedTriggers.length = 0;
        };

        try {
          lenis.on("scroll", onLenisScroll);
          gsap.ticker.add(update);
          context = gsap.context(() => {
            const targets = gsap.utils.toArray<HTMLElement>("[data-home-motion]", root);
            targets.forEach((target, index) => {
              const tween = gsap.fromTo(
                target,
                { y: index === 0 ? 12 : 16, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.55,
                  ease: "power2.out",
                  scrollTrigger: {
                    trigger: target,
                    start: "top 90%",
                    once: true,
                  },
                },
              );
              if (tween.scrollTrigger) ownedTriggers.push(tween.scrollTrigger);
            });
          }, root);
          document.documentElement.setAttribute("data-home-motion", "active");

          if (disposed || mediaQuery.matches || generation !== generationRef.current) {
            cleanup();
            return;
          }
          activeCleanup = cleanup;
        } catch {
          cleanup();
        }
      } catch {
        document.documentElement.removeAttribute("data-home-motion");
      }
    };

    const handleMotionPreference = () => {
      stopActiveRuntime();
      if (!mediaQuery.matches) void initialize();
    };

    mediaQuery.addEventListener("change", handleMotionPreference);
    if (!mediaQuery.matches) void initialize();

    return () => {
      disposed = true;
      mediaQuery.removeEventListener("change", handleMotionPreference);
      stopActiveRuntime();
    };
  }, []);

  return null;
}
