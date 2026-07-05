import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import hero from "@/static/image/guide.jpg";
import guide_2 from "@/static/image/guide_2.png";
import guide_3 from "@/static/image/guide_3.png";
import guide_4 from "@/static/image/guide_4.png";
import guide_5 from "@/static/image/guide_5.png";
import guide_8 from "@/static/image/guide_8.jpg";
import guide_9 from "@/static/image/guide_9.jpg";
import FlyerButton from "./FlyerButton";

const GUIDE_URL = "https://findmypet.platformholder.site/guide";
const GUIDE_TITLE = "반려동물 실종 시 대처법 — 실종동물 찾는법 단계별 가이드";
const GUIDE_DESC =
  "강아지·고양이를 잃어버렸을 때 가장 먼저 할 일부터 전단지 제작, 경찰·119 신고, 동물보호관리시스템·포인핸드·당근마켓 활용까지 실종동물 찾는법을 단계별로 정리했습니다.";

export const metadata: Metadata = {
  title: `${GUIDE_TITLE} | 파인드마이펫`,
  description: GUIDE_DESC,
  alternates: { canonical: GUIDE_URL },
  openGraph: {
    type: "article",
    url: GUIDE_URL,
    siteName: "파인드마이펫",
    locale: "ko_KR",
    title: GUIDE_TITLE,
    description: GUIDE_DESC,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "반려동물 실종 대처 가이드" }],
  },
  twitter: {
    card: "summary_large_image",
    title: GUIDE_TITLE,
    description: GUIDE_DESC,
    images: ["/og.jpg"],
  },
};

// HowTo 구조화 데이터 — 검색/생성형엔진이 "실종동물 찾는법" 단계를 인용 가능한 형태로 인식.
const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "반려동물 실종 시 대처법 (실종동물 찾는법)",
  description: GUIDE_DESC,
  inLanguage: "ko-KR",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "실종 장소 주변 집중 수색",
      text: "실종 장소 주변을 조용하고 신속하게 수색하고, 한 명이 차분히 이름을 부릅니다. 보호자 체취가 묻은 옷·담요를 여러 곳에 두어 반려견이 멀리 가지 않고 머물도록 합니다.",
      url: `${GUIDE_URL}#수색`,
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "실종 전단지 제작·배포",
      text: "사진, 이름, 나이, 성별, 품종, 실종 장소·시간, 보호자 연락처, 사례금을 담은 전단지를 만들어 상점·공원·산책로·동물병원 등에 배포합니다.",
      url: `${GUIDE_URL}#전단지`,
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "동물병원에 정보 전달",
      text: "근처 동물병원에 실종 사실과 특징을 알려 발견 시 보호자에게 연락이 가도록 합니다.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "경찰서·119 신고",
      text: "실종된 동물의 위치와 특징, 보호자 연락처를 상세히 신고합니다.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "SNS·온라인 커뮤니티 활용",
      text: "인스타그램, 당근마켓, 포인핸드, 동물보호관리시스템, 지해피독 등에 실종 사실을 게시해 목격 정보를 실시간으로 받습니다.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "국가동물보호정보시스템 신고",
      text: "보호소로 인계될 경우 연락받을 수 있도록 국가동물보호정보시스템에 실종 신고를 등록합니다.",
    },
    {
      "@type": "HowToStep",
      position: 7,
      name: "온·오프라인 보호소 확인",
      text: "지역 및 인근 시·군 보호소를 직접 방문하거나 온라인으로 주기적으로 확인합니다. 보호 기간이 제한적이므로 실종 초기에 적극적으로 확인합니다.",
    },
  ],
};

