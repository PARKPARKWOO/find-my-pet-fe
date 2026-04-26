"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import apiClient from "@/lib/api";
import useIsLoginStore from "@/store/loginStore";
import { Button } from "@/app/_components/ui/button";

interface Props {
  postId: string;
}

/**
 * 게시글 즐겨찾기 토글. 로그인 안 된 경우 비활성.
 * 상태 진입 시 한 번 GET 으로 현재 즐겨찾기 여부를 확인하지 않고,
 * 낙관적으로 토글 → 실패 시 롤백 + 토스트.
 *
 * 정확한 초기 상태가 필요하면 GET /me/bookmarks/{postId} 같은 엔드포인트를 추가하면 됨.
 * MVP 에서는 작동 흐름이 단순한 게 우선.
 */
export default function BookmarkButton({ postId }: Props) {
  const isLogin = useIsLoginStore((s) => s.isLogin);
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);

  // 페이지 진입 시 즐겨찾기 여부를 추정 — /me/bookmarks 목록에서 contains 체크.
  useEffect(() => {
    if (!isLogin) {
      setBookmarked(false);
      return;
    }
    apiClient
      .get("/me/bookmarks")
      .then((res) => {
        const list: Array<{ id: string }> = res.data?.data ?? [];
        setBookmarked(list.some((p) => p.id === postId));
      })
      .catch(() => setBookmarked(false));
  }, [isLogin, postId]);

  const toggle = async () => {
    if (!isLogin || busy) return;
    setBusy(true);
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    try {
      if (next) {
        await apiClient.post(`/post/${postId}/bookmark`);
      } else {
        await apiClient.delete(`/post/${postId}/bookmark`);
      }
    } catch {
      setBookmarked(!next); // rollback
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={toggle}
      disabled={!isLogin || busy}
      title={!isLogin ? "로그인 후 사용 가능" : bookmarked ? "즐겨찾기 해제" : "즐겨찾기"}
      className="flex gap-1 items-center"
    >
      <Star
        size={16}
        fill={bookmarked ? "#F59E0B" : "transparent"}
        color={bookmarked ? "#F59E0B" : "currentColor"}
      />
      <span className="text-xs">{bookmarked ? "즐겨찾기 해제" : "즐겨찾기"}</span>
    </Button>
  );
}
