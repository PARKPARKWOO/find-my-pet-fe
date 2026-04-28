"use client";

import { MapFirst } from "@/app/_components/MapFirst";
import { MapSecond } from "@/app/_components/MapSecond";

interface Props {
  happenPlace: string;
  careAddr: string;
}

/** 카카오 지도 SDK 의존이라 client island 로 분리. */
export default function AbandonmentMaps({ happenPlace, careAddr }: Props) {
  return (
    <>
      <div className="w-full h-[300px] mt-2">
        <MapFirst address={happenPlace} />
      </div>
    </>
  );
}

export function ShelterMap({ careAddr }: { careAddr: string }) {
  return (
    <div className="w-full h-[300px] mt-2">
      <MapSecond address={careAddr} />
    </div>
  );
}
