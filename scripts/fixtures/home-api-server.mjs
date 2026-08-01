import http from "node:http";

const HOST = "127.0.0.1";
const PORT = 4311;
const APP_ORIGIN = "http://127.0.0.1:4310";
const SCENARIOS = new Set(["default", "one-source-fails", "all-fail", "short"]);
const TRACKED_ROUTES = [
  "/api/v1/posts",
  "/api/v1/posts/nearby",
  "/api/v1/abandoned-animals",
  "/api/v1/abandoned-animals/sido",
  "/api/v1/user/me",
];

const lostPosts = [
  {
    id: "e2e-lost-searching-dog",
    author: "E2E 작성자 1",
    title: "E2E 찾는 중 강아지",
    description: "E2E 실종 소식 설명 1",
    gratuity: 10000,
    place: "E2E 서울 중구",
    time: "2026-07-30T09:00:00+09:00",
    thumbnail: null,
    missingAnimalStatus: "SEARCHING",
    animalType: "DOG",
    breedId: "e2e-breed-dog",
  },
  {
    id: "e2e-lost-seen-cat",
    author: "E2E 작성자 2",
    title: "E2E 목격 고양이",
    description: "E2E 목격 소식 설명 2",
    gratuity: 0,
    place: "E2E 서울 종로구",
    time: "2026-07-29T13:30:00+09:00",
    thumbnail: null,
    missingAnimalStatus: "SEEN",
    animalType: "CAT",
    breedId: "e2e-breed-cat",
  },
  {
    id: "e2e-lost-found-dog",
    author: "E2E 작성자 3",
    title: "E2E 가족을 찾은 강아지",
    description: "E2E 완료 소식 설명 3",
    gratuity: 0,
    place: "E2E 서울 용산구",
    time: "2026-07-28T16:00:00+09:00",
    thumbnail: null,
    missingAnimalStatus: "FOUND",
    animalType: "DOG",
    breedId: "e2e-breed-dog",
  },
  {
    id: "e2e-lost-searching-other",
    author: "E2E 작성자 4",
    title: "E2E 찾는 중 기타 동물",
    description: "E2E 실종 소식 설명 4",
    gratuity: 20000,
    place: "E2E 서울 마포구",
    time: "2026-07-27T11:15:00+09:00",
    thumbnail: null,
    missingAnimalStatus: "SEARCHING",
    animalType: "OTHER",
    breedId: null,
  },
  {
    id: "e2e-lost-seen-dog",
    author: "E2E 작성자 5",
    title: "E2E 목격 강아지",
    description: "E2E 목격 소식 설명 5",
    gratuity: 0,
    place: "E2E 서울 성동구",
    time: "2026-07-26T08:45:00+09:00",
    thumbnail: null,
    missingAnimalStatus: "SEEN",
    animalType: "DOG",
    breedId: "e2e-breed-dog",
  },
];

const abandonmentPosts = Array.from({ length: 4 }, (_, index) => {
  const number = index + 1;
  return {
    desertionNo: `e2e-abandoned-${number}`,
    filename: null,
    popfile: null,
    kindCd: `[E2E 품종 ${number}]`,
    sexCd: number % 2 === 0 ? "F" : "M",
    age: `202${number}년생(E2E)`,
    weight: `${number + 2}(Kg) E2E`,
    specialMark: `E2E 특징 ${number}`,
    happenPlace: `E2E 보호 장소 ${number}`,
    happenDt: `2026072${number}`,
    careNm: `E2E 보호소 ${number}`,
    careTel: `E2E-전화-${number}`,
    careAddr: `E2E 보호소 주소 ${number}`,
    processState: "보호중",
    noticeNo: `E2E-공고-${number}`,
    noticeSdt: `2026072${number}`,
    noticeEdt: `2026080${number}`,
    effectiveNoticeEdt: `2026080${number}`,
    animalType: number % 2 === 0 ? "CAT" : "DOG",
    orgNm: `E2E 지자체 ${number}`,
    noticeClosed: false,
    noticeClosedAt: null,
  };
});

const nearbyPosts = [
  {
    ...lostPosts[0],
    id: "e2e-nearby-searching",
    title: "E2E 가까운 실종 강아지",
    lat: 37.5667,
    lng: 126.9782,
    distanceKm: 0.1,
  },
  {
    ...lostPosts[1],
    id: "e2e-nearby-seen",
    title: "E2E 가까운 목격 고양이",
    lat: 37.568,
    lng: 126.98,
    distanceKm: 0.4,
  },
  {
    ...lostPosts[2],
    id: "e2e-nearby-found",
    title: "E2E 제외된 발견 강아지",
    lat: 37.57,
    lng: 126.982,
    distanceKm: 0.8,
  },
];

let scenario = "default";
let requestState = createRequestState();

