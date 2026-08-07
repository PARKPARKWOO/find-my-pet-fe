"use client";

import { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { formatKindLabel } from "@/lib/animalType";

interface MatchCandidate {
  desertionNo: string;
  photoUrl: string | null;
  kindCd: string | null;
  sexCd: string | null;
  age: string | null;
  weight: string | null;
  specialMark: string | null;
  happenPlace: string | null;
  happenDt: string | null;
  careNm: string | null;
  careTel: string | null;
  careAddr: string | null;
  // similarity 는 UI 에서 직접 표시하지 않음 (UX 지침)
  reasoning: string | null;
}

export default function SimilarCandidatesSection({ postId }: { postId: string }) {
  const [candidates, setCandidates] = useState<MatchCandidate[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get(`/post/${postId}/similar-candidates`, { params: { limit: 5 } })
      .then((res) => {
        if (mounted) setCandidates(res.data?.data ?? []);
      })
      .catch(() => {
        if (mounted) setCandidates([]);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [postId]);

  if (isLoading) {
    return (
      <section className="mt-8">
        <h3 className="text-lg font-bold mb-2">닮은 아이들이 있어요</h3>
        <div className="text-sm text-content-muted">닮은 아이 찾는 중...</div>
      </section>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <section className="mt-8">
        <h3 className="text-lg font-bold mb-2">닮은 아이들이 있어요</h3>
        <div className="text-sm text-content-muted p-4 bg-surface-canvas rounded border">
          오늘 새로 입소한 구조동물 중엔 닮은 아이가 없었어요. 내일 다시 찾아볼게요.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h3 className="text-lg font-bold mb-1">닮은 아이들이 있어요</h3>
      <p className="text-xs text-content-muted mb-3">
        AI가 사진을 훑어보고 비슷한 특징의 아이들을 찾았습니다.{" "}
        <b>최종 확인은 꼭 보호소에 직접 연락해주세요.</b>
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {candidates.map((c) => (
          <CandidateCard key={c.desertionNo} c={c} />
        ))}
      </div>
    </section>
  );
}

function CandidateCard({ c }: { c: MatchCandidate }) {
  return (
    <div className="border rounded-lg p-3 bg-surface-raised relative">
      <span className="absolute top-2 right-2 text-[10px] text-content-muted bg-surface-canvas px-2 py-0.5 rounded">
        참고용
      </span>
      {c.photoUrl && (
        <img
          src={c.photoUrl}
          alt={formatKindLabel(c.kindCd) ?? "구조동물"}
          className="w-full h-40 object-cover rounded"
        />
      )}
      <div className="mt-2">
        <div className="font-semibold text-sm">이 아이, 닮았나요?</div>
        <div className="text-xs text-content-secondary mt-1 space-y-0.5">
          {c.kindCd && <div>{formatKindLabel(c.kindCd)}</div>}
          {c.happenPlace && <div>{c.happenPlace}</div>}
          {c.happenDt && (
            <div>{formatYYYYMMDD(c.happenDt)} 입소</div>
          )}
          {c.careNm && (
            <div>
              {c.careNm}
              {c.careTel ? ` · ${c.careTel}` : ""}
            </div>
          )}
        </div>
        {c.reasoning && (
          <div className="mt-2 text-xs bg-waiting/10 border border-waiting/40 rounded p-2">
            {c.reasoning}
          </div>
        )}
      </div>
    </div>
  );
}

function formatYYYYMMDD(v: string): string {
  if (!/^\d{8}$/.test(v)) return v;
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}
