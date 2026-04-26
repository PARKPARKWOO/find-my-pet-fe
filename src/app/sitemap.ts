import type { MetadataRoute } from "next";
import { BASE_URL } from "@/app/constant/api";
import { getAllPosts } from "@/lib/parsePost";

const DOMAIN_URL = "https://findmypet.platformholder.site";
const POSTS_PAGE_SIZE = 100;
const POSTS_MAX_PAGES = 10; // 최대 1000건만 sitemap 에 포함 (그 이상은 정적 page param 추가 필요)

interface ApiPostSummary {
  id: string;
  time?: string;
}

/** 백엔드에서 실종 게시글 ID + 작성 시간 listing. 실패 시 빈 배열로 fallback (sitemap 자체는 빌드 됨). */
async function fetchAllPosts(): Promise<ApiPostSummary[]> {
  const result: ApiPostSummary[] = [];
  for (let page = 0; page < POSTS_MAX_PAGES; page++) {
    try {
      const res = await fetch(
        `${BASE_URL}/posts?pageSize=${POSTS_PAGE_SIZE}&pageOffset=${page}&orderBy=CREATED_AT_DESC`,
        { next: { revalidate: 600 } },
      );
      if (!res.ok) break;
      const json = await res.json();
      const contents: ApiPostSummary[] = json?.data?.contents ?? [];
      if (contents.length === 0) break;
      result.push(...contents);
      if (!json?.data?.hasNextPage) break;
    } catch {
      break;
    }
  }
  return result;
}

async function safeGetAllPosts(): Promise<Array<{ slug: string }>> {
  try {
    const r = await getAllPosts();
    return r as unknown as Array<{ slug: string }>;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, mdxPosts] = await Promise.all([fetchAllPosts(), safeGetAllPosts()]);

  const lostPosts: MetadataRoute.Sitemap = posts.map((p: ApiPostSummary) => ({
    url: `${DOMAIN_URL}/lost/${p.id}`,
    lastModified: p.time ? new Date(p.time) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const mdxEntries: MetadataRoute.Sitemap = mdxPosts.map((post) => ({
    url: `${DOMAIN_URL}${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: DOMAIN_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${DOMAIN_URL}/posts`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${DOMAIN_URL}/guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${DOMAIN_URL}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...staticPages, ...lostPosts, ...mdxEntries];
}
