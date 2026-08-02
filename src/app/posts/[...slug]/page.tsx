import { getAllPosts } from "@/lib/parsePost";
import { CustomMDX } from "@/app/_components/CustomMDX";

const SITE_DOMAIN = "https://findmypet.platformholder.site";

/** 썸네일은 상대경로일 수 있다. OG 이미지는 절대 URL 이어야 수집기가 읽는다. */
function toAbsolute(url: string | undefined): string {
  if (!url) return `${SITE_DOMAIN}/og.jpg`;
  return url.startsWith("http") ? url : `${SITE_DOMAIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function generateMetadata({ params }: { params: { slug: string[] } }) {
  const { slug } = params;

  const _slug = "/posts/" + [...slug].join("/");
  const posts = await getAllPosts()
  const post = posts.find((v) => v.slug === _slug);

  if (!post) {
    return {};
  }

  // 이전에는 title·description 과 og:title·og:description 만 있었다. canonical 이 없어
  // 루트 layout 의 사이트 캐노니컬(홈)을 상속했고, og:url·og:image·twitter 도 비어 있었다.
  const url = `${SITE_DOMAIN}${post.slug}`;
  const image = toAbsolute(post.thumbnail);

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      siteName: "파인드마이펫",
      locale: "ko_KR",
      title: post.title,
      description: post.description,
      images: [{ url: image, alt: post.title }],
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

/**
 * catch-all 세그먼트는 `{ slug: string[] }` 를 돌려줘야 한다. 기존 코드는 `"/posts/foo"`
 * 라는 **문자열**을 그대로 반환해서 Next 가 어떤 경로도 정적 생성하지 못했고, 아티클이
 * 전부 요청 시 렌더로 떨어졌다. 빌드 산출물에 HTML 이 하나도 없던 이유다.
 */
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug.replace(/^\/posts\//, "").split("/"),
  }));
}

export default async function PostPage({ params }: { params: { slug: string[] } }) {
  const { slug } = params;
  const _slug = "/posts/" + [...slug].join("/");
  const posts = await getAllPosts()
  const post = posts.find((v) => v.slug === _slug);
  if (post === undefined) {
    return <div>Not Found</div>;
  }

  const url = `${SITE_DOMAIN}${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    url,
    image: toAbsolute(post.thumbnail),
    datePublished: post.date,
    inLanguage: "ko-KR",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: "파인드마이펫", url: SITE_DOMAIN },
    publisher: { "@id": `${SITE_DOMAIN}/#organization` },
  };

  return (
    <article className="flex-col items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="flex flex-col gap-1 mb-[80px]">
        {/* 제목이 <div> 라 문서에 h1 이 없었다. 본문 최상위 헤딩은 MDX 의 ## 였다. */}
        <h1 className="sm:text-5xl font-semibold text-2xl">{post.title}</h1>
        <p className="text-medium text-gray-500 dark:text-gray-300">{post.subtitle}</p>
        <div className="flex gap-1">
          <time
            dateTime={post.date}
            className="text-xs font-light text-gray-600 dark:text-gray-300"
          >
            {post.date}
          </time>
        </div>
      </div>
      <CustomMDX source={post.content} />
    </article>
  );
}
