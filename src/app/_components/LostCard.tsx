import Image from "next/image";
import { Card } from "./ui/card";
import { formatDateToKorean, parseGratuityValue, truncateText } from "@/lib/utils";
import type { LostPetSummary } from "@/lib/homeFeed";

export default function LostCard({ ...pet }: LostPetSummary) {
  const renderStatusLabel = (missingStatus: LostPetSummary["missingAnimalStatus"]) => {
    switch (missingStatus) {
      case "FOUND":
        return <div className="bg-state-found text-content-inverse rounded-md p-2 text-xs font-bold">완료</div>;
      case "SEARCHING":
        return <div className="bg-state-searching text-content-inverse rounded-md p-2 text-xs font-bold">실종</div>;
      case "SEEN":
        return <div className="bg-state-sighting text-content-inverse rounded-md p-2 text-xs font-bold">목격</div>;
    }
  };

  return (
    <Card className="h-[450px] w-full hover:cursor-pointer flex flex-col gap-4">
      <div className="h-[200px] rounded-md flex justify-center relative">
        {pet.thumbnail ? (
          <Image
            src={pet.thumbnail}
            layout="fill"
            alt={`${pet.title} - ${pet.place} 실종 동물 사진`}
            className="rounded-t-lg object-cover"
          />
        ) : (
          <div className="flex justify-center items-center font-bold">NO IMAGE</div>
        )}
      </div>
      <div className="font-bold items-center text-center w-full h-12 px-4">{pet.title}</div>
      <div className="px-2">
        <div className="flex gap-1 flex-col text-sm">
          <div className="bg-gray-100 p-2 rounded-md">📍 {pet.place}</div>
          <div className="p-2 rounded-md flex gap-2 flex-wrap">
            {renderStatusLabel(pet.missingAnimalStatus)}
            <div className="bg-action-primary text-content-inverse rounded-md p-2 text-xs font-bold">
              📅 {formatDateToKorean(pet.time)}
            </div>
            {pet.distanceKm !== undefined && (
              <div className="bg-action-primary text-content-inverse rounded-md p-2 text-xs font-bold">
                📍 {pet.distanceKm.toFixed(1)}km
              </div>
            )}
            {pet.missingAnimalStatus === "SEARCHING" && pet.gratuity !== 0 && (
              <div className="bg-action-secondary text-content-inverse rounded-md p-2 text-xs font-bold">
                사례금 {parseGratuityValue(pet.gratuity, pet.missingAnimalStatus)}
              </div>
            )}
          </div>
        </div>
        <span className="text-sm">{truncateText(pet.description)}</span>
      </div>
    </Card>
  );
}
