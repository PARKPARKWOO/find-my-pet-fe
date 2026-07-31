"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KakaoLoginDialog } from "../KakaoLoginDialog";
import { Button } from "../ui/button";
import NotificationBell from "@/app/_components/notification/NotificationBell";
import { requestLogout } from "@/lib/auth";
import { SITE_NAVIGATION } from "@/lib/siteNavigation";
import useIsLoginStore from "@/store/loginStore";

const MOBILE_NAVIGATION = [
  ...SITE_NAVIGATION,
  { label: "상황별 반려동물 안내", href: "/faq" },
] as const;

export default function Navigation() {
  const router = useRouter();
  const isLogin = useIsLoginStore((state) => state.isLogin);
  const setLogout = useIsLoginStore((state) => state.setLogout);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = async () => {
    // HttpOnly 쿠키는 JS 로 못 지운다 → revoke API 로 서버가 쿠키/Redis 정리.
    await requestLogout();
    setLogout();
    router.push("/");
  };

  const registerCta = (className?: string) => {
    const linkClassName = `inline-flex h-9 items-center justify-center rounded-md bg-forest px-3 text-sm font-medium text-white transition-colors hover:bg-forest/90 ${className ?? ""}`;
    const button = (
      <Button
        className={`bg-forest text-white hover:bg-forest/90 ${className ?? ""}`}
        onClick={closeMenu}
      >
        소식 등록
      </Button>
    );

    if (!isLogin) return <KakaoLoginDialog>{button}</KakaoLoginDialog>;

    return (
      <Link href="/register" onClick={closeMenu} className={linkClassName}>
        소식 등록
      </Link>
    );
  };

  return (
    <header className="relative z-40 w-full border-b border-ink/10 bg-surface-raised text-ink">
      <nav aria-label="주 탐색" className="mx-auto flex h-16 w-full max-w-page items-center justify-between px-4 md:px-6">
        <Link href="/" className="shrink-0 text-base font-bold tracking-tight text-ink">
          Find My Pet
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {SITE_NAVIGATION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink/80 transition-colors hover:text-forest"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">{registerCta()}</div>
          {isLogin ? (
            <>
              <NotificationBell />
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="rounded-full" aria-label="내 계정 메뉴">
                    <Avatar className="border border-ink/15">
                      <AvatarImage src="../../favicon.ico" alt="내 프로필" />
                      <AvatarFallback>-</AvatarFallback>
                    </Avatar>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-36 p-2">
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/profile"
                      className="rounded-md border border-input px-3 py-2 text-sm font-bold hover:bg-accent"
                    >
                      마이페이지
                    </Link>
                    <Button variant="outline" className="justify-start font-bold" onClick={handleLogout}>
                      로그아웃
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <KakaoLoginDialog>
              <Button variant="outline">로그인</Button>
            </KakaoLoginDialog>
          )}
          <button
            type="button"
            className="flex h-11 min-w-11 items-center justify-center rounded-md px-3 text-sm font-medium text-ink hover:bg-surface-paper md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            메뉴
          </button>
        </div>
      </nav>

      <nav
        id="mobile-navigation"
        hidden={!isMenuOpen}
        aria-label="모바일 탐색"
        className="absolute inset-x-0 border-b border-ink/10 bg-surface-raised shadow-raised md:hidden"
      >
        <div className="mx-auto flex max-w-page flex-col gap-1 px-4 py-4">
          {MOBILE_NAVIGATION.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="rounded-md px-3 py-3 text-sm font-medium text-ink/80 hover:bg-surface-paper hover:text-forest"
            >
              {item.label}
            </Link>
          ))}
          <div className="px-3 pt-2">{registerCta("w-full")}</div>
        </div>
      </nav>
    </header>
  );
}
