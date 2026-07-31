export type MissingAnimalStatus = "SEARCHING" | "FOUND" | "SEEN";
export type MarqueeKind = "SEARCHING" | "SEEN" | "PROTECTED";

export interface LostPetSummary {
  id: string;
  author: string;
  title: string;
  description: string;
  gratuity: number;
  place: string;
  time: string;
  thumbnail: string | null;
  missingAnimalStatus: MissingAnimalStatus;
  animalType: "DOG" | "CAT" | "OTHER";
  breedId: string | null;
  distanceKm?: number;
}

export interface NearbyLostPetSummary extends LostPetSummary {
  lat: number;
  lng: number;
  distanceKm: number;
}

export interface AbandonedAnimalSummary {
  desertionNo: string;
  filename: string | null;
  popfile: string | null;
  kindCd: string | null;
  sexCd: string | null;
  age: string | null;
  weight: string | null;
  specialMark: string | null;
  happenPlace: string | null;
  happenDt: string | null;
  careNm: string | null;
  careTel: string | null;
  careAddr: string | null;
  processState: string | null;
  noticeNo: string | null;
  noticeSdt: string | null;
  noticeEdt: string | null;
  effectiveNoticeEdt: string | null;
  animalType: "DOG" | "CAT" | "OTHER" | null;
  orgNm: string | null;
  noticeClosed: boolean;
  noticeClosedAt: string | null;
}

export interface PagePayload<T> {
  contents: T[];
  totalCount: number;
  hasNextPage: boolean;
}

export type FeedSource<T> =
  | { status: "success"; data: PagePayload<T> }
  | { status: "error" };

export interface HomeFeedSnapshot {
  lost: FeedSource<LostPetSummary>;
  abandonment: FeedSource<AbandonedAnimalSummary>;
}

export interface MarqueeItem {
  key: `lost:${string}` | `abandoned:${string}`;
  kind: MarqueeKind;
  href: `/lost/${string}` | `/abandonment/${string}`;
  title: string;
  place: string | null;
  occurredAt: string | null;
  dateFormat: "iso" | "yyyymmdd";
  thumbnail: string | null;
}

export interface HomeListSeed<T> {
  requestKey: string;
  data: PagePayload<T>;
}

export const HOME_LOST_REQUEST_KEY = "lost:standard:page=1:size=5";
export const HOME_ABANDONMENT_REQUEST_KEY =
  "abandonment:status=OPEN:type=ALL:sido=:sigungu=:page=1:size=20";

export type NearbyRequestKey =
  | { enabled: false }
  | { enabled: true; lat: number; lng: number; radiusKm: number };

export interface AbandonmentRequestKeyInput {
  noticeStatus: "OPEN" | "CLOSED" | "ALL";
  animalType: "DOG" | "CAT" | "OTHER" | "ALL";
  uprCd: string;
  orgCd: string;
  currentPage: number;
  pageSize: number;
}

export function getLostRequestKey(input: {
  currentPage: number;
  pageSize: number;
  nearby: NearbyRequestKey;
}): string {
  if (!input.nearby.enabled) {
    return `lost:standard:page=${input.currentPage}:size=${input.pageSize}`;
  }

  return [
    "lost:nearby",
    `lat=${input.nearby.lat}`,
    `lng=${input.nearby.lng}`,
    `radius=${input.nearby.radiusKm}`,
    `page=${input.currentPage}`,
    `size=${input.pageSize}`,
  ].join(":");
}

export function getAbandonmentRequestKey(input: AbandonmentRequestKeyInput): string {
  return [
    "abandonment",
    `status=${input.noticeStatus}`,
    `type=${input.animalType}`,
    `sido=${input.uprCd}`,
    `sigungu=${input.orgCd}`,
    `page=${input.currentPage}`,
    `size=${input.pageSize}`,
  ].join(":");
}

export function toLostSeed(
  source: FeedSource<LostPetSummary>,
): HomeListSeed<LostPetSummary> | undefined {
  return source.status === "success"
    ? { requestKey: HOME_LOST_REQUEST_KEY, data: source.data }
    : undefined;
}

