export type PurposeCategoryAvailability = "available" | "planned";

export interface PurposeCategory {
  id: "abandonment" | "lost" | "shelters" | "adoption-wanted" | "adoption-offer";
  label: string;
  description: string;
  href: string;
  availability: PurposeCategoryAvailability;
}

export const PURPOSE_CATEGORIES: readonly PurposeCategory[] = [
  {
    id: "abandonment",
    label: "보호소에서 가족을 기다려요",
    description: "전국 보호소의 보호 동물을 확인해요",
    href: "/abandonment",
    availability: "available",
  },
  {
    id: "lost",
    label: "집을 잃었어요",
    description: "가족이 찾고 있는 반려동물을 살펴봐요",
    href: "/lost",
    availability: "available",
  },
  {
    id: "shelters",
    label: "우리집 근처 보호소",
    description: "가까운 보호소 정보를 찾아봐요",
    href: "/shelters",
    availability: "planned",
  },
  {
    id: "adoption-wanted",
    label: "반려동물을 입양하고 싶어요",
    description: "입양을 원하는 마음을 나눠요",
    href: "/adoption/wanted",
    availability: "planned",
  },
  {
    id: "adoption-offer",
    label: "반려동물의 새 가족을 찾아요",
    description: "새 가족이 필요한 반려동물을 알려요",
    href: "/adoption/offer",
    availability: "planned",
  },
];
