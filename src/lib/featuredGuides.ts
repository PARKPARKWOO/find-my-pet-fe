export interface FeaturedGuide {
  id: "lost-first-steps" | "shelter-return" | "adoption-process" | "missing-prevention";
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}

export const FEATURED_GUIDES: readonly FeaturedGuide[] = [
  {
    id: "lost-first-steps",
    title: "반려동물을 잃어버렸을 때",
    description: "주변 수색부터 신고와 전단지까지, 먼저 할 일을 순서대로 확인해요.",
    href: "/guide#수색",
    linkLabel: "첫 수색 순서 보기",
  },
  {
    id: "shelter-return",
    title: "보호소에서 내 아이를 찾았을 때",
    description: "확인 자료를 준비하고 보호소에 연락한 뒤 안전하게 데려오는 방법을 알아봐요.",
    href: "/faq#shelter-return",
    linkLabel: "반환 절차 보기",
  },
  {
    id: "adoption-process",
    title: "보호소에서 입양을 준비할 때",
    description: "상담, 교육, 신청처럼 지역마다 달라질 수 있는 과정을 미리 살펴봐요.",
    href: "/faq#adoption-process",
    linkLabel: "입양 과정 보기",
  },
  {
    id: "missing-prevention",
    title: "산책과 생활에서 실종을 예방할 때",
    description: "갑자기 달아나는 이유와 산책 전에 확인할 생활 습관을 정리했어요.",
    href: "/posts/dog-escape-while-walking",
    linkLabel: "예방 방법 보기",
  },
];

interface FaqLink {
  href: string;
  label: string;
}

export interface FaqEntry {
  id:
    | "shelter-check"
    | "notice-period"
    | "shelter-return"
    | "animal-registration"
    | "found-animal-report"
    | "after-notice"
    | "adoption-process"
    | "missing-report"
    | "data-source"
    | "search-radius";
  q: string;
  a: string;
  links?: readonly FaqLink[];
}