// FAQ 구조화 데이터 — 질문형 질의에 직접 답하도록.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "ko-KR",
  mainEntity: [
    {
      "@type": "Question",
      name: "반려동물을 잃어버렸을 때 가장 먼저 해야 할 일은?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "실종 장소 주변을 조용하고 신속하게 수색하세요. 반려동물은 두려움에 가까운 곳에 숨어 있는 경우가 많습니다. 보호자 체취가 묻은 옷이나 담요를 실종 장소에 두면 멀리 가지 않고 머무는 데 도움이 됩니다.",
      },
    },
    {
      "@type": "Question",
      name: "실종 전단지에 꼭 들어가야 하는 정보는?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "강아지의 사진, 이름, 나이, 성별, 품종, 실종 장소, 실종 시간, 보호자 연락처, 사례금을 포함하세요. 최근에 찍은 사진을 사용하면 식별에 효과적입니다.",
      },
    },
    {
      "@type": "Question",
      name: "어디에 실종 신고를 해야 하나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "경찰서와 119에 유실물로 신고하고, 동물보호관리시스템·국가동물보호정보시스템에 등록하세요. 포인핸드, 당근마켓, 지해피독 오픈채팅 등 커뮤니티에도 게시하면 목격 정보를 빠르게 받을 수 있습니다.",
      },
    },
    {
      "@type": "Question",
      name: "강아지가 보호소에 있을 수도 있나요?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "네. 발견자가 보호소나 동물병원에 인계하는 경우가 많습니다. 국가동물보호정보시스템에 실종 신고를 등록하고, 지역 및 인근 시·군 보호소를 주기적으로 확인하세요. 보호소는 보호 기간이 제한적이므로 실종 초기에 적극적으로 확인해야 합니다.",
      },
    },
  ],
};

