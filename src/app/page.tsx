"use client";

import { Button } from "@/app/_components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
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

export default function Home() {
  const [activeTabValue, setActiveTabValue] = useState<"lost" | "abandonment">("lost");
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
      <div className="relative flex xs:flex-row flex-col-reverse gap-3 w-full justify-center items-center">
        <Tabs defaultValue={activeTabValue} className="flex justify-center">
          <TabsList>
            <TabsTrigger value="lost" onClick={() => setActiveTabValue("lost")} className="xs:text-base text-sm">
              실종 동물
            </TabsTrigger>
            <TabsTrigger value="abandonment" onClick={() => setActiveTabValue("abandonment")} className="xs:text-base text-sm">
              유기 동물
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {activeTabValue === "lost" && (
          <Button size="default" className="xs:absolute xs:right-0 xs:text-base text-sm" onClick={() => handleRegisterClick()}>실종 동물 등록</Button>
        )}
      </div>
      {activeTabValue === "abandonment" ? <AbandonmentList /> : <LostList/>}
    </div>
  );
}
