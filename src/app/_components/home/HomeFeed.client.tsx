"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import LostList from "@/app/_components/main/LostList";
import AbandonmentList from "@/app/_components/main/AbandonmentList";
import useIsLoginStore from "@/store/loginStore";
import { useToast } from "@/hooks/use-toast";
import type { AbandonedAnimalSummary, HomeListSeed, LostPetSummary } from "@/lib/homeFeed";

type FeedView = "all" | "lost" | "abandonment";

export interface HomeFeedProps {
  lostSeed?: HomeListSeed<LostPetSummary>;
  abandonmentSeed?: HomeListSeed<AbandonedAnimalSummary>;
}

export default function HomeFeed({ lostSeed, abandonmentSeed }: HomeFeedProps) {
  const [view, setView] = useState<FeedView>("all");
  const router = useRouter();
  const { toast } = useToast();
  const isLogin = useIsLoginStore((state) => state.isLogin);

  const handleRegisterClick = () => {
    if (isLogin) {
      router.push('/register');
    } else {
      toast({
        title: "실종 동물 등록",
        description: "로그인이 필요합니다.",
      });
    }
  };

  const chipClass = (key: FeedView) =>
    `px-4 py-2 text-sm rounded-full transition-colors ${
      view === key
        ? "bg-blue-500 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  const showLost = view === "all" || view === "lost";
  const showAbandonment = view === "all" || view === "abandonment";

  return (
    <div data-native-scroll className="flex flex-col w-full items-center gap-6">
      <div className="relative flex xs:flex-row flex-col-reverse gap-3 w-full justify-center items-center px-4">
        <div className="flex gap-2 flex-wrap justify-center">
          <button className={chipClass("all")} onClick={() => setView("all")}>
            전체
          </button>
          <button className={chipClass("lost")} onClick={() => setView("lost")}>
            집을 잃었어요
          </button>
          <button className={chipClass("abandonment")} onClick={() => setView("abandonment")}>
            보호소에서 가족을 기다려요
          </button>
        </div>
        {showLost && (
          <Button
            size="default"
            className="xs:absolute xs:right-4 xs:text-base text-sm"
            onClick={handleRegisterClick}
          >
            실종 동물 등록
          </Button>
        )}
      </div>
      {showLost && (
        <section className="w-full">
          {view === "all" && (
            <h2 className="text-base font-semibold text-gray-700 mb-3 px-1">집을 잃었어요</h2>
          )}
          <LostList initialPage={lostSeed} />
        </section>
      )}
      {showAbandonment && (
        <section className="w-full">
          {view === "all" && (
            <h2 className="text-base font-semibold text-gray-700 mb-3 px-1 mt-2">
              보호소에서 가족을 기다려요
            </h2>
          )}
          <Suspense fallback={<div className="h-[400px]" />}>
            <AbandonmentList initialPage={abandonmentSeed} />
          </Suspense>
        </section>
      )}
    </div>
  );
}