function createRequestState() {
  return {
    counts: Object.fromEntries(TRACKED_ROUTES.map((route) => [route, 0])),
    queries: Object.fromEntries(TRACKED_ROUTES.map((route) => [route, []])),
  };
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": APP_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

function sendNoContent(response) {
  response.writeHead(204, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end();
}

function pageEnvelope(contents) {
  return {
    success: true,
    data: { contents, totalCount: contents.length, hasNextPage: false },
  };
}

function queryRecord(url) {
  return Object.fromEntries(url.searchParams.entries());
}

function recordRequest(pathname, url) {
  requestState.counts[pathname] += 1;
  requestState.queries[pathname].push(queryRecord(url));
}

function hasExactQuery(url, expected) {
  const actual = queryRecord(url);
  const actualEntryCount = Array.from(url.searchParams.entries()).length;
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  return (
    actualEntryCount === expectedKeys.length &&
    JSON.stringify(actualKeys) === JSON.stringify(expectedKeys) &&
    expectedKeys.every((key) => actual[key] === expected[key])
  );
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) throw new Error("missing body");
  return JSON.parse(text);
}

function homeSourceFails(pathname) {
  if (pathname === "/api/v1/posts") {
    return scenario === "one-source-fails" || scenario === "all-fail";
  }
  return pathname === "/api/v1/abandoned-animals" && scenario === "all-fail";
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
  const { pathname } = url;

  if (request.method === "OPTIONS") {
    sendNoContent(response);
    return;
  }

  if (request.method === "GET" && pathname === "/__health") {
    sendJson(response, 200, { success: true });
    return;
  }

  if (request.method === "POST" && pathname === "/__scenario") {
    let body;
    try {
      body = await readJsonBody(request);
    } catch {
      sendJson(response, 400, { success: false, error: "invalid-json" });
      return;
    }
    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body) ||
      !SCENARIOS.has(body.scenario)
    ) {
      sendJson(response, 422, { success: false, error: "invalid-scenario" });
      return;
    }
    scenario = body.scenario;
    requestState = createRequestState();
    sendJson(response, 200, { success: true, scenario });
    return;
  }

  if (request.method === "GET" && pathname === "/__requests") {
    sendJson(response, 200, {
      scenario,
      counts: requestState.counts,
      queries: requestState.queries,
    });
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/posts/nearby") {
    recordRequest(pathname, url);
    const latValue = url.searchParams.get("lat");
    const lngValue = url.searchParams.get("lng");
    const lat = Number(latValue);
    const lng = Number(lngValue);
    const exactStaticValues = hasExactQuery(url, {
      lat: latValue ?? "",
      lng: lngValue ?? "",
      radiusKm: "3",
      pageSize: "20",
      pageOffset: "0",
    });
    if (
      latValue === null ||
      latValue.trim() === "" ||
      lngValue === null ||
      lngValue.trim() === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      !exactStaticValues
    ) {
      sendJson(response, 400, { success: false, error: "invalid-nearby-query" });
      return;
    }
    sendJson(response, 200, pageEnvelope(nearbyPosts));
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/posts") {
    recordRequest(pathname, url);
    if (!hasExactQuery(url, { pageSize: "5", pageOffset: "0", orderBy: "CREATED_AT_DESC" })) {
      sendJson(response, 400, { success: false, error: "invalid-posts-query" });
      return;
    }
    if (homeSourceFails(pathname)) {
      sendJson(response, 503, { success: false, error: "scenario-failure" });
      return;
    }
    const contents = scenario === "short" ? [lostPosts[0]] : lostPosts;
    sendJson(response, 200, pageEnvelope(contents));
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/abandoned-animals") {
    recordRequest(pathname, url);
    if (!hasExactQuery(url, { pageNo: "1", numOfRows: "20", noticeStatus: "OPEN" })) {
      sendJson(response, 400, { success: false, error: "invalid-abandonment-query" });
      return;
    }
    if (homeSourceFails(pathname)) {
      sendJson(response, 503, { success: false, error: "scenario-failure" });
      return;
    }
    const contents = scenario === "short" ? [] : abandonmentPosts;
    sendJson(response, 200, pageEnvelope(contents));
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/abandoned-animals/sido") {
    recordRequest(pathname, url);
    if (!hasExactQuery(url, {})) {
      sendJson(response, 400, { success: false, error: "invalid-sido-query" });
      return;
    }
    sendJson(response, 200, { success: true, data: [] });
    return;
  }

  if (request.method === "GET" && pathname === "/api/v1/user/me") {
    recordRequest(pathname, url);
    if (!hasExactQuery(url, {})) {
      sendJson(response, 400, { success: false, error: "invalid-user-query" });
      return;
    }
    sendJson(response, 401, { success: false, error: "unauthorized" });
    return;
  }

  if (request.method !== "GET" && request.method !== "POST") {
    sendJson(response, 405, { success: false, error: "method-not-allowed" });
    return;
  }
  sendJson(response, 404, { success: false, error: "not-found" });
});

function closeServer() {
  server.close(() => process.exit(0));
}

server.on("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
server.listen(PORT, HOST);
process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
