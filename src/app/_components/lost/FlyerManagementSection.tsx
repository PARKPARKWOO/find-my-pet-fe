"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import apiClient from "@/lib/api";

type FlyerStatus = "POSTED" | "COLLECTED";
type FlyerVisibility = "PRIVATE" | "PUBLIC";

interface FlyerLocation {
  id: string;
  postId: string;
  lat: number;
  lng: number;
  note: string | null;
  status: FlyerStatus;
  visibility: FlyerVisibility;
  postedAt: string;
  collectedAt: string | null;
}

export default function FlyerManagementSection({
  postId,
  center,
}: {
  postId: string;
  center: { lat: number; lng: number };
}) {
  const [flyers, setFlyers] = useState<FlyerLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [openNoteForm, setOpenNoteForm] = useState(false);
  const [pendingPos, setPendingPos] = useState<{ lat: number; lng: number } | null>(null);

  const load = async () => {
    try {
      const res = await apiClient.get(`/post/${postId}/flyers`);
      setFlyers(res.data?.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  const collectedCount = flyers.filter((f) => f.status === "COLLECTED").length;

  const addCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("브라우저가 위치 접근을 지원하지 않아요.");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOpenNoteForm(true);
      },
      (err) => setError(err.message || "위치 조회 실패"),
      { timeout: 8000 },
    );
  };

  const confirmAdd = async () => {
    if (!pendingPos) return;
    try {
      await apiClient.post(`/post/${postId}/flyer`, {
        lat: pendingPos.lat,
        lng: pendingPos.lng,
        note: note || null,
      });
      setOpenNoteForm(false);
      setPendingPos(null);
      setNote("");
      await load();
    } catch (e) {
      console.error(e);
      setError("전단지 등록 실패");
    }
  };

  const toggleStatus = async (flyer: FlyerLocation) => {
    const next: FlyerStatus = flyer.status === "POSTED" ? "COLLECTED" : "POSTED";
    await apiClient.patch(`/flyer/${flyer.id}/status`, null, { params: { status: next } });
    await load();
  };

  const toggleVisibility = async (flyer: FlyerLocation) => {
    const next: FlyerVisibility = flyer.visibility === "PRIVATE" ? "PUBLIC" : "PRIVATE";
    await apiClient.patch(`/flyer/${flyer.id}/visibility`, null, { params: { visibility: next } });
    await load();
  };

  const remove = async (flyer: FlyerLocation) => {
    if (!confirm("이 전단지를 삭제할까요?")) return;
    await apiClient.delete(`/flyer/${flyer.id}`);
    await load();
  };

  return (
    <section className="mt-8 p-4 border rounded-lg bg-surface-raised">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-base">전단지 관리</h3>
          <p className="text-xs text-content-muted mt-0.5">
            뿌린 위치를 기록해두고 회수할 때 편하게 찾으세요.
          </p>
        </div>
        <div className="text-sm font-semibold text-content-secondary">
          {flyers.length === 0 ? "0개" : `${collectedCount} / ${flyers.length} 회수`}
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={addCurrentLocation}
          className="px-3 py-2 bg-action-primary text-content-inverse rounded-md text-sm hover:bg-forest-strong"
        >
          + 현 위치에 전단지 등록
        </button>
        {error && <span className="text-xs text-action-destructive self-center">{error}</span>}
      </div>

      {openNoteForm && (
        <div className="mb-3 p-3 bg-surface-canvas border rounded">
          <label className="block text-xs mb-1 text-content-secondary">메모 (선택)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 삼성아파트 101동 1층 게시판"
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={confirmAdd}
              className="px-3 py-1 bg-forest text-content-inverse rounded text-xs"
            >
              등록
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenNoteForm(false);
                setPendingPos(null);
                setNote("");
              }}
              className="px-3 py-1 bg-border rounded text-xs"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {!isLoading && flyers.length === 0 ? (
        <div className="text-sm text-content-muted py-4 text-center border-dashed border-2 rounded">
          아직 등록된 전단지가 없습니다.
        </div>
      ) : (
        <>
          <div className="w-full" style={{ height: 280 }}>
            <Map
              center={center}
              level={5}
              style={{ width: "100%", height: "100%" }}
            >
              <MapMarker position={center} />
              {flyers.map((f) => (
                <CustomOverlayMap key={f.id} position={{ lat: f.lat, lng: f.lng }}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow ${
                      f.status === "COLLECTED"
                        ? "bg-gray-400 text-content-inverse"
                        : "bg-red-500 text-content-inverse"
                    }`}
                    title={f.note ?? ""}
                  >
                    {f.status === "COLLECTED" ? "✓" : "🪧"}
                  </div>
                </CustomOverlayMap>
              ))}
            </Map>
          </div>

          <ul className="mt-3 space-y-1.5">
            {flyers.map((f) => (
              <li
                key={f.id}
                className={`flex items-center gap-2 text-sm p-2 rounded border ${
                  f.status === "COLLECTED" ? "bg-surface-canvas text-content-muted" : "bg-surface-raised"
                }`}
              >
                <input
                  type="checkbox"
                  checked={f.status === "COLLECTED"}
                  onChange={() => toggleStatus(f)}
                  className="w-4 h-4"
                />
                <span className="flex-1 truncate">
                  {f.note || `(${f.lat.toFixed(5)}, ${f.lng.toFixed(5)})`}
                </span>
                <button
                  type="button"
                  onClick={() => toggleVisibility(f)}
                  className={`text-xs px-2 py-0.5 rounded border ${
                    f.visibility === "PUBLIC"
                      ? "bg-forest/10 text-forest-strong border-forest/40"
                      : "bg-surface-canvas text-content-secondary border-border"
                  }`}
                  title="공개 전환 시 게시글 상세 페이지에 누구나 이 위치를 볼 수 있음"
                >
                  {f.visibility === "PUBLIC" ? "공개" : "비공개"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(f)}
                  className="text-xs text-action-destructive hover:underline"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
