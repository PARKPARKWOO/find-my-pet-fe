"use client";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeft, Printer, SquareArrowOutUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MapFirst } from "@/app/_components/MapFirst";
import SearchRadiusMap from "@/app/_components/lost/SearchRadiusMap";
import TimePhaseBanner from "@/app/_components/lost/TimePhaseBanner";
import LongTermGuideBlock from "@/app/_components/lost/LongTermGuideBlock";
import SimilarCandidatesSection from "@/app/_components/lost/SimilarCandidatesSection";
import FlyerManagementSection from "@/app/_components/lost/FlyerManagementSection";
import SightingSection from "@/app/_components/lost/SightingSection";
import FlyerPrintDialog from "@/app/_components/lost/FlyerPrintDialog";
import BookmarkButton from "@/app/_components/lost/BookmarkButton";
import type { AnimalType } from "@/types/breed";
import { formatDateToKorean, parseGratuityValue } from "@/lib/utils";

import DetailSkeleton from "@/app/_components/skeleton/DetailSkeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";
import useLostPet from "@/store/lostPetStore";

interface ILost{
  author: string;
  description: string;
  gender: 'male' | 'female';
  gratuity: number;
  imageUrls:  {
    id: string;
    image: string;
  }[];
  phoneNum: string;
  place: string;
  time: string;
  title: string;
  isMine: boolean;
  openChatUrl: string;
  missingAnimalStatus: "SEARCHING" | "FOUND" | "SEEN";
  coordinate?: { lat: number; lng: number };
  animalType?: AnimalType;
  breedId?: string | null;
}

export default function LostDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const {toast} = useToast()
  const [post, setPost] = useState<ILost>()
  const setEditLostPetInfo = useLostPet((state) => state.setLostPetInfo)
  useEffect(() => {
      const getPosts = async () => await apiClient.get(`/post/${params.id}`).then((res) => {setPost(res.data.data); setEditLostPetInfo(res.data.data)})
      getPosts()
  }, [])

  const removePost = async (id:string) => {
    await apiClient.delete(`/post/${id}`)
    toast({
      title: "삭제 완료",
      description: "실종 게시글이 삭제되었습니다.",
    })
    router.push('/')
  }

  if(!post) return <DetailSkeleton/>
  return (
    <div className="w-full h-full mb-[100px]">
      <div className="w-full flex justify-between mb-4">
        <Link href="/">
          <Button size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <div className="flex gap-2 items-center">
           {!post.isMine && <BookmarkButton postId={params.id} />}
           {post.openChatUrl !== null && <Link target="_blank" href={post.openChatUrl}><Button className="flex gap-2 items-center"><span>오픈 채팅</span> <SquareArrowOutUpRight size={16}/></Button></Link>}
          {
            post.isMine &&
            <div className="flex gap-2">
              <FlyerPrintDialog
                postId={params.id}
                title={post.title}
                description={post.description}
                phoneNum={post.phoneNum}
                place={post.place}
                time={post.time}
                thumbnail={post.imageUrls?.[0]?.image}
                gratuity={post.gratuity}
                missingAnimalStatus={post.missingAnimalStatus}
              >
                <Button variant="outline" className="flex gap-2 items-center"><Printer size={16}/><span>전단지 QR</span></Button>
              </FlyerPrintDialog>
              <Button onClick={() => router.push(`/edit/${params.id}`)}>수정</Button>
              <Button variant="destructive" onClick={() => removePost(params.id)}>삭제</Button>
            </div>
          }
        </div>
      </div>
      {post.missingAnimalStatus === "FOUND" && <div className="w-full flex justify-center items-center bg-gray-300 py-4 my-4 rounded-md font-bold">완료된 게시물입니다.</div>}
      <div className="flex flex-col w-full h-full gap-10">
        <div className="flex w-full sm:justify-between sm:flex-row sm:items-start items-center flex-col gap-6">
          {
            post.imageUrls.length !== 0 ?
            <Carousel className="w-full max-w-xs">
              <CarouselContent>
                {post.imageUrls.map((_, index) => (
                  <CarouselItem key={index}>
                  <div className="w-[300px] h-[300px] rounded-md relative">
                      <Image
                        src={post.imageUrls[index].image}
                        layout="fill"
                        alt="lost pet image"
                        className="rounded-lg object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            :
            <div className="h-[300px] w-[300px]  rounded-md flex justify-center relative bg-gray-100">
              <div className="flex justify-center items-center font-bold">NO IMAGE</div>
            </div>
          }
          <div className="flex flex-col sm:h-full sm:justify-between sm:gap-0 gap-2">
            <div className="flex justify-between items-center w-[300px]">
              <span>작성자</span>
              <div className="w-[250px] h-[50px] rounded-md bg-gray-100 flex justify-center items-center p-2 text-sm ">{post.author}</div>
            </div>
            <div className="flex justify-between items-center w-[300px]">
              <span>연락처</span>
              <div className="w-[250px] h-[50px] rounded-md bg-gray-100 flex justify-center items-center p-2 text-sm ">{post.missingAnimalStatus === "FOUND" ? "-" : post.phoneNum}</div>
            </div>
            <div className="flex justify-between items-center w-[300px]">
              <span>위치</span>
              <div className="w-[250px] h-[50px] rounded-md bg-gray-100 flex justify-center items-center p-2 text-sm ">
                {post.place}
              </div>
            </div>
            <div className="flex justify-between items-center w-[300px]">
              <span>날짜</span>
              <div className="w-[250px] h-[50px] rounded-md bg-gray-100 flex justify-center items-center p-2 text-sm ">{formatDateToKorean(post.time)}</div>
            </div>
            <div className="flex justify-between items-center w-[300px]">
              <span>사례금</span>
              <div className="w-[250px] h-[50px] rounded-md bg-gray-100 flex justify-center items-center p-2 text-sm ">{parseGratuityValue(post.gratuity, post.missingAnimalStatus)}</div>
            </div>
          </div>
        </div>

        <div className="w-full py-4 bg-blue-100 rounded-md flex justify-start items-center px-4 text-sm">
          💡 {post.description}
        </div>

        <TimePhaseBanner missingTime={post.time} />

        <div className="w-full flex flex-col bg-gray-50 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-bold">📍 탐색 범위</h1>
            <span className="text-xs text-gray-500">{post.place}</span>
          </div>
          {post.coordinate ? (
            <SearchRadiusMap
              lat={post.coordinate.lat}
              lng={post.coordinate.lng}
              missingTime={post.time}
              animalType={post.animalType ?? "DOG"}
              breedId={post.breedId}
              postId={params.id}
            />
          ) : (
            <div className="w-full h-[400px]">
              <MapFirst address={post.place} />
            </div>
          )}
        </div>

        <LongTermGuideBlock missingTime={post.time} place={post.place} />

        {post.coordinate && (
          <SightingSection
            postId={params.id}
            center={{ lat: post.coordinate.lat, lng: post.coordinate.lng }}
          />
        )}

        {post.isMine && post.coordinate && (
          <FlyerManagementSection
            postId={params.id}
            center={{ lat: post.coordinate.lat, lng: post.coordinate.lng }}
          />
        )}

        <SimilarCandidatesSection postId={params.id} />
      </div>
    </div>
  );
}