export const FAQ_ENTRIES: readonly FaqEntry[] = [
  {
    id: "shelter-check",
    q: "잃어버린 반려동물이 보호소에 있는지 어떻게 확인하나요?",
    a: "동물보호관리시스템의 보호 공고를 실종 지역과 인근 시군구까지 넓혀 매일 확인하는 것이 가장 확실합니다. 파인드마이펫의 지역별 보호 공고 페이지에서 시군구를 선택하면 해당 지역 공고와 보호소 연락처를 한 번에 볼 수 있고, 관심 지역을 구독하면 새 공고가 등록될 때 알림을 받을 수 있습니다.",
    links: [
      { href: "/abandonment/region", label: "지역별 보호 공고" },
      { href: "/guide", label: "실종동물 찾는법 가이드" },
    ],
  },
  {
    id: "notice-period",
    q: "유기동물 보호 공고 기간은 얼마나 되나요?",
    a: "동물보호법에 따른 보호 공고 기간은 7일 이상입니다. 이 최소 공고 기간과 소유권 이전 시점은 서로 다르며, 공고일부터 10일이 지나도 소유자를 알 수 없을 때 해당 동물의 소유권을 지자체가 취득할 수 있습니다. 보호자가 확인되면 반환 절차를 문의하세요.",
  },
  {
    id: "shelter-return",
    q: "보호소에 있는 내 아이를 찾았어요. 바로 데려올 수 있나요?",
    a: "소유자임을 확인할 수 있으면 반환받을 수 있습니다. 신분증과 함께 동물등록 정보, 사진, 특징 설명 등 소유자임을 증명할 자료를 준비해 보호소에 연락한 뒤 방문하세요. 지자체에 따라 보호 기간 동안의 사육·치료 비용이 청구될 수 있습니다.",
  },
  {
    id: "animal-registration",
    q: "동물등록은 의무인가요?",
    a: "네, 주택 등에서 기르는 2개월령 이상의 개는 동물등록이 법적 의무입니다. 내장형 칩으로 등록하면 보호소 입소 시 스캔만으로 보호자를 찾을 수 있어 반환 확률이 크게 올라갑니다. 소유자나 주소·전화번호가 바뀌면 변경 신고도 해야 합니다.",
  },
  {
    id: "found-animal-report",
    q: "길에서 헤매는 동물을 발견하면 어떻게 해야 하나요?",
    a: "임의로 데려가 기르지 말고 관할 시군구청 동물보호 부서나 지역 보호소에 신고하세요. 주인이 찾고 있는 반려동물일 수 있습니다. 목줄·인식표가 있다면 연락처를 확인하고, 파인드마이펫 실종 게시판에서 해당 지역 실종 신고를 검색해보는 것도 도움이 됩니다.",
    links: [{ href: "/", label: "실종 게시판" }],
  },
  {
    id: "after-notice",
    q: "공고 기간이 끝난 유기동물은 어떻게 되나요?",
    a: "공고가 끝났다고 곧바로 소유권이 이전되는 것은 아닙니다. 공고일부터 10일이 지나도 소유자를 알 수 없는 경우 지자체가 해당 동물의 소유권을 취득할 수 있고, 이후 보호·입양 절차는 지자체와 보호소 여건에 따라 달라집니다. 입양을 고려한다면 보호소에 현재 상태와 신청 가능 시점을 확인하세요.",
  },
  {
    id: "adoption-process",
    q: "유기동물 입양은 어떻게 하나요?",
    a: "보호 공고에서 마음에 드는 아이를 찾았다면 해당 보호소에 현재 상태와 입양 가능 시점을 먼저 확인하세요. 공고 종료만으로 바로 입양 가능한 것은 아니며, 지자체의 소유권 취득 여부와 보호소 절차에 따라 신청서 작성, 상담, 사전 교육 등이 필요할 수 있습니다. 일부 지자체는 입양비·중성화 지원금을 제공합니다.",
    links: [{ href: "/abandonment/region", label: "지역별 보호 공고에서 찾아보기" }],
  },
  {
    id: "missing-report",
    q: "실종 신고는 어디에 해야 하나요?",
    a: "관할 시군구청 동물보호 부서와 인근 보호소에 실종 사실을 알리고, 동물보호관리시스템 공고를 확인하세요. 병행해서 파인드마이펫에 실종 게시글을 등록하면 품종별 탐색 반경 지도와 전단지 템플릿, 목격 제보 기능을 활용할 수 있습니다.",
    links: [{ href: "/register", label: "실종 신고 등록" }],
  },
  {
    id: "data-source",
    q: "파인드마이펫의 보호 공고 데이터는 어디서 오나요?",
    a: "농림축산식품부 동물보호관리시스템 공공데이터를 매시간 동기화합니다. 보호 공고 목록은 진행 중인 공고(OPEN)를 기본으로 보여줍니다. 공고 종료(CLOSED)·전체 필터를 선택하면 종료 공고가 포함될 수 있다는 안내와 함께 다시 볼 수 있고, 통합검색에서는 ‘공고 종료’ 뱃지로 구분합니다. 공고 종료는 동물의 현재 보호·입양·반환 등 최종 상태를 뜻하지 않으므로, 현재 상태는 해당 보호소에 확인해 주세요.",
  },
  {
    id: "search-radius",
    q: "탐색 반경 지도는 어떤 원리인가요?",
    a: "실종 동물의 종·품종과 경과 시간을 바탕으로 통계 기반 탐색 반경을 계산해, 실제 도로망 기준 도달 가능 영역을 지도에 표시합니다. 강아지는 시간이 지날수록 반경이 넓어지고, 고양이는 대부분 실종 지점 근처에 숨어 있어 좁은 반경부터 수색하도록 안내합니다.",
    links: [{ href: "/guide", label: "가이드에서 자세히 보기" }],
  },
];
