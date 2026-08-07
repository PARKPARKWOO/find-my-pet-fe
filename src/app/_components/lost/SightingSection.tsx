"use client";

import { useEffect, useState } from "react";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import apiClient from "@/lib/api";
import { formatDateToKorean } from "@/lib/utils";
import useIsLoginStore from "@/store/loginStore";

interface Sighting {
  id: string;
  postId: string;
  reporter: string | null;
  lat: number;
  lng: number;
  sightedAt: string;
  note: string | null;
  photoUrl: string | null;
  isMine: boolean;
}

interface Props {
  postId: string;
  center: { lat: number; lng: number };
}

export default function SightingSection({ postId, center }: Props) {
  const isLogin = useIsLoginStore((state) => state.isLogin);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pendingPos, setPendingPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await apiClient.get(`/post/${postId}/sightings`);
      setSightings(res.data?.data ?? []);
    } catch {
      setSightings([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [postId]);

  const startReport = () => {
    if (!isLogin) {
      setError("목격 제보는 로그인 후 가능합니다.");
      return;
    }
    if (!navigator.geolocation) {
      setError("브라우저가 위치 접근을 지원하지 않아요.");
      return;
    }
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFormOpen(true);
      },
      (err) => setError(err.message || "위치 조회 실패"),
      { timeout: 8000 },
    );
  };

  const submit = async () => {
    if (!pendingPos) return;
    try {
      await apiClient.post(`/post/${postId}/sighting`, {
        lat: pendingPos.lat,
        lng: pendingPos.lng,
        note: note || null,
      });
      setFormOpen(false);
      setPendingPos(null);
      setNote("");
      await load();
    } catch (e) {
      console.error(e);
      setError("목격 제보 등록 실패");
    }
  };

  const remove = async (s: Sighting) => {
    if (!confirm("제보를 삭제할까요?")) return;
    await apiClient.delete(`/sighting/${s.id}`);
    await load();
  };

  return (
    <section className="mt-8 p-4 border rounded-lg bg-surface-raised">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-base">목격 제보</h3>
          <p className="text-xs text-content-muted mt-0.5">
            이 아이를 어디선가 보셨다면 위치를 찍어주세요. 보호자가 바로 볼 수 있어요.
          </p>
        </div>
        <div className="text-sm text-content-secondary">{sightings.length}건</div>
      </div>

      <div className="mb-3">
        <button
          type="button"
          onClick={startReport}
          className="px-3 py-2 bg-forest text-content-inverse rounded-md text-sm hover:bg-forest-strong disabled:opacity-60"
          disabled={!isLogin}
          title={!isLogin ? "로그인 필요" : ""}
        >
          + 여기서 봤어요
        </button>
        {error && <span className="ml-2 text-xs text-action-destructive">{error}</span>}
      </div>

      {formOpen && (
        <div className="mb-3 p-3 bg-surface-canvas border rounded">
          <label className="block text-xs mb-1 text-content-secondary">메모 (선택)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 역삼동 삼성아파트 주차장, 10분 전"
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={submit}
              className="px-3 py-1 bg-forest text-content-inverse rounded text-xs"
            >
              제보하기
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
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

      {!isLoading && sightings.length === 0 ? (
        <div className="text-sm text-content-muted py-4 text-center border-dashed border-2 rounded">
          아직 목격 제보가 없습니다.
        </div>
      ) : (
        <>
          <div className="w-full mb-3" style={{ height: 280 }}>
            <Map center={center} level={6} style={{ width: "100%", height: "100%" }}>
              <MapMarker position={center} />
              {sightings.map((s, idx) => (
                <CustomOverlayMap
                  key={s.id}
                  position={{ lat: s.lat, lng: s.lng }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow bg-forest text-content-inverse border-2 border-white"
                    title={s.note ?? ""}
                  >
                    {idx + 1}
                  </div>
                </CustomOverlayMap>
              ))}
            </Map>
          </div>

          <ul className="space-y-1.5">
            {sightings.map((s, idx) => (
              <li
                key={s.id}
                className="flex items-start gap-3 text-sm p-2 rounded border bg-surface-raised"
              >
                <div className="w-6 h-6 rounded-full bg-forest text-content-inverse flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate">
                    {s.note || `(${s.lat.toFixed(5)}, ${s.lng.toFixed(5)})`}
                  </div>
                  <div className="text-xs text-content-muted mt-0.5">
                    {formatDateToKorean(s.sightedAt)} · {s.reporter ?? "익명"}
                  </div>
                </div>
                {s.isMine && (
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    className="text-xs text-action-destructive hover:underline"
                  >
                    삭제
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
