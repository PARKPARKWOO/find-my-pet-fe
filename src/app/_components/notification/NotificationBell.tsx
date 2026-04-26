"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const fetchUnread = async () => {
    try {
      const res = await apiClient.get("/notifications/unread-count");
      setUnread(res.data?.data?.unread ?? 0);
    } catch {
      // 401 등은 무시 (로그아웃 상태일 수 있음)
    }
  };

  const fetchList = async () => {
    try {
      const res = await apiClient.get("/notifications", {
        params: { pageSize: 5, pageOffset: 0 },
      });
      setItems(res.data?.data ?? []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open) fetchList();
  }, [open]);

  const handleClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await apiClient.patch(`/notifications/${item.id}/read`);
      } catch {
        // ignore
      }
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isRead: true } : it)),
      );
      setUnread((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  };

  const markAllRead = async () => {
    try {
      await apiClient.post("/notifications/read-all");
    } catch {
      return;
    }
    setItems((prev) => prev.map((it) => ({ ...it, isRead: true })));
    setUnread(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="알림"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 z-50 bg-white border rounded-md shadow-lg"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-bold">알림</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-blue-500 hover:underline"
            >
              모두 읽음
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            새 알림이 없습니다.
          </div>
        ) : (
          <ul className="max-h-[360px] overflow-y-auto">
            {items.map((it) => (
              <li
                key={it.id}
                onClick={() => handleClick(it)}
                className={`px-3 py-2.5 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                  it.isRead ? "" : "bg-blue-50/40"
                }`}
              >
                <div className="flex gap-2">
                  {!it.isRead && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{it.title}</p>
                    {it.body && (
                      <p className="text-xs text-gray-600 line-clamp-2">{it.body}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelative(it.createdAt)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="border-t p-2 text-center">
          <Link
            href="/notifications"
            className="text-xs text-gray-600 hover:underline"
            onClick={() => setOpen(false)}
          >
            전체 보기
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}
