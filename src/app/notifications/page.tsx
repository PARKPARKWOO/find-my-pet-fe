"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = async (offset: number) => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/notifications", {
        params: { pageSize: PAGE_SIZE, pageOffset: offset * PAGE_SIZE },
      });
      const data: NotificationItem[] = res.data?.data ?? [];
      setItems(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setItems([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(page);
  }, [page]);

  const handleClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await apiClient.patch(`/notifications/${item.id}/read`);
      } catch {
        // ignore
      }
    }
    if (item.link) router.push(item.link);
  };

  const markAllRead = async () => {
    try {
      await apiClient.post("/notifications/read-all");
      load(page);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">🔔 알림</h1>
        <button
          type="button"
          onClick={markAllRead}
          className="text-sm text-blue-500 hover:underline"
        >
          모두 읽음 처리
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400 text-sm">로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm border-dashed border-2 rounded">
          알림이 없습니다.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              onClick={() => handleClick(it)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                it.isRead ? "bg-white" : "bg-blue-50/40 border-blue-200"
              }`}
            >
              <div className="flex gap-3">
                {!it.isRead && (
                  <span className="mt-2 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold">{it.title}</p>
                  {it.body && (
                    <p className="text-sm text-gray-700 mt-1">{it.body}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(it.createdAt).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(page > 0 || hasMore) && (
        <div className="flex justify-between mt-4">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-4 py-2 text-sm rounded border disabled:opacity-40"
          >
            이전
          </button>
          <button
            type="button"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 text-sm rounded border disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
