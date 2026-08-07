import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalBullets as Bullets,
  LegalExternalLink as Ext,
  LegalSection as Section,
  LegalTable as Table,
  LegalToc,
} from "@/app/_components/legal/LegalDoc";

const SITE_DOMAIN = "https://findmypet.platformholder.site";
const PAGE_URL = `${SITE_DOMAIN}/terms`;
const TITLE = "이용약관";
const DESC =
  "파인드마이펫 서비스의 이용 조건, 이용자의 의무, 게시물과 연락처의 공개 범위, 공공데이터의 출처와 정확성, 광고 게재, 면책 사항을 안내합니다.";

/** 시행일. 약관을 고칠 때마다 이 값을 올리고 부칙에 이력을 한 줄 남긴다. */
const EFFECTIVE_DATE = "2026년 7월 26일";

/** 최초 제정일. 개정으로 시행일이 밀려도 "언제부터 있던 약관인가" 는 고정이라 따로 둔다. */
const ENACTED_DATE = "2026년 7월 26일";

export const metadata: Metadata = {
  title: `${TITLE} | 파인드마이펫`,
  description: DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "article",
    url: PAGE_URL,
    siteName: "파인드마이펫",
    locale: "ko_KR",
    title: TITLE,
    description: DESC,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: TITLE }],
  },
};

