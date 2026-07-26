import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalBullets as Bullets,
  LegalExternalLink as Ext,
  LegalSection as Section,
  LegalSubHeading,
  LegalTable as Table,
  LegalToc,
} from "@/app/_components/legal/LegalDoc";
import { ADSENSE_CLIENT } from "@/app/_components/ads/adsenseClient";

/**
 * 아직 켜지지 않은 처리를 "현재 하고 있다"고 적으면 그건 이용자를 오인시키는 허위 기재다.
 * 특히 국외 이전 표는 법 §28조의8 고지 항목이라 더 그렇다.
 *
 * 그래서 문서가 **광고 로더와 같은 스위치**를 본다. 이 페이지는 서버 컴포넌트이므로 로더가 읽는
 * 것과 똑같은 env 를 읽을 수 있다 — 코드가 켜지는 순간 문서도 켜지고, 두 번 다시 어긋나지 않는다.
 * (수동으로 문장을 관리하면 반드시 어긋난다. 실제로 발행 직전 검토에서 이 상태로 잡혔다.)
 */
const GA_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS);
const ADSENSE_ENABLED = Boolean(ADSENSE_CLIENT);

const SITE_DOMAIN = "https://findmypet.platformholder.site";
const PAGE_URL = `${SITE_DOMAIN}/privacy`;
const TITLE = "개인정보 처리방침";
const DESC =
  "파인드마이펫이 수집하는 개인정보 항목, 이용 목적, 보유 기간, 제3자 제공·처리위탁·국외 이전, 광고 쿠키 사용과 거부 방법, 정보주체의 권리 행사 방법을 안내합니다.";

