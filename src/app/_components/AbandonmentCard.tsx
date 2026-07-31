import Image from "next/image";
import { Card } from "./ui/card";
import { IPet } from "./main/AbandonmentList";
import { Badge } from "./ui/badge";
import { formatKindLabel } from "@/lib/animalType";
import { isNoticeClosed } from "@/lib/abandonment";

export default function AbandonmentCard({ ...pet }: IPet) {
  const closed = isNoticeClosed(pet);
  const kind = formatKindLabel(pet.kindCd) ?? "구조동물";
  // 종료된 공고에 "보호중" 이라고 적으면 그게 곧 거짓말이 된다. 사실만 남긴다.
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
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">사진 없음</div>
        )}
      </div>
      <div className="p-2">
        <div className="flex gap-1 my-2">
          {pet.sexCd === "M" ? (
            <Badge className="bg-blue-400">{pet.sexCd}</Badge>
          ) : (
            <Badge className="bg-pink-400">{pet.sexCd}</Badge>
          )}
          <Badge>{pet.weight}</Badge>
          {/* 공고가 끝났으면 원본 processState("보호중" 으로 얼어붙어 있다) 대신 사실을 보여준다. */}
          {closed ? (
            <Badge className="bg-amber-500">공고 종료</Badge>
          ) : (
            <Badge>{pet.processState}</Badge>
          )}
        </div>
        <div className="flex flex-col text-sm">
          <span>발견 장소 : {pet.happenPlace}</span>
          <span>종류 : {kind}</span>
          <span>나이 : {pet.age}</span>
        </div>
      </div>
    </Card>
  );
}