const TOC = [
  { id: "purpose", label: "제1조 목적" },
  { id: "definitions", label: "제2조 용어의 정의" },
  { id: "amend", label: "제3조 약관의 게시와 개정" },
  { id: "services", label: "제4조 서비스의 내용" },
  { id: "account", label: "제5조 이용계약의 성립과 계정" },
  { id: "termination", label: "제6조 이용계약의 해지" },
  { id: "duties", label: "제7조 이용자의 의무" },
  { id: "copyright", label: "제8조 게시물의 저작권과 이용 허락" },
  { id: "disclosure", label: "제9조 게시물의 공개 범위" },
  { id: "moderation", label: "제10조 게시물의 관리" },
  { id: "publicdata", label: "제11조 공공데이터의 제공과 정확성" },
  { id: "location", label: "제12조 위치정보의 이용" },
  { id: "ads", label: "제13조 광고의 게재" },
  { id: "availability", label: "제14조 서비스의 변경과 중단" },
  { id: "disclaimer", label: "제15조 면책" },
  { id: "jurisdiction", label: "제16조 준거법과 관할" },
];

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold">이용약관</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        이 약관은 파인드마이펫(이하 &ldquo;서비스&rdquo;)의 이용 조건과 절차, 이용자와 운영자의
        권리·의무를 정합니다. 서비스를 이용하시면 이 약관에 동의한 것으로 봅니다.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        시행일: {EFFECTIVE_DATE} (최초 제정일: {ENACTED_DATE})
      </p>

      <LegalToc items={TOC} />

      <Section id="purpose" no={1} title="목적">
        <p>
          이 약관은 파인드마이펫 운영자(이하 &ldquo;운영자&rdquo;)가 제공하는 실종·유기 반려동물
          정보 공유 서비스의 이용과 관련하여 운영자와 이용자의 권리, 의무 및 책임 사항을 규정하는
          것을 목적으로 합니다.
        </p>
      </Section>

      <Section id="definitions" no={2} title="용어의 정의">
        <Table
          head={["용어", "뜻"]}
          rows={[
            [
              "서비스",
              "운영자가 파인드마이펫이라는 이름으로 제공하는 웹사이트와 그에 부속된 모든 기능",
            ],
            ["이용자", "회원과 비회원을 포함해 서비스를 이용하는 모든 사람"],
            [
              "회원",
              "카카오 계정을 이용해 로그인한 이용자. 게시글 등록, 목격 제보, 즐겨찾기, 관심 지역 구독을 이용할 수 있습니다.",
            ],
            ["비회원", "로그인하지 않고 서비스를 이용하는 사람"],
            [
              "게시물",
              "이용자가 서비스에 등록한 실종 신고 게시글, 목격 제보, 사진, 전단지 부착 위치 등 일체의 정보",
            ],
            [
              "보호 공고",
              "운영자가 공공데이터를 통해 제공받아 서비스에 표시하는 유기동물 보호 공고 정보",
            ],
          ]}
          minWidth={480}
        />
      </Section>

      <Section id="amend" no={3} title="약관의 게시와 개정">
        <Bullets
          items={[
            "이 약관은 서비스 하단의 링크를 통해 언제든지 확인할 수 있습니다.",
            "운영자는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있습니다.",
            "약관을 개정하는 경우 적용일자와 개정 사유를 명시하여 적용일 7일 전부터 서비스 내에 공지하며, 이용자에게 불리한 개정은 30일 전부터 공지합니다.",
            "이용자가 개정 약관에 동의하지 않는 경우 서비스 이용을 중단하고 제6조에 따라 이용계약을 해지할 수 있습니다.",
          ]}
        />
      </Section>

      <Section id="services" no={4} title="서비스의 내용">
        <p>운영자는 다음 기능을 제공하며, 모든 기능은 무료입니다.</p>
        <Bullets
          items={[
            "실종 반려동물 신고 게시판 — 게시글 등록·수정·삭제, 상태(실종중/찾음) 변경, 즐겨찾기",
            "목격 제보 — 실종 게시글에 목격 위치와 메모를 등록",
            "공공데이터 기반 유기동물 보호 공고 조회 — 전체 목록, 지역별 목록, 관심 지역의 신규 공고 알림",
            "탐색 반경·도보 도달범위 지도 — 실종 지점과 경과 시간을 바탕으로 수색 범위를 추정해 표시",
            "실종 전단지 제작·인쇄 도구 — 로그인 없이 이용 가능",
            "전단지 부착 위치 기록 — 본인이 부착한 전단지의 위치 관리",
            "실종·유기동물 대처 가이드와 자주 묻는 질문 등 정보 콘텐츠",
          ]}
        />
        <p>
          운영자는 서비스의 내용을 변경할 수 있으며, 이 경우 제14조에 따릅니다.
        </p>
      </Section>

      <Section id="account" no={5} title="이용계약의 성립과 계정">
        <Bullets
          items={[
            "서비스는 별도의 회원가입 양식을 두지 않으며, 이용자가 카카오 계정으로 로그인하면 이용계약이 성립합니다.",
            "보호 공고 조회, 실종 게시글 열람, 전단지 제작은 로그인 없이 이용할 수 있습니다.",
            "게시글 등록, 목격 제보, 즐겨찾기, 관심 지역 구독은 로그인이 필요합니다.",
            "계정은 본인만 이용할 수 있으며, 타인에게 양도하거나 대여할 수 없습니다.",
            "카카오 계정의 관리 책임은 이용자에게 있습니다. 계정이 도용된 것으로 의심되면 즉시 카카오에 조치를 취하고 운영자에게 알려 주십시오.",
          ]}
        />
      </Section>

      <Section id="termination" no={6} title="이용계약의 해지">
        <Bullets
          items={[
            <span key="t1">
              <b className="text-foreground">
                회원은 마이페이지 하단의 &lsquo;회원 탈퇴&rsquo;에서 언제든지 직접 이용계약을 해지할
                수 있습니다.
              </b>{" "}
              확인 화면에서 삭제될 항목의 건수를 확인한 뒤 확정하면 즉시 처리되며, 삭제된 데이터는
              복구할 수 없습니다.
            </span>,
            <span key="t2">
              탈퇴하면 회원이 등록한 실종 신고 게시글·사진·전단지 부착 위치·즐겨찾기·관심 지역
              구독·알림·후기가 함께 삭제되고, 다른 회원의 게시글에 남긴 목격 제보는 수색에 필요한
              위치와 시각만 남긴 채 익명 처리됩니다. 항목별 처리 방식은{" "}
              <Link href="/privacy#retention" className="underline underline-offset-2">
                개인정보 처리방침 제4조
              </Link>
              에 기재되어 있습니다.
            </span>,
            "탈퇴와 함께 카카오 로그인 연동 해제가 요청됩니다. 다만 같은 카카오 계정으로 운영자의 다른 서비스를 이용 중인 경우에는 파인드마이펫의 연결만 해제됩니다.",
            "로그아웃하면 인증 정보와 브라우저에 저장된 프로필 정보가 삭제되지만, 이는 탈퇴가 아닙니다.",
            <span key="t3">
              이용자가 등록한 게시물은 이용계약 해지와 별개로 언제든지 직접 삭제할 수 있습니다.
              탈퇴 후 데이터베이스에 삭제 표시와 함께 남아 있는 기록의 완전 삭제를 원하시는 경우{" "}
              <a href="mailto:wy9295@naver.com" className="underline underline-offset-2">
                wy9295@naver.com
              </a>
              으로 요청해 주시면 확인 후 처리합니다.
            </span>,
            "운영자는 이용자가 제7조를 위반한 경우 사전 통지 후 이용을 제한하거나 이용계약을 해지할 수 있습니다. 다만 긴급하게 조치할 필요가 있는 경우에는 조치 후 통지할 수 있습니다.",
          ]}
        />
      </Section>

      <Section id="duties" no={7} title="이용자의 의무">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <Bullets
          items={[
            "허위의 실종 정보나 목격 정보를 등록하는 행위",
            "타인의 반려동물 사진이나 다른 사이트의 게시물을 권한 없이 가져와 등록하는 행위",
            "타인의 전화번호 등 개인정보를 본인 동의 없이 게시하는 행위",
            "서비스에 공개된 연락처를 실종 동물을 찾는 목적 외의 용도(영업, 광고, 스팸 발송, 명단 수집 등)로 이용하는 행위",
            "사례금 지급이나 반려동물 반환을 빌미로 금전을 요구하거나 이용자를 기망하는 행위",
            "검색엔진 색인 목적을 넘어서 서비스의 게시물이나 보호 공고 데이터를 자동화된 수단으로 대량 수집·복제하여 재배포하거나 영리적으로 이용하는 행위",
            "타인을 비방·모욕하거나 혐오·불법 정보를 게시하는 행위",
            "동물의 학대·유기·불법 거래를 조장하거나 이에 이용될 수 있는 정보를 게시하는 행위",
            "서비스의 정상적인 운영을 방해하거나 시스템에 부당한 부하를 유발하는 행위",
          ]}
        />
      </Section>

      <Section id="copyright" no={8} title="게시물의 저작권과 이용 허락">
        <Bullets
          items={[
            "이용자가 등록한 게시물의 저작권은 해당 이용자에게 있습니다.",
            "이용자는 게시물을 등록함으로써 운영자에게 서비스의 운영·노출·개선을 위해 필요한 범위에서 게시물을 사용·복제·전송·전시할 수 있는 무상의 이용 권한을 부여합니다. 여기에는 검색엔진 색인을 위한 노출, 공유 시 미리보기 생성, 목록·RSS 제공이 포함됩니다.",
            "운영자는 위 목적 범위를 넘어 게시물을 상업적으로 이용하지 않으며, 그 밖의 용도로 사용하려는 경우 사전에 이용자의 동의를 받습니다.",
            "이용자는 자신이 등록한 게시물에 대해 제3자의 권리를 침해하지 않았음을 보증하며, 이와 관련하여 분쟁이 발생하면 그 책임을 부담합니다.",
          ]}
        />
      </Section>

      <Section id="disclosure" no={9} title="게시물의 공개 범위">
        <div className="rounded-lg border border-waiting/40 bg-waiting/10 p-4 text-foreground">
          <p className="font-semibold">
            실종 신고 게시글과 목격 제보는 로그인하지 않은 누구에게나 공개됩니다.
          </p>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            게시글에 입력한 휴대전화번호, 실종 장소와 좌표, 사진, 상세 설명, 그리고 목격 제보에
            포함된 제보 위치와 제보자 닉네임이 여기에 해당합니다. 해당 페이지는 검색엔진 색인 대상에
            포함되므로 서비스 외부에도 노출·복제될 수 있습니다. 자세한 내용은{" "}
            <Link href="/privacy#public" className="underline underline-offset-2">
              개인정보 처리방침 제3조
            </Link>
            를 확인하시고, 공개되어도 무방한 정보만 입력해 주십시오.
          </p>
        </div>
        <p>
          이용자는 게시글을 삭제하거나 상태를 변경하여 노출을 조절할 수 있습니다. 다만 이미 외부에
          복제된 정보까지 운영자가 회수할 수는 없습니다.
        </p>
      </Section>

      <Section id="moderation" no={10} title="게시물의 관리">
        <Bullets
          items={[
            "운영자는 게시물이 법령을 위반하거나 제7조의 금지 행위에 해당하는 경우, 타인의 권리를 침해한다는 신고가 접수된 경우 해당 게시물을 삭제하거나 비공개 처리할 수 있습니다.",
            "긴급하게 조치할 필요가 있는 경우 사전 통지 없이 조치한 뒤 이용자에게 알릴 수 있습니다.",
            <span key="m1">
              게시물이 삭제되면 서비스 화면과 API 응답에서 즉시 제외되지만, 데이터베이스에는 삭제
              표시가 기록된 상태로 남습니다. 자세한 내용은{" "}
              <Link href="/privacy#retention" className="underline underline-offset-2">
                개인정보 처리방침 제4조
              </Link>
              에 기재되어 있습니다.
            </span>,
            "권리 침해를 이유로 게시물의 삭제를 요청하려면 침해 사실을 소명할 수 있는 자료와 함께 제6조의 문의처로 연락해 주십시오.",
          ]}
        />
      </Section>

      <Section id="publicdata" no={11} title="공공데이터의 제공과 정확성">
        <Bullets
          items={[
            <span key="p1">
              서비스가 제공하는 유기동물 보호 공고는 농림축산식품부 국가동물보호정보시스템(동물보호관리시스템)의
              공공데이터를 공공데이터포털을 통해 제공받아 주기적으로 동기화한 것입니다. 원본은{" "}
              <Ext href="https://www.animal.go.kr">animal.go.kr</Ext>에서 확인할 수 있습니다.
            </span>,
            "보호 공고 정보의 원저작권과 최종 책임은 해당 공공기관에 있으며, 운영자는 이를 가공하지 않고 전달하는 것을 원칙으로 합니다.",
            "동기화 주기와 원본 갱신 시차로 인해 보호소의 실제 상황과 다를 수 있습니다. 보호 중인 동물의 현재 상태, 공고 기간, 반환·입양 절차는 반드시 해당 보호소나 관할 지방자치단체에 직접 확인해 주십시오.",
            "운영자는 보호 공고 정보의 정확성·완전성·최신성을 보증하지 않으며, 해당 정보에 의존하여 발생한 결과에 대해 책임을 지지 않습니다.",
          ]}
        />
      </Section>

      <Section id="location" no={12} title="위치정보의 이용">
        <Bullets
          items={[
            "실종 게시글의 실종 지점 좌표는 이용자가 지도에서 직접 선택한 값입니다.",
            "목격 제보 기능은 브라우저의 위치 권한을 사용하여 제보 시점의 단말 위치를 좌표로 전송합니다. 이 좌표는 제보 내용과 함께 공개됩니다.",
            "이용자는 브라우저 설정에서 위치 권한을 거부할 수 있습니다. 다만 위치를 제공하지 않으면 목격 제보 기능을 이용할 수 없습니다.",
            "탐색 반경과 도보 도달범위는 통계와 경로 데이터를 바탕으로 계산한 참고 정보이며, 실제 반려동물의 이동 범위를 보장하지 않습니다.",
          ]}
        />
      </Section>

      <Section id="ads" no={13} title="광고의 게재">
        <Bullets
          items={[
            "운영자는 서비스 운영과 유지에 필요한 비용을 충당하기 위해 서비스 화면에 광고를 게재할 수 있습니다.",
            <span key="a1">
              광고는 Google AdSense, 카카오 AdFit 등 제3자 광고 네트워크를 통해 제공되며, 이 과정에서
              쿠키가 사용됩니다. 쿠키의 사용과 거부 방법은{" "}
              <Link href="/privacy#cookies" className="underline underline-offset-2">
                개인정보 처리방침 제7조
              </Link>
              에 안내되어 있습니다.
            </span>,
            "광고에 표시된 상품이나 서비스는 광고주가 제공하는 것으로, 운영자는 광고주와 이용자 사이의 거래에 관여하지 않으며 그로 인한 손해에 대해 책임을 지지 않습니다.",
          ]}
        />
      </Section>

      <Section id="availability" no={14} title="서비스의 변경과 중단">
        <Bullets
          items={[
            "운영자는 서비스의 내용을 변경하거나 일부 또는 전부를 중단할 수 있으며, 이 경우 변경·중단 사유와 일자를 사전에 서비스 내에 공지합니다.",
            "시스템 점검·교체·고장, 통신 두절, 외부 서비스(소셜 로그인, 지도, 공공데이터 API 등)의 장애, 천재지변 등 부득이한 사유가 있는 경우 예고 없이 서비스가 일시 중단될 수 있으며, 이 경우 사후에 공지합니다.",
            "서비스는 무료로 제공되므로, 운영자는 무상 서비스의 변경·중단으로 발생한 손해에 대해 관련 법령에 특별한 규정이 없는 한 책임을 지지 않습니다.",
          ]}
        />
      </Section>

      <Section id="disclaimer" no={15} title="면책">
        <Bullets
          items={[
            "운영자는 이용자가 등록한 게시물의 진실성·정확성을 확인하지 않으며 이를 보증하지 않습니다. 게시물의 내용에 대한 책임은 게시한 이용자에게 있습니다.",
            "운영자는 서비스를 매개로 한 이용자 간 또는 이용자와 제3자 간의 연락·만남·금전 거래(사례금 지급 등)에 관여하지 않으며, 그 과정에서 발생한 분쟁이나 손해에 대해 책임을 지지 않습니다.",
            "운영자는 서비스 이용을 통해 실종된 반려동물을 찾을 수 있다는 결과를 보장하지 않습니다.",
            "운영자는 이용자의 귀책사유로 발생한 서비스 이용 장애에 대해 책임을 지지 않습니다.",
            "운영자는 고의 또는 중대한 과실이 없는 한 이 약관에서 정한 범위에서 책임을 부담합니다.",
          ]}
        />
      </Section>

      <Section id="jurisdiction" no={16} title="준거법과 관할">
        <p>
          이 약관과 서비스 이용에 관하여는 대한민국 법령을 적용합니다. 서비스 이용과 관련하여 분쟁이
          발생한 경우 운영자와 이용자는 성실히 협의하여 해결하며, 협의가 이루어지지 않을 경우
          민사소송법에 따른 관할 법원에 소를 제기할 수 있습니다.
        </p>
      </Section>

      <section className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-bold">부칙</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>이 약관은 {EFFECTIVE_DATE}부터 시행합니다.</p>
          <div className="rounded-lg border p-4">
            <p className="font-semibold text-foreground">변경 이력</p>
            <ul className="mt-2 space-y-1">
              <li>
                {EFFECTIVE_DATE} — 마이페이지 회원 탈퇴 기능 도입에 따라 제6조(이용계약의 해지) 개정.
                이용자가 문의처를 거치지 않고 직접 해지할 수 있게 된 개정이므로 제3조의 7일 공지에
                따릅니다.
              </li>
              <li>{ENACTED_DATE} — 최초 제정</li>
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-10 rounded-md border p-4 text-sm">
        <p className="font-bold">함께 보기</p>
        <p className="mt-1 text-muted-foreground">
          개인정보의 수집·이용과 광고 쿠키에 관한 안내는{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            개인정보 처리방침
          </Link>
          을, 서비스 이용 방법과 제도 관련 문의는{" "}
          <Link href="/faq" className="underline underline-offset-2">
            자주 묻는 질문
          </Link>
          을 참고하세요.
        </p>
      </div>
    </main>
  );
}
