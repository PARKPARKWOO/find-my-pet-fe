import { BASE_URL } from "@/app/constant/api";

const SITE = "https://findmypet.platformholder.site";
const PAGE_SIZE = 50;

interface PostSummary {
  id: string;
  title: string;
  description: string;
  place: string;
  time: string;
  thumbnail?: string | null;
}

/** 백엔드에서 최근 실종 게시글 50건 fetch — RSS 1페이지 분량. */
async function fetchRecentPosts(): Promise<PostSummary[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/posts?pageSize=${PAGE_SIZE}&pageOffset=0&orderBy=CREATED_AT_DESC`,
      { next: { revalidate: 600 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.contents ?? [];
  } catch {
    return [];
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await fetchRecentPosts();
  const buildDate = new Date().toUTCString();

  const items = posts
    .map((p) => {
      const link = `${SITE}/lost/${p.id}`;
      const pubDate = p.time ? new Date(p.time).toUTCString() : buildDate;
      const desc = (p.description ?? "").trim().slice(0, 300);
      return `
    <item>
      <title>${escapeXml(p.title ?? "")}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(`${p.place ?? ""} - ${desc}`)}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>파인드마이펫 | 실종동물 공유게시판</title>
    <link>${SITE}</link>
    <description>실종된 반려동물 정보를 공유하고 제보 받는 커뮤니티</description>
    <language>ko-KR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // 10분 edge cache + revalidate
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
