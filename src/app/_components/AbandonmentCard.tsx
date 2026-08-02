import Image from "next/image";
import { CalendarDays, MapPin, PawPrint } from "lucide-react";
import { Card } from "./ui/card";
import { formatKindLabel } from "@/lib/animalType";
import { isNoticeClosed } from "@/lib/abandonment";
import type { AbandonedAnimalSummary } from "@/lib/homeFeed";

const SEX_LABEL: Record<string, string> = {
  M: "수컷",
  F: "암컷",
  Q: "성별 미상",
};

function formatHappenDate(value: string | null): string | null {
  if (!value || !/^\d{8}$/.test(value)) return null;
  return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

export default function AbandonmentCard({ ...pet }: AbandonedAnimalSummary) {
  const closed = isNoticeClosed(pet);
  const kind = formatKindLabel(pet.kindCd) ?? "구조동물";
  const statusText = closed ? "공고 종료" : "보호 중";
  const sexLabel = pet.sexCd ? SEX_LABEL[pet.sexCd] ?? null : null;
  const ageLabel = pet.age ? pet.age.replace("(년생)", "년생").trim() : null;
  const weightLabel = pet.weight ? pet.weight.replace(/\(?kg\)?/i, "kg").trim() : null;
  const happenDate = formatHappenDate(pet.happenDt);

  return (
    <Card className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border-border bg-surface-raised transition-all duration-200 hover:-translate-y-1 hover:border-clay/60 hover:shadow-raised">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-canvas">
        {pet.popfile ? (
          <Image
            src={pet.popfile}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
            alt={`${kind} - ${pet.happenPlace ?? ""} ${statusText}`}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <PawPrint aria-hidden className="size-8 text-content-muted/60" />
            <span className="text-xs font-medium text-content-muted">등록된 사진이 없어요</span>
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-content-inverse ${
            closed ? "bg-state-archived" : "bg-state-found"
          }`}
        >
          {statusText}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <strong className="line-clamp-1 text-base font-semibold text-content-primary">{kind}</strong>
        {(sexLabel || ageLabel || weightLabel) && (
          <div className="flex flex-wrap gap-1.5">
            {sexLabel && (
              <span className="rounded-full bg-surface-canvas px-2 py-0.5 text-xs font-medium text-content-secondary">
                {sexLabel}
              </span>
            )}
            {ageLabel && (
              <span className="rounded-full bg-surface-canvas px-2 py-0.5 text-xs font-medium text-content-secondary">
                {ageLabel}
              </span>
            )}
            {weightLabel && (
              <span className="rounded-full bg-surface-canvas px-2 py-0.5 text-xs font-medium text-content-secondary">
                {weightLabel}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-col gap-1 text-sm text-content-secondary">
          {pet.happenPlace && (
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-content-muted" />
              <span className="line-clamp-1">{pet.happenPlace}</span>
            </span>
          )}
          {happenDate && (
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-3.5 shrink-0 text-content-muted" />
              {happenDate} 발견
            </span>
          )}
        </div>
        {pet.careNm && (
          <p className="mt-auto line-clamp-1 pt-1 text-xs text-content-muted">{pet.careNm}</p>
        )}
      </div>
    </Card>
  );
}