export default function Guide() {
  return (
    <div className="flex w-full h-full justify-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="sm:w-[70%] h-full flex flex-col items-center my-6">
        <Image src={hero} alt="강아지 사진" width={700} height={500} className="rounded-md my-10" />
        <h1 className="font-bold sm:text-5xl text-4xl mb-10">반려견 실종 시 가이드라인</h1>
        <div>
          소중한 반려견을 잃어버리게 되면 불안과 걱정이 앞서기 마련입니다. <br />
          이러한 상황에서 빠르고 체계적인 대처가 매우 중요한데요, 반려동물 실종 시 행동 요령을 순서대로 정리했습니다.
          <h2 id="수색" className="font-bold text-2xl mt-8">실종장소 주변 집중 수색하기</h2>
          반려견이 실종되었다면, 가장 먼저 실종 장소 주변을 빠르게 수색하는 것이 필수적입니다. <br />
          주변을 탐색할 때는 조용하고 신속하게 접근해야 반려견이 놀라지 않습니다.<br /><br />
          <b>1️⃣ 강아지 이름 부르기:</b> 반려견은 두려움에 몸을 숨길 가능성이 높기 때문에 보호자의 목소리를 듣고 반응할 수 있습니다. <br /> 여러 사람이 동시에 부르면 혼란스러울 수 있으므로, 한 명이 조용하고 차분하게 이름을 부르는 것이 좋습니다. <br /> 만약 주 보호자가 없는 상황이라면, 보호자의 목소리를 녹음하여 반복 재생해 반려견이 소리를 듣고 나올 수 있도록 유도하는 것도 효과적입니다.<br /> <br />
          <b>2️⃣ 보호자 체취가 묻은 옷 두기:</b> 보호자의 체취가 묻은 옷가지를 실종 장소에 두는 것은 반려견이 멀리 가지 않고 머무르게 하는 좋은 방법입니다. 여러 곳에 옷을 배치하면 반려견의 행동 반경을 제한하는 효과도 있어 실종 지역을 좁히는 데 도움이 됩니다. 반려견이 맡기 좋아하는 담요나 장난감을 함께 두는 것도 효과적일 수 있습니다.
          <div id="전단지" className="flex items-center gap-6 mt-8 mb-2">
            <h2 className="font-bold text-2xl">실종 전단지 제작 및 배포</h2>
            <FlyerButton />
          </div>
          주변의 도움을 받기 위해 강아지의 전단지를 빠르게 제작하고 배포하세요.<br />
          <b>1️⃣ 전단지 필수 정보:</b> 전단지에는 강아지의 사진, 이름, 나이, 성별, 품종, 실종 장소, 실종 시간, 보호자 연락처, 사례금을 포함해야 합니다. 특히 최근에 찍은 사진을 사용하면 실종 당시 강아지의 모습을 보다 명확하게 전달할 수 있습니다.<br /><br />
          <b>2️⃣ 전단지 배포 범위:</b> 전단지는 실종 장소 주변 상점, 공원, 산책로, 동물 병원 등 사람들이 자주 다니는 곳에 부착하면 효과적입니다. 지역 커뮤니티와 주민 센터에 배포 요청을 하거나, 이웃들에게도 전단지를 나눠주어 강아지에 대한 정보가 널리 퍼지도록 도와주세요.
          동물 병원에 미리 상황을 알리면 병원을 찾은 강아지와 빠르게 연결될 가능성이 생깁니다. <br /><br />
          <b>병원에 정보 전달:</b> 근처 동물 병원에 연락해 강아지의 실종 사실과 특징을 전달하세요. 병원은 강아지를 발견한 사람이 맡길 수 있는 대표적인 장소이므로, 실종 정보를 미리 공유해 두면 병원에서 보호자에게 연락할 가능성이 높아집니다.
          <h2 className="font-bold text-2xl mt-8">경찰서 및 119에 신고하기</h2>
          경찰서와 119는 유실물 신고를 받을 수 있으며, 강아지가 발견될 경우 보호자와 연결될 수 있습니다. <br />
          <b>신고 정보:</b> 실종된 강아지의 위치와 특징, 보호자 연락처를 상세하게 전달하세요. 경찰서나 119에 실종 사실을 신고하면 지역 내에서 강아지가 발견될 경우 보호자에게 신속히 연락할 수 있습니다. 또한, 교통사고 등의 위험 상황에서 반려견을 보호하는 데에도 도움을 받을 수 있습니다.

          <h2 className="font-bold text-2xl mt-8">SNS와 온라인 커뮤니티 활용하기</h2>
          SNS와 지역 커뮤니티는 빠르게 정보를 전파하고, 실시간으로 반려견의 위치 정보를 받을 수 있는 유용한 수단입니다. <br />
          인스타그램, 당근마켓, 포인핸드, 동물보호관리시스템, 지해피독 등의 플랫폼에 실종 사실을 게시하세요. 강아지 실종 정보가 널리 퍼지도록 돕고, 사람들의 댓글을 통해 목격 정보를 실시간으로 받을 수 있습니다. 온라인에서 목격 정보가 올라올 경우 빠르게 대응할 수 있도록 알림을 설정해 두는 것도 좋습니다.<br />
          <br />
          <div className="text-xl my-4 font-bold">실종 신고가 가능한 주요 페이지</div>
          <div className="w-full p-2 rounded-md bg-gray-100 font-bold my-4 flex justify-between items-center">
            <div>1️⃣ 지해피독 오픈채팅</div>
            <Button size="sm"><Link target="_blank" href="https://open.kakao.com/o/gx9oEgcf"><LinkIcon size="16" /></Link></Button>
          </div>
          <div className="border-l-2 border-gray-500 flex items-center p-2 text-sm">지해피독은 유실동물 구조 봉사모임입니다. 금전적인 요구를 하지 않으며, 실종 동물 구조에 함께 동참합니다.</div>
          <div className="sm:flex justify-between">
            <Image src={guide_8} alt="포인핸드 실종신고 글쓰기" width={400} height={600} className="rounded-md my-10" />
            <Image src={guide_9} alt="포인핸드 실종신고 글쓰기" width={400} height={600} className="rounded-md my-10" />
          </div>
          <div className="w-full p-2 rounded-md bg-gray-100 font-bold my-4 flex justify-between items-center">
            <div>2️⃣ 포인핸드 앱 - 실종/제보</div>
            <Button size="sm"><Link target="_blank" href="https://pawinhand.kr/"><LinkIcon size="16" /></Link></Button>
          </div>

          <div className="border-l-2 border-gray-500 flex items-center p-2 text-sm">포인핸드는 전국 보호소 유기동물, 실종동물 게시글을 통해 가족을 찾아주는 플랫폼 서비스입니다.<br />게시글 등록: 하단의 실종/제보 선택 - 글쓰기</div>
          <Image src={guide_2} alt="포인핸드 실종신고 글쓰기" width={400} height={600} className="rounded-md my-10" />
          <div className="w-full p-2 rounded-md bg-gray-100 font-bold my-4 flex justify-between items-center">
            <div>3️⃣ 당근마켓 앱 - 분실/실종</div>
            <Button size="sm"><Link target="_blank" href="https://www.daangn.com/kr"><LinkIcon size="16" /></Link></Button>
          </div>
          <div className="border-l-2 border-gray-500 flex items-center p-2 text-sm">대한민국 대표적인 지역생활 어플리케이션으로 동네 이웃분들의 실종동물 목격 게시글을 확인할 수 있습니다. <br />게시글 등록: 하단의 동네생활 선택 - 탭 - 반려동물 - 글쓰기</div>
          <Image src={guide_3} alt="당근마켓 실종신고 글쓰기" width={800} height={600} className="rounded-md my-10 object-fit" />


          <div className="w-full p-2 rounded-md bg-gray-100 font-bold my-4 flex justify-between items-center">
            <div>4️⃣ 동물보호관리시스템</div>
            <Button size="sm"><Link target="_blank" href="https://www.animal.go.kr/front/awtis/public/publicList.do?menuNo=1000000055"><LinkIcon size="16" /></Link></Button>
          </div>
          <div className="border-l-2 border-gray-500 flex items-center p-2 text-sm">반려동물 등록관리, 유기동물 정보제공, 동물보호센터 정보 등 다양한 정보 확인 가능<br />게시글 등록: 구조동물 - 동물분실 정보 공유게시판 - 게시글 작성</div>
          <Image src={guide_4} alt="동물보호관리시스템 실종신고 글쓰기" width={800} height={600} className="rounded-md my-10" />
          <Image src={guide_5} alt="동물보호관리시스템 실종신고 글쓰기" width={800} height={600} className="rounded-md my-10" />
          <h2 className="font-bold text-2xl mt-8">국가동물보호정보시스템에 신고하기</h2>
          국가동물보호정보시스템은 모든 보호소와 유기견 센터가 관리하는 종합 시스템으로, 실종 신고를 해 두면 반려견을 찾는 데 큰 도움이 됩니다.
          만약 누군가가 실종된 강아지를 발견해 보호소에 인계했다면, 국가동물보호정보시스템에 등록된 정보가 바탕이 되어 보호소로부터 연락을 받을 수 있습니다. 보호소로 이동된 반려견은 해당 시스템에 기록되므로, 꼭 실종 신고를 해 두세요.


          <h2 className="font-bold text-2xl mt-8">온오프라인 보호소 확인하기</h2>
          실종된 강아지가 보호소에 맡겨졌을 가능성을 염두에 두고 지역 보호소를 직접 방문하거나 온라인으로 주기적으로 확인하는 것이 중요합니다.
          보호소는 강아지가 안전하게 보호될 수 있는 장소이므로, 반려견이 보호소에 있는지 주기적으로 확인하세요. 특히, 보호소는 일정 기간 동안만 반려동물을 보호할 수 있는 경우가 많기 때문에 실종 초기에 더욱 적극적으로 방문하고 확인하는 것이 중요합니다. 지역 보호소는 물론, 가까운 시·군의 보호소까지 범위를 넓혀 확인해 보세요.
          <br />
          <br />
          <br />
          <div className="p-6 bg-gray-100 rounded-md mb-10">
            <p>강아지를 잃어버린 상황에서 신속하게 행동하면 반려견을 찾을 가능성이 훨씬 높아집니다. 평소에도 실종에 대비해 강아지의 현재 위치를 확인할 수 있는 GPS 기기를 착용하게 하거나, 반려동물 등록제에 가입하여 관리하는 것이 안전한 방법입니다. 또한, 반려견이 실종되지 않도록 목줄을 잘 챙기고, 외출 시 환경을 주의하는 것이 반려견의 안전을 지키는 중요한 방법임을 잊지 마세요.</p>
          </div>

          <div className="rounded-md border p-4 text-sm mb-10">
            <p className="font-bold">더 찾아보기</p>
            <p className="mt-1">
              보호 공고 기간·동물등록·입양 절차 등 제도가 궁금하다면{" "}
              <Link href="/faq" className="underline">자주 묻는 질문</Link>,
              우리 동네 보호소에 들어온 아이들은{" "}
              <Link href="/abandonment/region" className="underline">지역별 유기동물 보호 공고</Link>
              에서 확인하세요.
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
