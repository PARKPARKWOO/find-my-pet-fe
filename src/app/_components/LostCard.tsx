import Image from "next/image";
import { Card } from "./ui/card";
import { formatDateToKorean, parseGratuityValue, truncateText} from "@/lib/utils";

export interface ILostPet {
    author: string;
    gratuity: number;
    id: string;
    place: string;
    thumbnail: string;
    time: string;
    title: string;
    description: string;
    missingAnimalStatus: "FOUND" | "SEARCHING" | "SEEN";
    distanceKm?: number;
}

export default function LostCard({ ...pet }: ILostPet) {

  const renderStatusLabel = (missingStatus: "FOUND" | "SEARCHING" | "SEEN") => {
    switch (missingStatus){
      case "FOUND":
        return <div className=" text-white bg-gray-500 rounded-md p-2 text-xs font-bold">완료</div>
      case "SEARCHING":
        return <div className=" text-white bg-red-500 rounded-md p-2 text-xs font-bold">실종</div>
      case "SEEN":
        return <div className=" text-white bg-blue-500 rounded-md p-2 text-xs font-bold">목격</div>
    }
  }

  return (
    <Card className="h-[450px] w-full hover:cursor-pointer flex flex-col gap-4">
      <div className="h-[200px] rounded-md flex justify-center relative">
        {
            pet.thumbnail ? 
            <Image src={pet.thumbnail} layout="fill" alt={`${pet.title} - ${pet.place} 실종 동물 사진`} className="rounded-t-lg object-cover" />
            :
            <div className="flex justify-center items-center font-bold">NO IMAGE</div>
        }
      </div>
      <div className="font-bold items-center text-center w-full h-12 px-4">{pet.title}</div>
      <div className="px-2">
        <div className="flex gap-1 flex-col text-sm">
            <div className="bg-gray-100 p-2 rounded-md">📍 {pet.place}</div>
            <div className="p-2 rounded-md flex gap-2 flex-wrap">
              {renderStatusLabel(pet.missingAnimalStatus)}
              <div className=" text-white bg-emerald-500 rounded-md p-2 text-xs font-bold">📅 {formatDateToKorean(pet.time)}</div>
              {pet.distanceKm !== undefined && (
                <div className=" text-white bg-indigo-500 rounded-md p-2 text-xs font-bold">📍 {pet.distanceKm.toFixed(1)}km</div>
              )}
              {pet.missingAnimalStatus === "SEARCHING" && pet.gratuity !== 0 && <div className=" text-white bg-amber-500 rounded-md p-2 text-xs font-bold"> 사례금 {parseGratuityValue(pet.gratuity, pet.missingAnimalStatus)}</div>}
            </div>
        </div>
        <span className="text-sm">{truncateText(pet.description)}</span>
      </div>
    </Card>
  );
}
