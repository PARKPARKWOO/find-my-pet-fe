import type { Metadata } from "next";
import { BASE_URL } from "@/app/constant/api";
import LostDetailClient from "./LostDetailClient";

const SITE_DOMAIN = "https://findmypet.platformholder.site";

interface PostDetail {
  title: string;
  description: string;
  place: string;
  imageUrls: Array<{ id: string; image: string }>;
  missingAnimalStatus: "SEARCHING" | "FOUND" | "SEEN";
  time: string;
  author: string;
}

/** 서버 사이드에서 게시글 상세 fetch — 인증 없는 public 조회 (revalidate 5분 캐시). */
async function fetchPost(id: string): Promise<PostDetail | null> {
  try {
    const res = await fetch(`${BASE_URL}/post/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data as PostDetail) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await fetchPost(params.id);
  const url = `${SITE_DOMAIN}/lost/${params.id}`;
  if (!post) {
    return {
      title: "실종 게시글 | 파인드마이펫",
      description: "실종된 동물의 정보를 확인하고 제보해 주세요.",
      alternates: { canonical: url },
    };
  }
  const statusLabel =
    post.missingAnimalStatus === "FOUND"
      ? "찾음"
      : post.missingAnimalStatus === "SEEN"
        ? "목격"
        : "실종";
  const title = `[${statusLabel}] ${post.title} - 파인드마이펫`;
  const descRaw = (post.description ?? "").trim().replace(/\s+/g, " ");
  const description =
    `${post.place}에서 ${statusLabel}된 반려동물입니다. ${descRaw}`.slice(0, 160);
  const ogImage = post.imageUrls?.[0]?.image;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "파인드마이펫",
      locale: "ko_KR",
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function LostDetailPage({ params }: { params: { id: string } }) {
  const post = await fetchPost(params.id);
  // JSON-LD: Article schema 로 검색 색인 풍부화. 본문 인터랙션은 client 컴포넌트가 담당.
  const ldJson = post
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: post.description,
        author: { "@type": "Person", name: post.author },
        datePublished: post.time,
        image: post.imageUrls?.map((i) => i.image) ?? [],
        inLanguage: "ko-KR",
      }
    : null;

  return (
    <>
      {ldJson && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
        />
      )}
      <LostDetailClient params={params} />
    </>
  );
}
