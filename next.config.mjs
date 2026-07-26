/** @type {import('next').NextConfig} */
const nextConfig = {
  // 정적 페이지 하나가 이 시간을 넘기면 Next 는 워커를 죽이고 3회 재시도 뒤 빌드 전체를 실패시킨다.
  // 기본 60초는 원격 데이터를 모아 만드는 sitemap 에 빠듯하다 — 실제 배포가 여기서 연속 실패했다.
  // 진짜 방어선은 sitemap.ts 의 수집 예산이고, 이건 그 예산이 어긋났을 때를 위한 여유분이다.
  staticPageGenerationTimeout: 180,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "github.com" },
      // MinIO presigned GET URL — post 이미지 공개 게시판용 (1h expiry)
      { protocol: "https", hostname: "bucket.platformholder.site" },
      // 공공데이터 v2 유기동물 사진 (백엔드에서 http → https 강제 치환)
      { protocol: "https", hostname: "openapi.animal.go.kr" },
    ],
    domains: ["www.animal.go.kr", "cdn.platformholder.site"],
  },
};

export default nextConfig;