export function toAbandonmentSeed(
  source: FeedSource<AbandonedAnimalSummary>,
): HomeListSeed<AbandonedAnimalSummary> | undefined {
  return source.status === "success"
    ? { requestKey: HOME_ABANDONMENT_REQUEST_KEY, data: source.data }
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPagePayload<T>(value: unknown): value is PagePayload<T> {
  if (!isRecord(value)) return false;

  return (
    Array.isArray(value.contents) &&
    typeof value.totalCount === "number" &&
    Number.isFinite(value.totalCount) &&
    Number.isInteger(value.totalCount) &&
    value.totalCount >= 0 &&
    typeof value.hasNextPage === "boolean"
  );
}

export function parsePagePayload<T>(body: unknown): PagePayload<T> {
  if (!isRecord(body) || body.success !== true || !isPagePayload<T>(body.data)) {
    throw new Error("Invalid public page response");
  }

  return body.data;
}

function trimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function toLostMarqueeItem(item: LostPetSummary): MarqueeItem | null {
  if (!isRecord(item)) return null;

  const id = trimmed(item.id);
  const title = trimmed(item.title);
  const status = item.missingAnimalStatus;

  if (!id || !title || (status !== "SEARCHING" && status !== "SEEN")) {
    return null;
  }

  return {
    key: `lost:${id}`,
    kind: status,
    href: `/lost/${encodeURIComponent(id)}`,
    title,
    place: trimmed(item.place),
    occurredAt: trimmed(item.time),
    dateFormat: "iso",
    thumbnail: trimmed(item.thumbnail),
  };
}

function toAbandonmentMarqueeItem(item: AbandonedAnimalSummary): MarqueeItem | null {
  if (!isRecord(item)) return null;

  const id = trimmed(item.desertionNo);
  const title = trimmed(item.kindCd);

  if (!id || !title || item.noticeClosed === true) return null;

  return {
    key: `abandoned:${id}`,
    kind: "PROTECTED",
    href: `/abandonment/${encodeURIComponent(id)}`,
    title,
    place: trimmed(item.happenPlace),
    occurredAt: trimmed(item.happenDt),
    dateFormat: "yyyymmdd",
    thumbnail: trimmed(item.popfile),
  };
}

function itemsFromSource<T>(
  source: FeedSource<T>,
  normalize: (item: T) => MarqueeItem | null,
): MarqueeItem[] {
  if (source.status !== "success") return [];

  const items: MarqueeItem[] = [];
  for (const item of source.data.contents) {
    const normalized = normalize(item);
    if (normalized) items.push(normalized);
  }
  return items;
}

export function toMarqueeItems(
  snapshot: HomeFeedSnapshot,
  limit = 8,
): MarqueeItem[] {
  const boundedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0;
  if (boundedLimit === 0) return [];

  const lostItems = itemsFromSource(snapshot.lost, toLostMarqueeItem);
  const abandonmentItems = itemsFromSource(
    snapshot.abandonment,
    toAbandonmentMarqueeItem,
  );
  const result: MarqueeItem[] = [];
  let lostIndex = 0;
  let abandonmentIndex = 0;

  while (
    result.length < boundedLimit &&
    (lostIndex < lostItems.length || abandonmentIndex < abandonmentItems.length)
  ) {
    if (lostIndex < lostItems.length) result.push(lostItems[lostIndex++]);
    if (result.length >= boundedLimit) break;
    if (abandonmentIndex < abandonmentItems.length) {
      result.push(abandonmentItems[abandonmentIndex++]);
    }
  }

  return result;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function formatDateParts(year: string, month: string, day: string): string | null {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const parsedDay = Number(day);

  if (
    parsedMonth < 1 ||
    parsedMonth > 12 ||
    parsedDay < 1 ||
    parsedDay > daysInMonth(parsedYear, parsedMonth)
  ) {
    return null;
  }

  return `${year}.${month}.${day}`;
}

export function formatMarqueeDate(
  value: string | null | undefined,
  format: MarqueeItem["dateFormat"],
): string | null {
  if (typeof value !== "string") return null;

  const match =
    format === "iso"
      ? /^(\d{4})-(\d{2})-(\d{2})(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?)?$/.exec(
          value,
        )
      : /^(\d{4})(\d{2})(\d{2})$/.exec(value);

  if (!match) return null;
  return formatDateParts(match[1], match[2], match[3]);
}
