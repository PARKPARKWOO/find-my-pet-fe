import type { Metadata } from "next";
import Image from "next/image";
import { getAllPosts, test } from "@/lib/parsePost";
import image from "@/static/image/posts_banner.jpg";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SITE_DOMAIN = "https://findmypet.platformholder.site";
const PAGE_URL = `${SITE_DOMAIN}/posts`;
const TITLE = "반려동물 실종 예방·대처 자료실";
const DESC =
  "반려견 실종 시 대처법, 반려묘가 집을 나가는 이유, 산책 중 도망 예방까지 — 실종을 막고 빠르게 찾기 위해 알아야 할 정보를 정리했습니다.";

/**
 * 이 페이지에 `metadata` 가 없어 루트 layout 의 사이트 기본값을 그대로 상속했다.
 * 그 결과 홈과 제목·설명이 **완전히 동일**해져 검색엔진이 두 페이지를 구분하지 못했다.
 */
export const metadata: Metadata = {
  title: `${TITLE} | 파인드마이펫`,
  description: DESC,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    siteName: "파인드마이펫",
    locale: "ko_KR",
    title: `${TITLE} | 파인드마이펫`,
    description: DESC,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} | 파인드마이펫`,
    description: DESC,
    images: ["/og.jpg"],
  },
};

export type PostMatter = {
  title: string;
  subtitle: string;
  description: string;
  date: string;
  thumbnail: string;
};

export type Post = PostMatter & {
  slug: string;
  content: string;
};
export type Test = PostMatter & {
  slug: string;
};




// ✅ Server Component 적용
export default async function PostPage() {
  let posts = await test();
  posts = posts.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  const truncate = (str:string, limit_length: number) => {
    return str.length > limit_length ? str.substring(0, limit_length) + '...' : str;
}

  return (
    <div className="flex flex-col w-full items-center gap-6">
      {/* ✅ 배너 영역 */}
      <div className="w-full flex justify-center">
        <div className="sm:w-[60%] w-[90%] h-[250px] rounded-md border flex">
          <div className="flex justify-center items-center relative w-full h-full ">
            <Image
              src={image}
              layout="fill"
              objectFit="contain"
              alt="banner image"
              placeholder="blur"
            />
          </div>
          <div className="w-full h-full md:p-6 p-3 flex flex-col justify-center items-end md:gap-6 gap-3 break-keep">
            {/* 배너 문구가 이 화면의 유일한 제목이었는데 <p> 라 문서에 h1 이 없었다. */}
            <h1 className="font-bold md:text-xl lg:text-2xl text-sm text-right">{TITLE}</h1>
            <p className="text-xs md:text-sm text-content-secondary text-right">
              소중한 반려동물을 위해 꼭 알아야 할 정보를 제공합니다.
            </p>
          </div>
          <ul className="w-full">
        </ul>
        </div>
      </div>
      <section className='flex flex-col w-full items-center justify-center gap-10 my-20'>
                <div className='grid 2xl:grid-cols-3 lg:grid-cols-2 xl:gap-8 grid-cols-1 gap-10'>
                    {
                        posts.map((post) => {
                            return (
                                <>
                                    <div className='xs:w-[390px] rounded-md flex flex-col bg-surface-canvas justify-between'>
                                        <div className='flex justify-center'>
                                          <div className="flex justify-center items-center relative w-full h-[220px] rounded-md">
                                              <Image src={post.thumbnail} layout="fill" objectFit="cover" alt={`${post.title} logo`} className="rounded-md"/>
                                            </div>
                                        </div>
                                        <div className="p-6 flex flex-col justify-start gap-4">
                                            <span className='font-bold text-xl'>{post.title}</span>
                                            <p className="h-[100px] text-sm">{truncate(post.description, 120)}</p>
                                            <div className='w-full flex justify-end'>
                                                <Link aria-label={`Go to ${post.title} post`} href={post.slug}>
                                                    <button aria-label={`Go to ${post.title} post`} className='bg-surface-raised border-none w-[80px] h-[40px] rounded-md cursor-pointer hover:bg-forest/10 transition-all ease-linear duration-200 flex justify-center items-center'>
                                                    <ArrowRight />
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )
                        })
                    }
                </div>
            </section>
    </div>
  );
}
