'use client'
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function MapSecond({address}:{address:string}) {
    const [isValidAddress, setIsValidAddress] = useState(false);
    const container = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_API_KEY}&libraries=services,clusterer`;
        document.head.appendChild(script);

            script.onload = () => {
                kakao.maps.load(function() {
                    const mapContainer = document.getElementById('map2')!;
                    const mapOption = {
                        center: new kakao.maps.LatLng(33.450701, 126.570667),
                        level: 3
                    };

                    // 지도를 표시할 div와  지도 옵션으로  지도를 생성합니다
                    const map2 = new kakao.maps.Map(mapContainer, mapOption);

                   // geocorder 객체 생성합니다.
                    const geocorder = new kakao.maps.services.Geocoder();
                    
                    // 주소로 좌표를 검색합니다
                    geocorder.addressSearch(address, function(result, status) {

                        // 정상적으로 검색이 완료됐으면 
                        if (status === kakao.maps.services.Status.OK) {
                            setIsValidAddress(true)
                            const coords = new kakao.maps.LatLng(Number(result[0].y), Number(result[0].x));

                            // 결과값으로 받은 위치를 마커로 표시합니다
                            const marker = new kakao.maps.Marker({
                                map: map2,
                                position: coords
                            });

                            // 인포윈도우로 장소에 대한 설명을 표시합니다
                            const infowindow = new kakao.maps.InfoWindow({
                                content: '<div style="width:150px;text-align:center;padding:6px 0;">보호소 위치</div>'
                            });
                            infowindow.open(map2, marker);
                            // 지도의 중심을 결과값으로 받은 위치로 이동시킵니다
                            map2.setCenter(coords);
                        }else{
                            setIsValidAddress(false)
                        }
                    });   
            });
        };

    }, [address]);

  return (
    <div className='w-full h-full relative'>
        {
            !isValidAddress && 
            <>
                <div className='z-20 absolute w-full h-full rounded-xl border border-border bg-surface-canvas'></div>
                <div className='z-30 flex flex-col justify-center text-content-secondary items-center w-full h-full absolute bg-transparent gap-3 px-4 text-center text-sm'>
                    <span>지도로 표시할 수 없는 주소예요. 카카오맵에서 직접 확인해 보세요.</span>
                    <Link target='_blank' href={`https://map.kakao.com/?q=${encodeURIComponent(address ?? "")}`}><div className='inline-flex items-center gap-1 rounded-xl bg-action-primary hover:bg-forest-strong text-content-inverse font-semibold text-sm py-2.5 px-4'>카카오맵에서 보기 <ArrowRight/></div></Link>
                </div>
            </>
        }
        <div id="map2" className='z-10 w-full h-full' ref={container}></div>
    </div>  
  )
}