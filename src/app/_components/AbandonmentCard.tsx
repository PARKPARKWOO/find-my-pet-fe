import Image from "next/image";
import { Card } from "./ui/card";
import { IPet } from "./main/AbandonmentList";
import { Badge } from "./ui/badge";

export default function AbandonmentCard({ ...pet }: IPet) {
  return (
    <Card className="h-[350px] sm:w-[250px] w-full hover:cursor-pointer">
      <div className="h-[200px] rounded-md flex justify-center relative bg-gray-100">
        {pet.popfile ? (
          <Image src={pet.popfile} layout="fill" alt="abandonment pet image" className="rounded-t-lg object-cover" />
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
          <Badge>{pet.processState}</Badge>
        </div>
        <div className="flex flex-col text-sm">
          <span>발견 장소 : {pet.happenPlace}</span>
          <span>종류 : {pet.kindCd}</span>
          <span>나이 : {pet.age}</span>
        </div>
      </div>
    </Card>
  );
}
