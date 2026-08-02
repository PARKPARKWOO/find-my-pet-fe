import Image from "next/image";
import { CalendarDays, MapPin, PawPrint } from "lucide-react";
import { Card } from "./ui/card";
import { formatDateToKorean, parseGratuityValue } from "@/lib/utils";
import type { LostPetSummary } from "@/lib/homeFeed";

const STATUS_BADGE: Record<
  LostPetSummary["missingAnimalStatus"],
  { label: string; className: string }
> = {
  SEARCHING: { label: "찾는 중", className: "bg-state-searching" },
  SEEN: { label: "목격", className: "bg-state-sighting" },
  FOUND: { label: "완료", className: "bg-state-found" },
};

export default function LostCard({ ...pet }: LostPetSummary) {
  const status = STATUS_BADGE[pet.missingAnimalStatus];
  const showGratuity = pet.missingAnimalStatus === "SEARCHING" && pet.gratuity !== 0;

  return (
    <Card className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border-border bg-surface-raised transition-all duration-200 hover:-translate-y-1 hover:border-clay/60 hover:shadow-raised">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-canvas">
        {pet.thumbnail ? (
          <Image
            src={pet.thumbnail}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
            alt={`${pet.title} - ${pet.place} 실종 동물 사진`}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2">
            <PawPrint aria-hidden className="size-8 text-content-muted/60" />
            <span className="text-xs font-medium text-content-muted">등록된 사진이 없어요</span>
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold text-content-inverse ${status.className}`}
        >
          {status.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <strong className="line-clamp-1 text-base font-semibold text-content-primary">{pet.title}</strong>
        <div className="flex flex-col gap-1 text-sm text-content-secondary">
          <span className="flex items-center gap-1.5">
            <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-content-muted" />
            <span className="line-clamp-1">
              {pet.place}
              {pet.distanceKm !== undefined ? ` · ${pet.distanceKm.toFixed(1)}km` : ""}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-3.5 shrink-0 text-content-muted" />
            {formatDateToKorean(pet.time)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-content-muted">{pet.description}</p>
        {showGratuity && (
          <span className="mt-auto inline-flex w-fit rounded-full bg-wine/10 px-2.5 py-1 text-xs font-bold text-wine">
            사례금 {parseGratuityValue(pet.gratuity, pet.missingAnimalStatus)}
          </span>
        )}
      </div>
    </Card>
  );
}
