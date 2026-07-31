import "server-only";

import { BASE_URL } from "@/app/constant/api";
import {
  type AbandonedAnimalSummary,
  type FeedSource,
  type HomeFeedSnapshot,
  type LostPetSummary,
  type PagePayload,
  parsePagePayload,
} from "./homeFeed";

// Intentional public SSR/cache exception: this feed carries no user-specific data.
function publicCacheOptions(
  revalidate: number,
): { cache: "no-store" } | { next: { revalidate: number } } {
  return process.env.FMP_E2E === "1"
    ? { cache: "no-store" }
    : { next: { revalidate } };
}

async function fetchPublicPage<T>(
  url: string,
  revalidate: number,
): Promise<PagePayload<T>> {
  const response = await fetch(url, publicCacheOptions(revalidate));
  if (!response.ok) throw new Error("Public home feed request failed");

  return parsePagePayload<T>(await response.json());
}

function toSource<T>(
  result: PromiseSettledResult<PagePayload<T>>,
): FeedSource<T> {
  return result.status === "fulfilled"
    ? { status: "success", data: result.value }
    : { status: "error" };
}

export async function getHomeFeedSnapshot(): Promise<HomeFeedSnapshot> {
  const [lost, abandonment] = await Promise.allSettled([
    fetchPublicPage<LostPetSummary>(
      `${BASE_URL}/posts?pageSize=5&pageOffset=0&orderBy=CREATED_AT_DESC`,
      30,
    ),
    fetchPublicPage<AbandonedAnimalSummary>(
      `${BASE_URL}/abandoned-animals?pageNo=1&numOfRows=20&noticeStatus=OPEN`,
      1800,
    ),
  ]);

  return { lost: toSource(lost), abandonment: toSource(abandonment) };
}
