import Image from "next/image";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatKindLabel } from "@/lib/animalType";
import { isNoticeClosed } from "@/lib/abandonment";
import type { AbandonedAnimalSummary } from "@/lib/homeFeed";

export default function AbandonmentCard({ ...pet }: AbandonedAnimalSummary) {
  const closed = isNoticeClosed(pet);
  const kind = formatKindLabel(pet.kindCd) ?? "구조동물";
  const statusText = closed ? "공고 종료" : "보호중";

  return (
    <Card className="h-[350px] w-full hover:cursor-pointer">
      <div className="h-[200px] rounded-md flex justify-center relative bg-gray-100">
        {pet.popfile ? (
          <Image
            src={pet.popfile}
            layout="fill"
            alt={`${kind} - ${pet.happenPlace ?? ""} ${statusText}`}
            className="rounded-t-lg object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-700">사진 없음</div>
        )}
      </div>
      <div className="p-2">
        <div className="flex gap-1 my-2">
          {pet.sexCd && (
            <Badge variant="secondary">{pet.sexCd}</Badge>
          )}
          {pet.weight && <Badge>{pet.weight}</Badge>}
          {closed ? (
            <Badge className="bg-state-archived text-content-inverse">공고 종료</Badge>
          ) : (
            pet.processState && <Badge>{pet.processState}</Badge>
          )}
        </div>
        <div className="flex flex-col text-sm">
          {pet.happenPlace && <span>발견 장소 : {pet.happenPlace}</span>}
          <span>종류 : {kind}</span>
          {pet.age && <span>나이 : {pet.age}</span>}
        </div>
      </div>
    </Card>
  );
}
