import { parsePagePayload } from "./homeFeed";

export type NearbyPublicStatus = "SEARCHING" | "SEEN";

export interface NearbyPublicItem {
  id: string;
  href: `/lost/${string}`;
  title: string;
  place: string | null;
  missingAnimalStatus: NearbyPublicStatus;
  lat: number;
  lng: number;
  distanceKm: number;
}

export interface NearbyPublicResult {
  sourceItemCount: number;
  items: NearbyPublicItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function trimRequired(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized === "" ? null : normalized;
}

function trimOptional(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function inRange(value: unknown, minimum: number, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function normalizeItem(value: unknown): NearbyPublicItem | null {
  if (!isRecord(value)) return null;

  const id = trimRequired(value.id);
  const title = trimRequired(value.title);
  const status = value.missingAnimalStatus;
  if (
    !id ||
    !title ||
    (status !== "SEARCHING" && status !== "SEEN") ||
    !inRange(value.lat, -90, 90) ||
    !inRange(value.lng, -180, 180) ||
    !inRange(value.distanceKm, 0, Number.MAX_VALUE)
  ) {
    return null;
  }

  let encodedId: string;
  try {
    encodedId = encodeURIComponent(id);
  } catch {
    return null;
  }

  return {
    id,
    href: `/lost/${encodedId}`,
    title,
    place: trimOptional(value.place),
    missingAnimalStatus: status,
    lat: value.lat,
    lng: value.lng,
    distanceKm: value.distanceKm,
  };
}

export function normalizeNearbyResponse(body: unknown): NearbyPublicResult {
  const page = parsePagePayload<unknown>(body);
  const items: NearbyPublicItem[] = [];
  for (const sourceItem of page.contents) {
    const normalized = normalizeItem(sourceItem);
    if (normalized) items.push(normalized);
  }
  return { sourceItemCount: page.contents.length, items };
}

export function classifyGeolocationError(
  code: number,
): "permission-denied" | "position-unavailable-or-timeout" {
  return code === 1 ? "permission-denied" : "position-unavailable-or-timeout";
}
