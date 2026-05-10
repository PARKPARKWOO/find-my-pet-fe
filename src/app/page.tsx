"use client";

import { Button } from "@/app/_components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";
import image from "../static/image/banner.jpg";
import { ChevronRight } from "lucide-react";
import AbandonmentList from "./_components/main/AbandonmentList";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import LostList from "./_components/main/LostList";
import SearchBar from "./_components/layout/SearchBar";
import LocalStorage from "@/lib/localStorage";
import useIsLoginStore from "@/store/loginStore";
import {
  COOKIE_ACCESS_TOKEN,
  COOKIE_REFRESH_TOKEN,
  getCookie,
  migrateLegacyLocalStorageTokens,
  removeCookie,
} from "@/lib/cookieUtils";

type FeedView = "all" | "lost" | "abandonment";

export default function Home() {
  // 통합 피드 — 두 리스트를 chip으로 분리/통합 표시. default는 전체 노출이라 컨텐츠 풍성.
  const [view, setView] = useState<FeedView>("all");
  const router = useRouter();
  const {toast} = useToast()
  const setLogout = useIsLoginStore((state) => state.setLogout)
  const isLogin = useIsLoginStore((state) => state.isLogin)
  const handleRegisterClick = () => {
    if(isLogin){
      router.push('/register')
    }else{
      toast({
        title: "실종 동물 등록",
        description: "로그인이 필요합니다.",
      })
    }
  }

  useEffect(() => {
    // Cookie 전환 이전 LocalStorage 토큰을 1회성 이관
    migrateLegacyLocalStorageTokens()

    if(!getCookie(COOKIE_REFRESH_TOKEN)){
      setLogout()
      removeCookie(COOKIE_ACCESS_TOKEN)
      removeCookie(COOKIE_REFRESH_TOKEN)
      LocalStorage.removeItem('email')
      LocalStorage.removeItem('name')
      LocalStorage.removeItem('role')
      toast({
        title: "로그인이 만료되었습니다.",
        description: "로그인이 필요합니다.",
      })
    }
  }, [])

  const chipClass = (key: FeedView) =>
    `px-4 py-2 text-sm rounded-full transition-colors ${
      view === key
        ? "bg-blue-500 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  const showLost = view === "all" || view === "lost";
  const showAbandonment = view === "all" || view === "abandonment";

  return (
    <div className="flex flex-col  w-full items-center gap-6">
      <div className="w-full flex justify-center px-4">
        <div className="w-full max-w-2xl">
          <SearchBar variant="hero" />
        </div>
      </div>
      <div className="w-full flex justify-center">
        <div className="sm:w-[60%] w-[90%] h-[250px] rounded-md border flex">
          <div className="flex justify-center items-center relative w-full h-full ">
            <Image src={image} layout="fill" objectFit="contain" alt="banner image" placeholder="blur" />
          </div>
          <div className="w-full h-full md:p-6 p-3 flex flex-col justify-center items-end md:gap-6 gap-3 break-keep">
            <p className="font-bold md:text-xl lg:text-2xl text-sm">
              반려견 실종 시
              <br />
              소중한 골든타임에 필요한
              <br />
              가이드를 제공합니다.
            </p>
            <div className="w-full flex justify-end">
              <Button variant="outline" onClick={() => router.push('/guide')}>
                가이드
                <ChevronRight size="18" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="relative flex xs:flex-row flex-col-reverse gap-3 w-full justify-center items-center px-4">
        <div className="flex gap-2 flex-wrap justify-center">
          <button className={chipClass("all")} onClick={() => setView("all")}>
            전체
          </button>
          <button className={chipClass("lost")} onClick={() => setView("lost")}>
            집을 잃었어요
          </button>
          <button className={chipClass("abandonment")} onClick={() => setView("abandonment")}>
            가족을 기다려요
          </button>
        </div>
        {showLost && (
          <Button size="default" className="xs:absolute xs:right-4 xs:text-base text-sm" onClick={() => handleRegisterClick()}>실종 동물 등록</Button>
        )}
      </div>
      {showLost && (
        <section className="w-full">
          {view === "all" && (
            <h2 className="text-base font-semibold text-gray-700 mb-3 px-1">집을 잃었어요</h2>
          )}
          <LostList />
        </section>
      )}
      {showAbandonment && (
        <section className="w-full">
          {view === "all" && (
            <h2 className="text-base font-semibold text-gray-700 mb-3 px-1 mt-2">가족을 기다려요</h2>
          )}
          <AbandonmentList />
        </section>
      )}
    </div>
  );
}