/** 시행일. 방침을 고칠 때마다 EFFECTIVE_DATE 를 올리고 14항 변경 이력에 한 줄을 남긴다. */
const EFFECTIVE_DATE = "2026년 7월 26일";

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
  { id: "purpose", label: "제1조 개인정보의 처리 목적" },
  { id: "items", label: "제2조 처리하는 개인정보의 항목" },
  { id: "public", label: "제3조 게시물의 공개 범위와 주의사항" },
  { id: "retention", label: "제4조 개인정보의 보유·이용 기간 및 파기" },
  { id: "third-party", label: "제5조 개인정보의 제3자 제공 및 처리위탁" },
  { id: "overseas", label: "제6조 개인정보의 국외 이전" },
  { id: "cookies", label: "제7조 쿠키 등 자동수집장치와 광고" },
  { id: "rights", label: "제8조 정보주체의 권리와 행사 방법" },
  { id: "children", label: "제9조 만 14세 미만 아동의 개인정보" },
  { id: "safety", label: "제10조 안전성 확보 조치" },
  { id: "automated", label: "제11조 자동화된 결정" },
  { id: "officer", label: "제12조 개인정보 보호책임자 및 문의처" },
  { id: "remedy", label: "제13조 권익침해 구제 방법" },
  { id: "changes", label: "제14조 처리방침의 변경" },
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 pb-24">
      <h1 className="text-2xl font-bold">개인정보 처리방침</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        파인드마이펫(이하 &ldquo;서비스&rdquo;)은 「개인정보 보호법」에 따라 이용자의 개인정보를
        보호하고 이와 관련한 고충을 신속하게 처리하기 위하여 다음과 같이 개인정보 처리방침을
        수립·공개합니다.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        이 방침은 <b className="text-foreground">서비스가 실제로 수행하고 있는 처리만</b> 기재합니다.
        아직 갖추지 못한 절차는 갖추지 못한 상태 그대로 적었으며, 해당 항목은 각 조에서 그 사실을
        밝혔습니다.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        시행일: {EFFECTIVE_DATE} (최초 제정)
      </p>

      <LegalToc items={TOC} />

      <Section id="purpose" no={1} title="개인정보의 처리 목적">
        <p>서비스는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
        <Bullets
          items={[
            "카카오 소셜 로그인을 통한 회원 식별 및 로그인 상태 유지",
            "실종 동물 신고 게시글의 등록·수정·삭제와 작성자 본인 확인",
            "실종 동물 정보와 보호자 연락처의 공개 게시 및 목격자와의 연결",
            "목격 제보의 등록과 제보 위치의 지도 표시",
            "실종 지점을 기준으로 한 탐색 반경 및 도보 도달범위 계산",
            "전단지 부착 위치의 기록·관리",
            "즐겨찾기한 게시글의 상태 변경, 목격 제보 등록, 관심 지역의 신규 보호 공고에 대한 서비스 내 알림 발송",
            "공공데이터 기반 유기동물 보호 공고 정보 제공",
            "서비스 이용 통계 분석 및 광고 게재",
          ]}
        />
      </Section>

      <Section id="items" no={2} title="처리하는 개인정보의 항목">
        <LegalSubHeading>
          1. 회원 가입 시 (카카오 소셜 로그인)
        </LegalSubHeading>
        <p>
          서비스는 별도의 회원가입 양식을 두지 않으며, 카카오 로그인 시 카카오로부터 다음 정보를
          제공받습니다.
        </p>
        <Table
          head={["항목", "구분", "출처 및 비고"]}
          rows={[
            ["카카오 회원번호", "필수", "소셜 계정과 서비스 회원을 연결하기 위한 식별자"],
            [
              "닉네임",
              "필수",
              "카카오 프로필 닉네임. 게시글·목격 제보의 작성자명으로 함께 저장·표시됩니다.",
            ],
            [
              "이메일",
              "선택",
              "카카오가 유효성과 인증 여부를 확인한 경우에만 제공됩니다. 그렇지 않은 계정은 빈 값으로 저장됩니다.",
            ],
          ]}
        />
        <p>
          서비스는 카카오로부터 전화번호, 생년월일, 성별, 연령대, 연계정보(CI), 프로필 사진을
          제공받지 않습니다.
        </p>

        <LegalSubHeading>
          2. 서비스 이용 과정에서 이용자가 입력·제공하는 정보
        </LegalSubHeading>
        <Table
          head={["기능", "처리하는 항목", "공개 여부"]}
          rows={[
            [
              "실종 신고 게시글 등록",
              "보호자 휴대전화번호, 실종 장소 주소, 실종 지점 좌표(위도·경도), 실종 시각, 제목과 상세 설명, 동물의 성별, 사례금, 카카오 오픈채팅 주소(선택), 사진 최대 3장",
              "전체 공개",
            ],
            [
              "목격 제보",
              "제보 시점에 브라우저가 제공하는 제보자 단말의 현재 위치(위도·경도), 제보 메모, 제보자 닉네임",
              "전체 공개",
            ],
            [
              "전단지 부착 위치 등록",
              "부착 지점 좌표, 메모, 등록자 식별자",
              "기본 비공개. 이용자가 직접 공개로 전환한 건만 공개",
            ],
            ["즐겨찾기", "회원 식별자, 게시글 식별자", "비공개"],
            [
              "관심 지역 구독",
              "회원 식별자, 시도·시군구 코드, 동물 종류",
              "비공개",
            ],
            [
              "서비스 알림",
              "회원 식별자, 알림 제목·내용·연결 링크",
              "비공개(본인만 조회)",
            ],
          ]}
          minWidth={620}
        />
        <p>
          제목과 상세 설명은 자유 서술 항목이므로 이용자가 입력한 내용에 따라 위 표에 없는
          개인정보가 포함될 수 있습니다. 공개 게시판이라는 점을 고려하여 필요한 정보만 입력해
          주십시오.
        </p>

        <LegalSubHeading>3. 자동으로 생성·수집되는 정보</LegalSubHeading>
        <Bullets
          items={[
            "서비스 애플리케이션은 이용자의 IP 주소, 브라우저 정보(User-Agent), 방문 기록을 자체적으로 수집하거나 데이터베이스에 저장하지 않습니다.",
            "다만 서비스가 이용하는 호스팅·네트워크 인프라(제5조의 Vercel 및 자체 운영 게이트웨이)에는 통상적인 접속 로그가 남을 수 있습니다.",
            <span key="b1">
              제7조에 기재한 광고·분석·지도 스크립트는 이용자 브라우저에서 직접 실행되며, 서비스를
              거치지 않고 해당 사업자가 쿠키·광고 식별자·IP 주소·페이지 정보를 수집합니다.
            </span>,
          ]}
        />

        <LegalSubHeading>
          4. 이용자 브라우저에만 저장되는 정보
        </LegalSubHeading>
        <Bullets
          items={[
            "로그인한 이용자의 표시용 프로필(이메일, 닉네임, 권한)을 브라우저 로컬 저장소에 보관합니다. 로그아웃하거나 인증이 만료되면 삭제됩니다.",
            "전단지 만들기 화면에서 입력한 초안(제목, 장소, 시각, 전화번호, 사례금, 설명)을 브라우저 로컬 저장소에 보관합니다. 이 정보는 서버로 전송되지 않으며, 새로 저장하면 덮어써집니다. 자동 만료는 없으므로 공용 PC에서 이용한 경우 브라우저 저장소를 직접 비워 주십시오.",
          ]}
        />
      </Section>

      <Section id="public" no={3} title="게시물의 공개 범위와 주의사항">
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-foreground">
          <p className="font-semibold">실종 신고 게시글은 누구에게나 공개됩니다.</p>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            게시글에 입력한 <b className="text-foreground">휴대전화번호</b>, 실종 장소와 좌표, 실종
            시각, 사진, 상세 설명은 로그인하지 않은 이용자를 포함해 누구나 열람할 수 있습니다.
            게시글 상세 페이지는 검색엔진 색인 대상에 포함되며, 서비스는 인공지능 학습·검색용
            크롤러의 접근도 허용하고 있습니다. 따라서 게시 즉시 서비스 외부에도 노출·복제될 수
            있습니다.
          </p>
        </div>
        <Bullets
          items={[
            "게시글 상태를 '찾음'으로 변경하면 상세 화면에서 전화번호가 가려지지만, 서비스 API 응답에서는 여전히 조회될 수 있습니다. 완전한 비공개를 원하시면 게시글을 삭제하거나 제12조의 문의처로 요청해 주십시오.",
            "목격 제보는 제보자 단말의 실시간 위치와 제보자 닉네임이 함께 공개됩니다. 위치 제공을 원하지 않으면 브라우저의 위치 권한을 거부해 주십시오. 제보 자체를 하지 않는 것 외에 위치만 제외하고 제보하는 방법은 현재 제공하지 않습니다.",
            "전단지 부착 위치는 기본적으로 작성자 본인에게만 보이며, 이용자가 직접 '공개'로 전환한 항목만 다른 이용자에게 노출됩니다.",
            "게시글에 첨부한 사진의 조회 주소는 발급 후 1시간이 지나면 만료됩니다. 다만 만료 전에 주소를 확보한 사람은 만료 시점까지 사진에 접근할 수 있습니다.",
          ]}
        />
      </Section>

      <Section id="retention" no={4} title="개인정보의 보유·이용 기간 및 파기">
        <p>
          서비스는 개인정보의 처리 목적이 달성된 경우 지체 없이 파기하는 것을 원칙으로 합니다. 다만
          현재 서비스의 실제 운영 상태는 다음과 같으며, 이용자가 정확히 알 수 있도록 그대로
          기재합니다.
        </p>
        <Bullets
          items={[
            <span key="b2">
              <b className="text-foreground">보유 기간이 경과한 개인정보를 자동으로 파기하는 별도의
              배치 처리를 운영하고 있지 않습니다.</b> 회원 정보와 게시물은 이용자의 삭제 요청이나
              게시물 삭제가 있을 때 처리됩니다.
            </span>,
            "이용자가 게시글, 목격 제보, 전단지 위치, 즐겨찾기, 관심 지역 구독을 삭제하면 서비스 화면과 API 응답에서 즉시 제외되지만, 데이터베이스에는 삭제 표시가 기록된 상태로 남습니다(물리적 삭제가 아닙니다).",
            "게시글을 삭제하더라도 업로드된 사진 원본 파일은 저장소에 남아 있을 수 있습니다. 다만 사진 조회 주소는 1시간 뒤 만료되므로 새로 발급받지 않으면 접근할 수 없습니다.",
            "데이터베이스에 남은 기록의 완전 삭제를 원하시는 경우 제12조의 문의처로 요청해 주시면 확인 후 개별적으로 처리합니다.",
            "서비스는 결제·거래를 취급하지 않으므로 전자상거래법 등에 따라 별도로 보존해야 하는 거래 기록이 없습니다.",
          ]}
        />
        <p>
          파기 시에는 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 삭제하며, 별도의 출력물 형태로
          개인정보를 보관하지 않습니다.
        </p>
      </Section>

      <Section id="third-party" no={5} title="개인정보의 제3자 제공 및 처리위탁">
        <p>
          서비스는 이용자의 개인정보를 판매하거나 마케팅 목적으로 제3자에게 이전하지 않습니다. 다만
          서비스 제공과 광고 게재를 위해 다음 사업자의 서비스를 이용하고 있으며, 이 과정에서 아래
          정보가 해당 사업자에게 전달되거나 해당 사업자가 이용자 브라우저에서 직접 정보를 수집합니다.
        </p>
        <Table
          head={["사업자", "이용 목적", "전달·수집되는 정보", "정책"]}
          rows={[
            [
              "Vercel Inc.",
              "웹사이트 호스팅 및 콘텐츠 전송",
              "모든 페이지 요청이 경유하므로 접속 IP, 브라우저 정보, 요청 경로 등 접속기록이 해당 사업자 로그에 기록됩니다.",
              <Ext key="v" href="https://vercel.com/legal/privacy-policy">
                보기
              </Ext>,
            ],
            ...(ADSENSE_ENABLED
              ? [
                  [
                    "Google LLC (AdSense)",
                    "광고 게재 및 광고 성과 측정",
                    "쿠키·광고 식별자, IP 주소, 조회한 페이지 정보 (브라우저에서 직접 수집)",
                    <Ext key="g" href="https://policies.google.com/technologies/partner-sites">
                      보기
                    </Ext>,
                  ],
                ]
              : []),
            ...(GA_ENABLED
              ? [
                  [
                    "Google LLC (Analytics)",
                    "서비스 이용 통계 분석",
                    "쿠키, IP 주소, 조회한 페이지 정보 (브라우저에서 직접 수집)",
                    <Ext key="ga" href="https://policies.google.com/privacy">
                      보기
                    </Ext>,
                  ],
                ]
              : []),
            [
              "주식회사 카카오 (AdFit)",
              "광고 게재",
              "쿠키·식별자, IP 주소, 조회한 페이지 정보 (브라우저에서 직접 수집)",
              <Ext key="kf" href="https://www.kakao.com/policy/privacy">
                보기
              </Ext>,
            ],
            [
              "주식회사 카카오 (로그인·지도·공유)",
              "소셜 로그인, 지도 표시, 게시글 공유",
              "로그인 시 카카오가 회원번호·닉네임·이메일을 서비스에 제공합니다. 지도 이용 시 브라우저의 IP·접속 정보가 카카오에 전달되며, 공유 버튼을 누르면 게시글 제목·설명·대표 이미지 주소·링크가 카카오에 전달됩니다.",
              <Ext key="k" href="https://www.kakao.com/policy/privacy">
                보기
              </Ext>,
            ],
            [
              "openrouteservice (HeiGIT gGmbH, 독일)",
              "실종 지점 기준 도보 도달범위 계산",
              "실종 지점의 좌표와 반경 값만 전송하며, 이용자를 식별할 수 있는 정보는 함께 보내지 않습니다.",
              <Ext key="o" href="https://openrouteservice.org/privacy-policy/">
                보기
              </Ext>,
            ],
          ]}
          minWidth={680}
        />
        <p>
          이 밖에 회원 인증 서버, API 게이트웨이, 사진 저장소는 파인드마이펫과 동일한 운영자가 직접
          운영하는 인프라이며 외부에 위탁하지 않습니다. 법령에 특별한 규정이 있거나 수사기관이
          적법한 절차에 따라 요구하는 경우에는 관련 법령에 따라 제공할 수 있습니다.
        </p>
      </Section>

      <Section id="overseas" no={6} title="개인정보의 국외 이전">
        <p>
          서비스는 다음과 같이 개인정보를 국외로 이전하고 있습니다. 이전 시기와 방법은 모두{" "}
          <b className="text-foreground">이용자가 서비스에 접속하거나 해당 기능을 이용하는 시점에
          네트워크를 통해 전송</b>하는 방식입니다.
        </p>
        <Table
          head={["이전받는 자", "이전 국가", "이전 항목", "이용 목적 및 보유 기간"]}
          rows={[
            [
              "Vercel Inc.",
              "미국",
              "접속 IP, 브라우저 정보, 요청 경로 등 접속기록",
              "웹사이트 호스팅. 보유 기간은 해당 사업자의 정책에 따릅니다.",
            ],
            ...(ADSENSE_ENABLED || GA_ENABLED
              ? [
                  [
                    "Google LLC",
                    "미국 및 Google이 서버를 운영하는 국가",
                    "쿠키·광고 식별자, IP 주소, 조회한 페이지 정보",
                    "광고 게재·측정 및 이용 통계 분석. 보유 기간은 해당 사업자의 정책에 따릅니다.",
                  ],
                ]
              : []),
            [
              "HeiGIT gGmbH (openrouteservice)",
              "독일",
              "실종 지점 좌표와 반경 값 (이용자 식별정보 미포함)",
              "도보 도달범위 계산. 응답 후 별도 보관하지 않습니다.",
            ],
          ]}
          minWidth={680}
        />
        <p>
          국외 이전을 원하지 않으시는 경우, 광고·분석 목적의 이전은 제7조의 방법으로 쿠키를
          차단하거나 개인 맞춤 광고를 해제하여 제한할 수 있습니다. 다만 호스팅을 통한 이전은 서비스
          접속 자체에 수반되므로 서비스 이용을 중단하는 것 외에 거부할 수 있는 방법이 없습니다.
        </p>
      </Section>

      <Section id="cookies" no={7} title="쿠키 등 자동수집장치의 운영과 광고">
        <LegalSubHeading>1. 서비스가 직접 사용하는 쿠키</LegalSubHeading>
        <Table
          head={["쿠키", "목적", "비고"]}
          rows={[
            [
              "accessToken",
              "로그인 상태 인증",
              "HttpOnly·Secure 속성이 적용되어 자바스크립트로 읽을 수 없습니다.",
            ],
            [
              "refreshToken",
              "인증 토큰의 자동 갱신",
              "만료되거나 갱신에 실패하면 두 쿠키가 삭제되고 로그아웃 처리됩니다.",
            ],
          ]}
        />
        <p>
          두 쿠키는 로그인 유지에 필수적이며, 유효 기간은 서버 설정값에 따릅니다. 브라우저에서 이
          쿠키를 차단하면 로그인 기능을 이용할 수 없습니다.
        </p>

        <LegalSubHeading>2. 광고 및 분석 쿠키</LegalSubHeading>
        <Bullets
          items={[
            "제3자 공급업체(Google 포함)는 이용자의 이전 웹사이트 방문 기록을 바탕으로 광고를 게재하기 위해 쿠키를 사용합니다.",
            "Google이 광고 쿠키를 사용함으로써 Google과 그 파트너는 이 사이트 및/또는 인터넷상의 다른 사이트 방문 기록을 바탕으로 이용자에게 광고를 게재할 수 있습니다.",
            <span key="b3">
              이용자는 Google{" "}
              <Ext href="https://www.google.com/settings/ads">광고 설정</Ext>에서 개인 맞춤 광고를
              선택 해제할 수 있습니다. Google 외 제3자 공급업체의 쿠키 사용을 해제하려면{" "}
              <Ext href="https://www.aboutads.info/choices/">www.aboutads.info</Ext>를 방문하십시오.
            </span>,
            <span key="b4">
              서비스가 이용하는 광고 네트워크는{" "}
              {ADSENSE_ENABLED && (
                <>
                  <b className="text-foreground">Google AdSense</b>(
                  <Ext href="https://policies.google.com/technologies/ads">정책</Ext>)와{" "}
                </>
              )}
              <b className="text-foreground">카카오 AdFit</b>(
              <Ext href="https://www.kakao.com/policy/privacy">정책</Ext>)입니다. 각 사업자의 쿠키
              사용에 대한 자세한 내용은 해당 사이트에서 확인하실 수 있습니다.
            </span>,
            // Google 광고 설정과 aboutads.info 는 카카오를 커버하지 않는다. 지금 실제로 로드되는
            // 유일한 광고 스크립트가 AdFit 이므로, 거부 경로가 빠지면 법 §30①7 의 "거부에 관한
            // 사항"이 정작 유일한 트래커에 대해서만 비어 있게 된다.
            <span key="b-adfit">
              카카오 AdFit 의 맞춤형 광고는 카카오계정 설정의 광고 설정에서 맞춤형 광고 수신 동의를
              해제하여 거부할 수 있습니다. 자세한 내용은 카카오{" "}
              <Ext href="https://www.kakao.com/policy/privacy">개인정보 처리방침</Ext>을 참고하십시오.
            </span>,
            ...(GA_ENABLED
              ? [
                  <span key="b5">
                    서비스 이용 통계를 위해 Google Analytics를 사용합니다.{" "}
                    <Ext href="https://tools.google.com/dlpage/gaoptout">
                      Google Analytics 차단 브라우저 부가기능
                    </Ext>
                    을 설치하면 수집을 거부할 수 있습니다.
                  </span>,
                ]
              : []),
          ]}
        />

        <LegalSubHeading>3. 쿠키 거부 방법</LegalSubHeading>
        <p>
          이용자는 웹브라우저의 설정에서 쿠키 저장을 거부하거나 저장된 쿠키를 삭제할 수 있습니다.
        </p>
        <Bullets
          items={[
            "Chrome: 설정 → 개인정보 보호 및 보안 → 서드 파티 쿠키",
            "Safari: 환경설정 → 개인정보 보호 → 쿠키 및 웹사이트 데이터",
            "Edge: 설정 → 쿠키 및 사이트 권한 → 쿠키 및 사이트 데이터 관리",
          ]}
        />
      </Section>

      <Section id="rights" no={8} title="정보주체와 법정대리인의 권리와 행사 방법">
        <p>
          이용자는 언제든지 개인정보의 열람, 정정, 삭제, 처리정지를 요구할 수 있으며, 만 14세 미만
          아동의 경우 법정대리인이 이를 대리할 수 있습니다. 위임에 의한 대리 행사도 가능하며, 이
          경우 개인정보 보호법 시행규칙에 따른 위임장을 제출해야 합니다.
        </p>
        <LegalSubHeading>서비스 내에서 직접 할 수 있는 것</LegalSubHeading>
        <Bullets
          items={[
            "본인이 작성한 게시글·목격 제보·전단지 위치의 수정 및 삭제",
            "즐겨찾기와 관심 지역 구독의 해제",
            "로그아웃(브라우저에 저장된 프로필 정보와 인증 쿠키가 삭제됩니다)",
          ]}
        />
        <LegalSubHeading>
          문의처를 통해 요청해야 하는 것
        </LegalSubHeading>
        <Bullets
          items={[
            <span key="b6">
              <b className="text-foreground">회원 탈퇴.</b> 현재 서비스 화면에는 회원 탈퇴 기능이
              없습니다. 탈퇴와 회원정보 삭제를 원하시면 제12조의 문의처로 요청해 주십시오.
            </span>,
            "카카오로부터 제공받아 저장된 회원정보(닉네임·이메일)의 열람 및 정정",
            "삭제 표시만 남아 있는 게시물·제보 기록의 완전 삭제",
            "개인정보 처리의 정지 요구",
          ]}
        />
        <p>
          요청은 제12조의 이메일로 접수하며, 접수 후 지체 없이 처리하고 처리 결과를 회신합니다.
          다른 사람의 생명·신체를 해할 우려가 있거나 재산과 그 밖의 이익을 부당하게 침해할 우려가
          있는 경우 등 법령에서 정한 사유가 있으면 요청이 제한될 수 있으며, 이 경우 그 사유와 불복
          방법을 함께 안내합니다.
        </p>
      </Section>

      <Section id="children" no={9} title="만 14세 미만 아동의 개인정보">
        <p>
          서비스는 만 14세 미만 아동의 회원 가입을 권장하지 않습니다. 다만 카카오 로그인 과정에서
          연령 정보를 제공받지 않기 때문에{" "}
          <b className="text-foreground">시스템적으로 연령을 확인하는 절차는 두고 있지 않습니다.</b>{" "}
          만 14세 미만 아동이 법정대리인의 동의 없이 개인정보를 제공한 사실을 확인하게 되면 해당
          정보를 지체 없이 파기하며, 법정대리인은 제12조의 문의처로 확인·삭제를 요청할 수 있습니다.
        </p>
      </Section>

      <Section id="safety" no={10} title="안전성 확보 조치">
        <p>서비스는 개인정보 보호를 위해 다음과 같은 조치를 시행하고 있습니다.</p>
        <Bullets
          items={[
            "인증 토큰은 자바스크립트가 접근할 수 없는 HttpOnly·Secure 쿠키로만 전달하며, 브라우저 저장소에 토큰을 보관하지 않습니다.",
            "모든 통신 구간에 HTTPS를 적용합니다.",
            "게시글·목격 제보·전단지 위치의 수정과 삭제는 작성자 본인 여부를 서버에서 확인한 뒤에만 허용합니다.",
            "업로드된 사진은 저장소에서 직접 공개되지 않고, 유효 기간 1시간의 서명된 조회 주소를 통해서만 제공됩니다.",
            "관리자 권한은 서비스 운영자에게만 부여합니다.",
          ]}
        />
        <p className="text-xs">
          서비스는 개인정보 처리 이력에 대한 별도의 감사 로그 시스템, 저장 데이터의 암호화, 물리적
          접근 통제 설비를 아직 갖추고 있지 않습니다. 실제로 시행하지 않는 조치를 기재하지 않기 위해
          이 사실을 함께 밝힙니다.
        </p>
      </Section>

      <Section id="automated" no={11} title="자동화된 결정">
        <p>
          서비스는 이용자의 개인정보를 이용하여 이용자에게 법적 효력이나 그에 준하는 영향을 미치는
          완전히 자동화된 결정을 하지 않습니다. 개인 맞춤 광고는 제5조의 광고 사업자가 자체적으로
          수행하며, 해당 광고의 해제 방법은 제7조에 안내되어 있습니다.
        </p>
      </Section>

      <Section id="officer" no={12} title="개인정보 보호책임자 및 문의처">
        <p>
          개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 문의·불만
          처리·피해 구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <Table
          head={["구분", "내용"]}
          rows={[
            ["개인정보 보호책임자", "박우영"],
            [
              "연락처",
              <a key="m" href="mailto:wy9295@naver.com" className="underline underline-offset-2">
                wy9295@naver.com
              </a>,
            ],
            [
              "접수 범위",
              "개인정보 열람·정정·삭제·처리정지 요구, 회원 탈퇴 요청, 게시물 삭제 요청, 개인정보 관련 문의 및 신고",
            ],
          ]}
          minWidth={420}
        />
        <p className="text-xs">
          서비스는 개인 운영 서비스로 별도의 고객센터 전화번호를 운영하지 않으며, 모든 문의는 위
          이메일로 접수합니다.
        </p>
      </Section>

      <Section id="remedy" no={13} title="권익침해 구제 방법">
        <p>
          개인정보 침해로 인한 상담·피해 구제가 필요하신 경우 아래 기관에 문의하실 수 있습니다.
        </p>
        <Table
          head={["기관", "전화", "웹사이트"]}
          rows={[
            [
              "개인정보 분쟁조정위원회",
              "1833-6972",
              <Ext key="a" href="https://www.kopico.go.kr">
                kopico.go.kr
              </Ext>,
            ],
            [
              "개인정보침해 신고센터",
              "118",
              <Ext key="b" href="https://privacy.kisa.or.kr">
                privacy.kisa.or.kr
              </Ext>,
            ],
            [
              "대검찰청 사이버수사과",
              "1301",
              <Ext key="c" href="https://www.spo.go.kr">
                spo.go.kr
              </Ext>,
            ],
            [
              "경찰청 사이버범죄 신고시스템",
              "182",
              <Ext key="d" href="https://ecrm.police.go.kr">
                ecrm.police.go.kr
              </Ext>,
            ],
          ]}
          minWidth={460}
        />
      </Section>

      <Section id="changes" no={14} title="처리방침의 변경">
        <p>
          이 개인정보 처리방침은 {EFFECTIVE_DATE}부터 적용됩니다. 법령이나 서비스 내용의 변경에 따라
          방침을 개정하는 경우 시행 7일 전부터 서비스 내 공지를 통해 알리며, 이용자의 권리에 중대한
          영향을 미치는 변경은 시행 30일 전에 알립니다.
        </p>
        <div className="rounded-lg border p-4">
          <p className="font-semibold text-foreground">변경 이력</p>
          <ul className="mt-2 space-y-1">
            <li>{EFFECTIVE_DATE} — 최초 제정</li>
          </ul>
        </div>
      </Section>

      <div className="mt-10 rounded-md border p-4 text-sm">
        <p className="font-bold">함께 보기</p>
        <p className="mt-1 text-muted-foreground">
          서비스 이용 조건과 게시물·공공데이터에 관한 안내는{" "}
          <Link href="/terms" className="underline underline-offset-2">
            이용약관
          </Link>
          을, 실종·유기동물 제도에 대한 문의는{" "}
          <Link href="/faq" className="underline underline-offset-2">
            자주 묻는 질문
          </Link>
          을 참고하세요.
        </p>
      </div>
    </main>
  );
}
